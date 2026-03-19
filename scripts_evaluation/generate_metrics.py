import os
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix

#Model Details
MODELS_CONFIG = [
    {
        "name": "Ballistics",
        "model_path": "../models/aegis_ballistics_model.keras",
        "data_dir": "../aegis_data/ballistics_ready",
        "label_mode": "categorical",
        "needs_split": True #All images in one folder, needs 80/20 split
    },
    {
        "name": "Damage",
        "model_path": "../models/aegis_damage_model_v3.keras",
        "data_dir": "../aegis_data/damage/data1a/validation",
        "label_mode": "categorical",
        "needs_split": False #Already split by dataset creator
    },
    {
        "name": "Toolmarks",
        "model_path": "../models/aegis_toolmarks_model.keras",
        "data_dir": "../aegis_data/toolmarks/NEU-DET/validation/images", 
        "label_mode": "categorical",
        "needs_split": False #Already split by dataset creator
    },
    {
        "name": "Bloodstain",
        "model_path": "../models/blood_detector.keras",
        "data_dir": "../aegis_data/bloodstain_dataset",
        "label_mode": "binary",
        "needs_split": True #All images in one folder, needs 80/20 split
    }
]

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32

os.makedirs("metric_reports", exist_ok=True)


#BATCH EVALUATION LOOP
for config in MODELS_CONFIG:
    model_name = config["name"]
    print(f"\n{'='*50}")
    print(f" INITIATING PIPELINE FOR: {model_name.upper()}")
    print(f"{'='*50}")

    if not os.path.exists(config["model_path"]) or not os.path.exists(config["data_dir"]):
        print(f"[ERROR] Skipping {model_name}. Files or directories not found.")
        continue

    print(f"Loading Model:{config['model_path']}...")
    model = tf.keras.models.load_model(config["model_path"])
    print(f"Loading Data from:{config['data_dir']}...")
    
 
    if config["needs_split"]:
        val_dataset = tf.keras.utils.image_dataset_from_directory(
            config["data_dir"], validation_split=0.2, subset="validation", seed=123,
            image_size=IMAGE_SIZE, batch_size=BATCH_SIZE, label_mode=config["label_mode"]
        )
    else:
        val_dataset = tf.keras.utils.image_dataset_from_directory(
            config["data_dir"], seed=123,
            image_size=IMAGE_SIZE, batch_size=BATCH_SIZE, label_mode=config["label_mode"]
        )

    class_names = val_dataset.class_names
    print(f"Detected Classes: {class_names}")
    y_true = []
    y_pred = []

    print(f"Running for {model_name}.")
    for images, labels in val_dataset:
        raw_preds = model.predict(images, verbose=0)
        if config["label_mode"] == "categorical":
            y_true.extend(np.argmax(labels.numpy(), axis=1))
            y_pred.extend(np.argmax(raw_preds, axis=1))
        elif config["label_mode"] == "binary":
            y_true.extend(labels.numpy().astype(int).flatten())
            y_pred.extend((raw_preds > 0.5).astype(int).flatten())

    unique_labels = list(range(len(class_names)))
    print(f"\n{model_name.upper()} CLASSIFICATION REPORT ")
    print(classification_report(y_true, y_pred, target_names=class_names, labels=unique_labels, zero_division=0))
    print(f"Generating Confusion Matrix Graphic for {model_name}...")
    cm = confusion_matrix(y_true, y_pred, labels=unique_labels)

    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title(f'Aegis Core: {model_name} Confusion Matrix', pad=20, fontsize=16)
    plt.ylabel('Actual Forensic Class', fontsize=12)
    plt.xlabel('Predicted Class', fontsize=12)
    plt.tight_layout()

    output_filename = f"metric_reports/{model_name.lower()}_confusion_matrix.png"
    plt.savefig(output_filename, dpi=300)
    plt.close()
    print(f"Saved metric image to: {output_filename}")

    tf.keras.backend.clear_session()
    print(f"Memory cleared. Ready for next module.")

print("\nALL DIAGNOSTIC REPORTS GENERATED SUCCESSFULLY!")