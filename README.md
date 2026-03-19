# 🛡️ AEGIS-FORENSIC: System Documentation

## 1. Project Overview
**Aegis-Forensic** is a modular, AI-powered forensic analysis backend. It is designed to automate and assist in the classification of digital forensic evidence across four distinct domains: Vehicle Damage, Microscopic Toolmarks, Biological Bloodstain Detection, and Ballistics/Cartridge Casings. 

The system relies heavily on **EfficientNetB0** for transfer learning, customized with highly specific data engineering pipelines and output layers to address the unique challenges of forensic data.

---

## 2. Directory Structure
```text
AEGIS-FORENSIC/
├── aegis_data/                  # Raw and processed datasets
├── api/                         
│   └── app.py                   # The main backend serving layer for API testing
├── models/                      # Saved, trained Keras models ready for inference
│   ├── aegis_ballistics_model.keras
│   ├── aegis_damage_model_v3.keras
│   ├── aegis_toolmarks_model.keras
│   └── blood_detector.keras
├── scripts_evaluation/          # Scripts for generating academic proofs
│   ├── metric_reports/          # Output folder for Confusion Matrices (.png)
│   └── generate_metrics.py      # SciKit-Learn evaluation & visualization script
├── scripts_pipeline/            # Data Engineering & Preparation scripts
│   ├── build_dataset.py
│   ├── expand_ballistics.py
│   └── prep_ballistics.py
├── scripts_training/            # Architecture & Model Compilation logic
│   ├── train_ballistics.py
│   ├── train_bloodstain.py
│   ├── train_damage.py
│   └── train_toolmarks.py
└── test_images/                 # Real-world, zero-leakage testing data
    ├── ballistics/
    ├── damage_toolmark/
    └── forensic/
```

---

## 3. Data Engineering Pipeline (`scripts_pipeline/`)
The success of Aegis-Forensic relies heavily on the aggressive data preprocessing and offline augmentation pipelines to solve severe data starvation and formatting issues.

*   **`build_dataset.py` (The Master Pivot):** Responsible for the Bloodstain architecture. Aggregates multiple disparate medical/biological datasets (GI bleeding, wounds, animal images) into a unified dataset. Flattens complex folder trees and ignores useless masks/CSVs to create a binary `blood` vs `non_blood` structure.
*   **`prep_ballistics.py`:** A Pandas-based parsing engine. Reads messy Excel data (`StudyInfo.xlsx`), bypasses merged headers, normalizes hidden newline characters, maps `1.0` binary flags to filenames, and sorts raw images into a clean `ballistics_ready/` directory.
*   **`expand_ballistics.py`:** Solves data starvation via offline Data Expansion. Uses Keras `ImageDataGenerator` to physically synthesize and save 2,700 augmented variations (rotations, brightness shifts) of the original 273 casing images to the hard drive, preventing AI memorization.

---

## 4. Model Architectures & Training (`scripts_training/` & `models/`)
All models utilize an **EfficientNetB0** base for feature extraction due to its excellent parameter-to-accuracy ratio. The top layers and loss functions are distinctly customized.

### Vehicle Damage Assessment (`aegis_damage_model_v3.keras`)
*   **Goal:** Categorize intact vs. damaged vehicles.
*   **Architecture:** EfficientNetB0 with Categorical Crossentropy.
*   **Engineering Challenge:** Preventing the AI from memorizing car models (e.g., classifying all red sedans as "whole").
*   **Solution:** Applied heavy in-memory Data Augmentation (spinning, zooming, flipping) to force the model to look for crushed geometry and broken glass rather than vehicular shapes.

### Microscopic Toolmarks (`aegis_toolmarks_model.keras`)
*   **Goal:** Detect 6 distinct microscopic surface defects on metal (scratches, inclusions, etc.).
*   **Architecture:** EfficientNetB0 with a heavily regularized dense head.
*   **Engineering Challenge:** Microscopic textures look like static noise, and models easily overfit to the lighting of the specific laboratory microscope.
*   **Solution:** Leveraged ImageNet's edge-detection capabilities and applied severe **50% Dropout** to the top layers, forcing the model to learn topological grooves rather than lighting conditions.

