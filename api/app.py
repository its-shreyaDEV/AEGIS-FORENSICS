from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import tensorflow as tf
import numpy as np
import hashlib
import os
import sqlite3
from datetime import datetime
from PIL import Image, ExifTags
import io
import cv2
import pandas as pd
from deepface import DeepFace

# Directory Locations
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")
SUSPECT_DB_DIR = os.path.join(BASE_DIR, "suspect_database")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads") # New directory for storing evidence images

# FIX: Create directories immediately so StaticFiles doesn't crash on startup
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SUSPECT_DB_DIR, exist_ok=True)

MODELS = {
    "damage": {
        "path": os.path.join(MODEL_DIR, "aegis_damage_model_v3.keras"), 
        "classes":['00-damage', '01-whole'],
        "output_type": "categorical",
        "model": None
    },
    "toolmarks": {
        "path": os.path.join(MODEL_DIR, "aegis_toolmarks_model.keras"), 
        "classes":['crazing', 'inclusion', 'patches', 'pitted_surface', 'rolled-in_scale', 'scratches'],
        "output_type": "categorical",
        "model": None
    },
    "bloodstain": {
        "path": os.path.join(MODEL_DIR, "blood_detector.keras"), 
        "classes": ['Non-Biological / Background', 'Biological / Bloodstain Confirmed'],
        "output_type": "binary",
        "model": None
    },
    "ballistics": {
        "path": os.path.join(MODEL_DIR, "aegis_ballistics_model.keras"), 
        "classes": ['Breech_Face', 'Firing_Pin'],
        "output_type": "categorical",
        "model": None
    }
}

