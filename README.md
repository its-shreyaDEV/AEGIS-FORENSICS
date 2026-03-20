
---

# AEGIS-FORENSICS

## AI-Powered Digital Forensic Analysis Platform

**Aegis-Forensics** is a modular, full-stack forensic intelligence system designed to automate evidence classification using deep learning. It combines a **React + Vite frontend** with a **FastAPI backend**, powered by **transfer learning (EfficientNetB0)**.

---

# SYSTEM OVERVIEW

-  Automated forensic evidence classification
-  FastAPI backend for real-time inference
-  Deep learning models (Keras / TensorFlow)
-  Gamified, animated React frontend
-  Evidence hashing (SHA-256 simulation)
-  Modular and extensible architecture

---

#  PART 1: BACKEND ARCHITECTURE (AI CORE)

##  Directory Structure

```bash
AEGIS-FORENSIC/
├── aegis_data/                  # Raw & processed datasets
├── api/
│   └── app.py                  # FastAPI backend
├── models/                     # Trained models (Keras)
│   ├── aegis_ballistics_model.keras
│   ├── aegis_damage_model_v3.keras
│   ├── aegis_toolmarks_model.keras
│   └── blood_detector.keras
├── scripts_evaluation/         # Metrics & validation scripts
├── scripts_pipeline/           # Data preprocessing pipelines
├── scripts_training/           # Model training logic
└── test_images/                # Real-world unseen test data
```

---

##  Data Engineering Pipeline

### 🔹 `build_dataset.py` (Master Pipeline)

- Aggregates multiple datasets
- Converts into **binary classification (blood vs non-blood)**
- Ensures consistency across sources

### 🔹 `prep_ballistics.py`

- Cleans Excel-based datasets
- Converts boolean flags → structured directories

### 🔹 `expand_ballistics.py`

- Solves low-data problem
- Generates **2,700 augmented images** from 273 originals

---

## Model Architectures

### Vehicle Damage Detection

- Type: Binary Classification (Whole vs Damaged)
- Strategy: Heavy augmentation
- Accuracy: **~90%**

---

### Microscopic Toolmark Analysis

- Type: 6-Class Classification
- Strategy: **50% Dropout** to prevent lighting bias
- Accuracy: **~94%**

---

### Blood Detection

- Type: Binary Classification
- Dataset: **100k+ hybrid dataset**
- Improvement: Replaced fragile spatter-based approach
- Accuracy: **100%**

---

### Ballistics / Cartridge Analysis

- Type: 3-Class Classification
- Strategy: Two-phase fine-tuning (low LR)
- Accuracy: **100%**

---

## Model Evaluation (For Defense)

### ✔️ Precision (Trust Metric)

> If Precision = 0.95 → 95% of "positive" predictions are correct
> 

---

### ✔️ F1 Score (Golden Metric)

- Balances Precision & Recall
- Ensures model is **not biased toward majority class**

---

### ✔️ Defending 100% Accuracy

- Achieved on **unseen validation data**
- Justified by:
    - Synthetic data expansion
    - Deterministic physical patterns
    - Example: firing pin impressions = geometric consistency

---

# PART 2: FRONTEND ARCHITECTURE (React + Vite)

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## Component Architecture

```bash
src/
├── App.jsx
├── components/
│   ├── HyperspeedBackground
│   ├── TopNav
│   ├── StatsBar
│   ├── AnimatedUploadZone
│   ├── TiltedEvidenceCard
│   ├── LetterGlitchHash
│   └── ResultsPanel
```

---

## Core Components

### `App.jsx`

- Root state manager
- Stores:
    - File
    - URL
    - Hash

---

### HyperspeedBackground

- Canvas-based animated grid
- Particle streak effects

---

### TopNav

- Sticky navigation bar
- Animated logo + signal bars

---

### StatsBar

- 4 key metrics
- Count-up animation

---

### AnimatedUploadZone

- Drag-and-drop UI
- Electric border effects
- Real-time SHA-256 hashing

---

### TiltedEvidenceCard

- 3D mouse tracking
- Built using **Framer Motion springs**

---

### LetterGlitchHash

- Glitch-style hash reveal
- Character-by-character animation

---

### ResultsPanel

- Displays:
    - Evidence preview
    - Hash
    - CNN confidence bars
    - Timeline

---

## Key Packages

| Package | Purpose |
| --- | --- |
| framer-motion | Animations (springs, transitions) |
| lucide-react | Icons (Upload, Shield, CPU, etc.) |
| tailwindcss | Styling system |

---

## Advanced UI Techniques

- Noise grain overlay → SVG `feTurbulence`
- Glass morphism → `backdrop-filter: blur(20px)`
- 3D tilt effect → `rotateX`, `rotateY`, `perspective`
- Smooth physics animations → `useSpring`

---