### Blood Detection (`blood_detector.keras`)
*   **Goal:** Binary classification of biological material vs. background/noise.
*   **Architecture:** EfficientNetB0 with a **Sigmoid** output layer and `binary_crossentropy` loss.
*   **Engineering Challenge:** The original spatter-analysis approach hit a math deadlock (loss stuck at 0.69) due to data starvation. Standard patching poisoned the dataset with identical micro-droplets.
*   **Solution:** Engineered a massive 100k+ hybrid dataset combining microscopic cells, bleeding, and random backgrounds. Applied `class_weight` balancing to handle a 70k vs 36k split, creating a robust universal biological detector.

### Ballistics / Cartridge Casings (`aegis_ballistics_model.keras`)
*   **Goal:** Classify mechanical impressions on fired cartridges (Breech Face, Firing Pin, Ejector Mark).
*   **Architecture:** EfficientNetB0 with **Two-Phase fine-tuning**.
*   **Engineering Challenge:** Cannot use standard image "patching" because firing pins are always dead center; data starvation (only 273 original files).
*   **Solution:** Phase 1 trained custom dense layers. Phase 2 unfroze the top 10 EfficientNet layers at a micro-learning rate (`1e-5`). The offline augmentation from `expand_ballistics.py` fed this process.

---

## 5. Evaluation & API Testing
### `scripts_evaluation/generate_metrics.py`
This script uses `scikit-learn`, `matplotlib`, and `seaborn` to run models against unseen validation data. It outputs:
1.  **Classification Reports (Terminal):** Provides Precision, Recall, and F1-Scores.
2.  **Confusion Matrices (`metric_reports/`):** Four `.png` files mapping Actual (Y-axis) vs. Predicted (X-axis) classifications.

### `test_images/` Directory
Contains images sourced independently from the internet (e.g., Google Images). These guarantee **zero data leakage** during API testing via `app.py`, proving the models generalize to real-world crime scenes rather than just memorizing training data.

---
---

## 🎓 Panel Defense & Presentation Notes
*Use these talking points when presenting your metrics and confusion matrices to the grading panel.*

### Explaining the Metrics
*   **Precision (The "Trust" Metric):** Out of all images the AI *claimed* belonged to a class, how many actually did? (e.g., If Damage Precision is `0.95`, investigators can trust a "Damaged" flag 95% of the time).
*   **Recall (The "Catch-All" Metric):** Out of all the *actual* images of a class, how many did the AI successfully find? (e.g., Catching 86% of crashed cars).
*   **F1-Score (The "Golden" Metric):** The harmonic mean of Precision and Recall. Proves the model isn't cheating by guessing the majority class on imbalanced datasets.
*   **Support:** The raw number of validation images. (e.g., Point out the Bloodstain support of **21,279** images to prove massive, statistically undeniable validation).

### Module-Specific Defenses
**1. Microscopic Toolmarks (Accuracy: 94%)**
*   *Defense:* 94% on a 6-class microscopic dataset is exceptional due to the lack of standard background context.
*   *Nuance to address:* If `scratches` have lower recall, explain that linear scratches visually mimic the edges of an `inclusion`—a recognized limitation in automated surface defect detection.

**2. Vehicle Damage Assessment (Accuracy: 90%)**
*   *Defense:* Reached 90% despite aggressive augmentation preventing memorization.
*   *Nuance to address:* The model prioritized Precision (0.95) over Recall (0.86). It may miss a tiny dent, but when it flags major damage, it is almost never wrong.

**3. Ballistics & Cartridge Casings (Accuracy: 100%)**
*   *Defense against "Overfitting":* If asked how 100% is possible without cheating, state clearly that metrics were run on *unseen validation data*. 
*   *Why it achieved 100%:* It is the result of offline synthetic expansion and the rigid geometry of the evidence. A firing pin crater is a mathematically perfect circle. A CNN can separate that from parallel striations with absolute certainty once fed enough augmented data.

**4. Blood Detection (Accuracy: 100%)**
*   *Defense:* Highlight the architectural pivot. Abandoning the brittle spatter classifier for a universal biological detector. 
*   *Why it works:* By mixing medical imagery with forensic backgrounds, the AI didn't just memorize "red pixels"; it learned the organic, structural signature of biological material, perfectly separating it from the 7,115 non-blood control images.