# 1. Database Initialization (Updated with case_num and file_path)
def init_db():
    conn = sqlite3.connect("ledger.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS evidence_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_num TEXT,
            filename TEXT,
            file_path TEXT,
            officer_name TEXT,
            timestamp TEXT,
            sha256_hash TEXT,
            module_used TEXT,
            prediction TEXT,
            confidence REAL
        )
    ''')
    conn.commit()
    conn.close()

# 2. EXIF Extraction
def extract_exif_data(image):
    metadata = {"device_model": "Unknown", "timestamp": "Unknown", "gps_found": False}
    try:
        exif = image._getexif()
        if not exif: return metadata
        for tag_id, value in exif.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            if tag == "Model": metadata["device_model"] = str(value)
            elif tag == "DateTimeOriginal": metadata["timestamp"] = str(value)
            elif tag == "GPSInfo": metadata["gps_found"] = True
    except Exception:
        pass
    return metadata

# Modern FastAPI lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing Aegis-Forensics AI Core")
    init_db()
    
    # Ensure directories exist
    os.makedirs(SUSPECT_DB_DIR, exist_ok=True)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print("Directories verified. Immutable Ledger Database Initialized.")
    
    # Load AI Models
    for key, config in MODELS.items():
        try:
            MODELS[key]["model"] = tf.keras.models.load_model(config["path"])
            print(f"Loaded {key.upper()} module into RAM.")
        except Exception as e:
            print(f"Could not load {key} module. Error: {e}")
    yield
    print("Shutting down system")

app = FastAPI(title="Aegis-Forensics AI Core", version="5.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the uploads directory so React can display the images in the Evidence Modal
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# -------------------------------------------------------------------
# Core Analysis Endpoint (Vehicle, Blood, Ballistics, Toolmarks)
# -------------------------------------------------------------------
@app.post("/analyze")
async def analyze_evidence(
    request: Request,
    file: UploadFile = File(...), 
    module_type: str = Form(...),
    officer_name: str = Form("Unknown Officer"),
    case_num: str = Form("CAS-UNKNOWN") # Added case number
):
    if module_type not in MODELS:
        raise HTTPException(status_code=400, detail="Invalid forensic module selected.")
        
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    
    # Save the file permanently so the frontend can display it later
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    saved_filename = f"{file_hash[:12]}{ext}"
    file_location = os.path.join(UPLOAD_DIR, saved_filename)
    with open(file_location, "wb") as f:
        f.write(contents)
        
    # Generate the URL for the frontend
    base_url = str(request.base_url).rstrip("/")
    file_url = f"{base_url}/uploads/{saved_filename}"

    target_module = MODELS[module_type]
    if target_module["model"] is None:
        raise HTTPException(status_code=500, detail=f"{module_type.upper()} model is offline.")

    try:
        # Image Processing & EXIF
        image = Image.open(io.BytesIO(contents))
        extracted_meta = extract_exif_data(image)
        
        image = image.convert("RGB")
        image = image.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(image)
        img_array = tf.expand_dims(img_array, axis=0)

        # AI Inference
        predictions = target_module["model"].predict(img_array)
        
        if target_module["output_type"] == "binary":
            score = float(predictions[0][0])
            predicted_class_index = 1 if score > 0.5 else 0
            confidence_score = score if score > 0.5 else (1.0 - score)
        else:
            predicted_class_index = np.argmax(predictions[0]) 
            confidence_score = float(predictions[0][predicted_class_index])

        predicted_class_name = target_module["classes"][predicted_class_index]
        confidence_percent = round(confidence_score * 100, 2)

        # Seal the record in the SQLite Database
        conn = sqlite3.connect("ledger.db")
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO evidence_ledger (case_num, filename, file_path, officer_name, timestamp, sha256_hash, module_used, prediction, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (case_num, file.filename, file_url, officer_name, datetime.now().isoformat(), file_hash, module_type, predicted_class_name, confidence_percent))
        conn.commit()
        conn.close()

        return {
            "case_num": case_num,
            "filename": file.filename,
            "file_path": file_url,
            "hash": file_hash,
            "prediction": predicted_class_name.replace("_", " "),
            "confidence": confidence_percent,
            "module_used": module_type,
            "metadata": extracted_meta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")

# -------------------------------------------------------------------
# Facial Recognition Endpoint (DeepFace) - UPDATED TO FACENET
# -------------------------------------------------------------------
@app.post("/analyze-face")
async def analyze_face(
    request: Request,
    file: UploadFile = File(...),
    officer_name: str = Form("Unknown Officer"),
    case_num: str = Form("CAS-UNKNOWN")
):
    try:
        contents = await file.read()
        file_hash = hashlib.sha256(contents).hexdigest()
        
        # Save the file permanently
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        saved_filename = f"{file_hash[:12]}{ext}"
        file_location = os.path.join(UPLOAD_DIR, saved_filename)
        with open(file_location, "wb") as f:
            f.write(contents)
            
        base_url = str(request.base_url).rstrip("/")
        file_url = f"{base_url}/uploads/{saved_filename}"

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode the uploaded image.")

        # Run DeepFace with Facenet
        try:
            dfs = DeepFace.find(
                img_path=img, 
                db_path=SUSPECT_DB_DIR, 
                model_name="Facenet",         # Switched to Facenet for better accuracy
                enforce_detection=False,      # Prevents crashing if face is slightly angled/blurry
                silent=True
            )
        except ValueError:
            dfs =[] # No face detected

        match_name = "NO MATCH FOUND"
        match_confidence = 0.0

        for df in dfs:
            if not df.empty:
                best_match = df.iloc[0]
                matched_file_path = best_match['identity']
                match_name = os.path.basename(matched_file_path).split('.')[0].replace("_", " ").upper()
                distance = best_match['distance']
                match_confidence = max(0.0, round((1.0 - distance) * 100, 2))
                break # Just take the primary face match for the ledger

        # SEAL TO SQLITE LEDGER
        conn = sqlite3.connect("ledger.db")
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO evidence_ledger (case_num, filename, file_path, officer_name, timestamp, sha256_hash, module_used, prediction, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (case_num, file.filename, file_url, officer_name, datetime.now().isoformat(), file_hash, "Facial Recognition", match_name, match_confidence))
        conn.commit()
        conn.close()

        return {
            "case_num": case_num,
            "filename": file.filename,
            "file_path": file_url,
            "hash": file_hash,
            "prediction": match_name,
            "confidence": match_confidence,
            "module_used": "Facial Recognition",
            "faces_detected": 1 if match_confidence > 0 else 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Facial Analysis Error: {str(e)}")

# -------------------------------------------------------------------
# Ledger Retrieval Endpoint
# -------------------------------------------------------------------
@app.get("/get-ledger")
async def get_ledger():
    try:
        conn = sqlite3.connect("ledger.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence_ledger ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")