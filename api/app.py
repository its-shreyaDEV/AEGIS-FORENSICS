from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import tensorflow as tf
import numpy as np
import cv2
import hashlib
import os

#Directory Locations for models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

MODELS = {
    "damage": {
        "path": os.path.join(MODEL_DIR, "aegis_damage_model_v3.keras"), 
        "model": None, 
        "classes": ['00-damage', '01-whole'],
        "output_type": "categorical"
    },
    "toolmarks": {
        "path": os.path.join(MODEL_DIR, "aegis_toolmarks_model.keras"), 
        "model": None, 
        "classes": ['crazing', 'inclusion', 'patches', 'pitted_surface', 'rolled-in_scale', 'scratches'],
        "output_type": "categorical"
    },
    "bloodstain": {
        "path": os.path.join(MODEL_DIR, "blood_detector.keras"), 
        "model": None, 
        "classes": ['Non-Blood', 'Blood'],
        "output_type": "binary"
    },
    "ballistics": {
        "path": os.path.join(MODEL_DIR, "aegis_ballistics_model.keras"), 
        "model": None, 
        "classes": ['Breech_Face', 'Ejector_Mark', 'Firing_Pin'],
        "output_type": "categorical"
    }
}

#Modern FastAPI lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing Aegis-Forensics AI Core")
    for key, config in MODELS.items():
        try:
            MODELS[key]["model"] = tf.keras.models.load_model(config["path"])
            print(f"Loaded {key.upper()} module into RAM.")
        except Exception as e:
            print(f"Could not load {key} module. Error: {e}")
    yield
    print("Shutting down system")

app = FastAPI(title="Aegis-Forensics AI Core", version="3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Backend Prediction Model Handling
@app.post("/analyze")
async def analyze_evidence(file: UploadFile = File(...), module_type: str = Form(...)):
    if module_type not in MODELS:
        raise HTTPException(status_code=400, detail="Invalid forensic module selected.")
        
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    target_module = MODELS[module_type]

    if target_module["model"] is None:
        raise HTTPException(status_code=500, detail=f"{module_type.upper()} model is offline.")

    try:
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img_array = np.expand_dims(img, axis=0)

        predictions = target_module["model"].predict(img_array)
        
        if target_module["output_type"] == "binary":
            score = float(predictions[0][0])
            predicted_class_index = 1 if score > 0.5 else 0
            confidence_score = score if score > 0.5 else (1.0 - score)
        else:
            predicted_class_index = np.argmax(predictions[0]) 
            confidence_score = float(predictions[0][predicted_class_index])

        predicted_class_name = target_module["classes"][predicted_class_index]

        return {
            "filename": file.filename,
            "hash": file_hash,
            "prediction": predicted_class_name.replace("_", " "),
            "confidence": round(confidence_score, 4),
            "module_used": module_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")