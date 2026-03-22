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
from deepface import DeepFace

# ── Paths ──────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR      = os.path.join(BASE_DIR, "models")
SUSPECT_DB_DIR = os.path.join(BASE_DIR, "suspect_database")
UPLOAD_DIR     = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR,     exist_ok=True)
os.makedirs(SUSPECT_DB_DIR, exist_ok=True)

FACENET_THRESHOLD = 0.40

# ── Forensic models ────────────────────────────────────────────────
MODELS = {
    "damage":     {"path": os.path.join(MODEL_DIR, "aegis_damage_model_v3.keras"),  "classes": ['00-damage', '01-whole'],                                                            "output_type": "categorical", "model": None},
    "toolmarks":  {"path": os.path.join(MODEL_DIR, "aegis_toolmarks_model.keras"),  "classes": ['crazing', 'inclusion', 'patches', 'pitted_surface', 'rolled-in_scale', 'scratches'],"output_type": "categorical", "model": None},
    "bloodstain": {"path": os.path.join(MODEL_DIR, "blood_detector.keras"),          "classes": ['Non-Biological / Background', 'Biological / Bloodstain Confirmed'],               "output_type": "binary",      "model": None},
    "ballistics": {"path": os.path.join(MODEL_DIR, "aegis_ballistics_model.keras"),  "classes": ['Breech_Face', 'Firing_Pin'],                                                       "output_type": "categorical", "model": None},
}

# ── DB ─────────────────────────────────────────────────────────────
DB_PATH = os.path.join(BASE_DIR, "ledger.db")
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS evidence_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT, case_num TEXT, filename TEXT,
        file_path TEXT, officer_name TEXT, timestamp TEXT, sha256_hash TEXT,
        module_used TEXT, prediction TEXT, confidence REAL, integrity TEXT DEFAULT 'unverified'
    )''')
    # Add integrity column to pre-existing tables
    try:
        c.execute("ALTER TABLE evidence_ledger ADD COLUMN integrity TEXT DEFAULT 'unverified'")
    except Exception:
        pass
    c.execute('''CREATE TABLE IF NOT EXISTS suspect_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT, case_num TEXT, officer_name TEXT,
        timestamp TEXT, probe_filename TEXT, probe_file_path TEXT, probe_hash TEXT,
        matched_suspect TEXT, distance REAL, confidence REAL, verdict TEXT, threshold_used REAL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS integrity_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, evidence_id INTEGER, case_num TEXT,
        officer_name TEXT, timestamp TEXT, original_hash TEXT, recomputed_hash TEXT,
        file_path TEXT, result TEXT, flagged INTEGER DEFAULT 0
    )''')
    conn.commit()
    conn.close()

def extract_exif_data(image):
    meta = {"device_model": "Unknown", "timestamp": "Unknown", "gps_found": False}
    try:
        exif = image._getexif()
        if not exif: return meta
        for tag_id, value in exif.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            if   tag == "Model":            meta["device_model"] = str(value)
            elif tag == "DateTimeOriginal": meta["timestamp"]    = str(value)
            elif tag == "GPSInfo":          meta["gps_found"]    = True
    except Exception:
        pass
    return meta

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing Aegis-Forensics AI Core v7")
    init_db()
    for key, cfg in MODELS.items():
        try:
            MODELS[key]["model"] = tf.keras.models.load_model(cfg["path"])
            print(f"  + Loaded {key.upper()}")
        except Exception as e:
            print(f"  - {key} offline: {e}")
    yield
    print("Aegis shutdown")

app = FastAPI(title="Aegis-Forensics", version="7.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Static mounts ──────────────────────────────────────────────────
app.mount("/uploads",  StaticFiles(directory=UPLOAD_DIR),     name="uploads")
app.mount("/suspects", StaticFiles(directory=SUSPECT_DB_DIR), name="suspects")  # FIX: was missing

def save_upload(contents: bytes, original_filename: str, request: Request):
    file_hash      = hashlib.sha256(contents).hexdigest()
    ext            = os.path.splitext(original_filename)[1] or ".jpg"
    saved_filename = f"{file_hash[:12]}{ext}"
    file_location  = os.path.join(UPLOAD_DIR, saved_filename)
    with open(file_location, "wb") as f:
        f.write(contents)
    base_url = str(request.base_url).rstrip("/")
    return file_location, f"{base_url}/uploads/{saved_filename}", file_hash


# ══════════════════════════════════════════════════════════════════
# /analyze
# ══════════════════════════════════════════════════════════════════
@app.post("/analyze")
async def analyze_evidence(
    request: Request, file: UploadFile = File(...),
    module_type: str = Form(...), officer_name: str = Form("Unknown Officer"),
    case_num: str = Form("CAS-UNKNOWN")
):
    if module_type not in MODELS:
        raise HTTPException(400, "Invalid module.")
    contents = await file.read()
    _, file_url, file_hash = save_upload(contents, file.filename, request)
    target = MODELS[module_type]
    if target["model"] is None:
        raise HTTPException(500, f"{module_type} model offline.")
    try:
        image = Image.open(io.BytesIO(contents))
        meta  = extract_exif_data(image)
        image = image.convert("RGB").resize((224, 224))
        arr   = tf.expand_dims(tf.keras.preprocessing.image.img_to_array(image), 0)
        preds = target["model"].predict(arr)
        if target["output_type"] == "binary":
            score = float(preds[0][0]); idx = 1 if score > 0.5 else 0
            conf  = score if score > 0.5 else (1.0 - score)
        else:
            idx = int(np.argmax(preds[0])); conf = float(preds[0][idx])
        pred_name = target["classes"][idx]; conf_pct = round(conf * 100, 2)
        conn = get_db()
        conn.execute('''INSERT INTO evidence_ledger (case_num,filename,file_path,officer_name,timestamp,sha256_hash,module_used,prediction,confidence,integrity)
            VALUES (?,?,?,?,?,?,?,?,?,?)''',
            (case_num, file.filename, file_url, officer_name, datetime.now().isoformat(), file_hash, module_type, pred_name, conf_pct, "unverified"))
        conn.commit(); conn.close()
        return {"case_num": case_num, "filename": file.filename, "file_path": file_url, "hash": file_hash,
                "prediction": pred_name.replace("_"," "), "confidence": conf_pct, "module_used": module_type, "metadata": meta}
    except Exception as e:
        raise HTTPException(500, f"AI Error: {str(e)}")


# ══════════════════════════════════════════════════════════════════
# /analyze-face
# ══════════════════════════════════════════════════════════════════
@app.post("/analyze-face")
async def analyze_face(
    request: Request, file: UploadFile = File(...),
    officer_name: str = Form("Unknown Officer"), case_num: str = Form("CAS-UNKNOWN")
):
    try:
        contents = await file.read()
        _, file_url, file_hash = save_upload(contents, file.filename, request)
        nparr = np.frombuffer(contents, np.uint8)
        img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: raise HTTPException(400, "Could not decode image.")
        try:
            dfs = DeepFace.find(img_path=img, db_path=SUSPECT_DB_DIR,
                model_name="Facenet", distance_metric="euclidean_l2", enforce_detection=False, silent=True)
        except ValueError:
            dfs = []
        match_name = "NO MATCH FOUND"; match_confidence = 0.0; match_distance = 1.0; verdict = "NO MATCH"
        for df in dfs:
            if not df.empty:
                best = df.iloc[0]; match_distance = float(best.get("distance", 1.0))
                candidate = os.path.basename(best["identity"]).rsplit(".", 1)[0].replace("_"," ").upper()
                if match_distance <= FACENET_THRESHOLD:
                    match_name = candidate; verdict = "CONFIRMED MATCH"
                    match_confidence = round(max(0.0, (1.0 - match_distance / FACENET_THRESHOLD)) * 100, 2)
                else:
                    match_name = f"LOW CONFIDENCE — {candidate}"; verdict = "NO MATCH"
                    match_confidence = round(max(0.0, (1.0 - match_distance / FACENET_THRESHOLD)) * 100, 2)
                break
        conn = get_db()
        conn.execute('''INSERT INTO evidence_ledger (case_num,filename,file_path,officer_name,timestamp,sha256_hash,module_used,prediction,confidence,integrity)
            VALUES (?,?,?,?,?,?,?,?,?,?)''',
            (case_num, file.filename, file_url, officer_name, datetime.now().isoformat(), file_hash,
             "Facial Recognition", match_name, match_confidence, "unverified"))
        conn.commit(); conn.close()
        return {"case_num": case_num, "filename": file.filename, "file_path": file_url, "hash": file_hash,
                "prediction": match_name, "confidence": match_confidence, "distance": round(match_distance, 4),
                "verdict": verdict, "threshold": FACENET_THRESHOLD, "module_used": "Facial Recognition",
                "faces_detected": 1 if match_confidence > 0 else 0}
    except Exception as e:
        raise HTTPException(500, f"Facial Error: {str(e)}")


# ══════════════════════════════════════════════════════════════════
# /verify-suspect  —  1-to-1 FaceNet
# ══════════════════════════════════════════════════════════════════
@app.post("/verify-suspect")
async def verify_suspect(
    request: Request, file: UploadFile = File(...),
    suspect_name: str = Form(...), officer_name: str = Form("Unknown Officer"),
    case_num: str = Form("CAS-UNKNOWN")
):
    reference_path = None
    for ext in [".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"]:
        c = os.path.join(SUSPECT_DB_DIR, f"{suspect_name}{ext}")
        if os.path.exists(c): reference_path = c; break
    if reference_path is None:
        raise HTTPException(404, f"Suspect '{suspect_name}' not found. Available: {os.listdir(SUSPECT_DB_DIR)}")

    contents = await file.read()
    _, file_url, file_hash = save_upload(contents, file.filename, request)
    nparr = np.frombuffer(contents, np.uint8)
    probe = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if probe is None: raise HTTPException(400, "Could not decode probe.")

    try:
        res = DeepFace.verify(img1_path=probe, img2_path=reference_path,
            model_name="Facenet", distance_metric="euclidean_l2", enforce_detection=False)
    except Exception as e:
        raise HTTPException(500, f"FaceNet error: {str(e)}")

    distance   = round(float(res["distance"]), 4)
    threshold  = float(res.get("threshold", FACENET_THRESHOLD))
    is_match   = bool(res["verified"])
    confidence = round(max(0.0, (1.0 - distance / threshold)) * 100, 2)
    verdict    = "VERIFIED" if (is_match and confidence >= 70) else ("PROBABLE MATCH" if (is_match and confidence >= 40) else "NOT VERIFIED")
    suspect_display = suspect_name.replace("_", " ").upper()
    base_url = str(request.base_url).rstrip("/")
    ref_url  = f"{base_url}/suspects/{os.path.basename(reference_path)}"  # FIX: /suspects/ not /uploads/

    conn = get_db()
    conn.execute('''INSERT INTO suspect_verifications (case_num,officer_name,timestamp,probe_filename,probe_file_path,probe_hash,matched_suspect,distance,confidence,verdict,threshold_used)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)''',
        (case_num, officer_name, datetime.now().isoformat(), file.filename, file_url,
         file_hash, suspect_display, distance, confidence, verdict, threshold))
    conn.execute('''INSERT INTO evidence_ledger (case_num,filename,file_path,officer_name,timestamp,sha256_hash,module_used,prediction,confidence,integrity)
        VALUES (?,?,?,?,?,?,?,?,?,?)''',
        (case_num, file.filename, file_url, officer_name, datetime.now().isoformat(),
         file_hash, "Suspect Verification", f"{verdict} — {suspect_display}", confidence, "verified"))
    conn.commit(); conn.close()

    return {"verdict": verdict, "is_match": is_match, "distance": distance, "threshold": threshold,
            "confidence": confidence, "suspect_name": suspect_display, "case_num": case_num,
            "officer_name": officer_name, "probe_file_path": file_url, "probe_hash": file_hash,
            "reference_image": os.path.basename(reference_path), "reference_url": ref_url,
            "module_used": "Suspect Verification"}


# ══════════════════════════════════════════════════════════════════
# /verify-evidence-integrity  —  single record hash check
# ══════════════════════════════════════════════════════════════════
@app.post("/verify-evidence-integrity")
async def verify_evidence_integrity(
    evidence_id:  int = Form(...),
    officer_name: str = Form("Unknown Officer"),
    case_num:     str = Form("CAS-UNKNOWN")
):
    conn = get_db()
    row  = conn.execute("SELECT * FROM evidence_ledger WHERE id = ?", (evidence_id,)).fetchone()
    conn.close()
    if row is None: raise HTTPException(404, f"Evidence ID {evidence_id} not found.")

    original_hash = row["sha256_hash"]
    file_path_url = row["file_path"] or ""
    filename      = row["filename"]
    saved_filename = file_path_url.split("/uploads/")[-1] if "/uploads/" in file_path_url else None
    local_path     = os.path.join(UPLOAD_DIR, saved_filename) if saved_filename else None

    if not local_path or not os.path.exists(local_path):
        conn2 = get_db()
        conn2.execute("UPDATE evidence_ledger SET integrity = 'missing' WHERE id = ?", (evidence_id,))
        conn2.execute('''INSERT INTO integrity_checks (evidence_id,case_num,officer_name,timestamp,original_hash,recomputed_hash,file_path,result,flagged)
            VALUES (?,?,?,?,?,?,?,?,?)''',
            (evidence_id, case_num, officer_name, datetime.now().isoformat(), original_hash, "FILE_NOT_FOUND", file_path_url, "MISSING", 1))
        conn2.commit(); conn2.close()
        return {"evidence_id": evidence_id, "result": "MISSING", "integrity": "missing", "flagged": True,
                "original_hash": original_hash, "recomputed_hash": None, "filename": filename,
                "detail": "File no longer on disk. Evidence may have been deleted or moved."}

    with open(local_path, "rb") as f:
        recomputed_hash = hashlib.sha256(f.read()).hexdigest()

    hashes_match = (recomputed_hash == original_hash)
    result_str   = "INTACT" if hashes_match else "TAMPERED"
    integrity    = "verified" if hashes_match else "compromised"

    conn3 = get_db()
    conn3.execute("UPDATE evidence_ledger SET integrity = ? WHERE id = ?", (integrity, evidence_id))
    conn3.execute('''INSERT INTO integrity_checks (evidence_id,case_num,officer_name,timestamp,original_hash,recomputed_hash,file_path,result,flagged)
        VALUES (?,?,?,?,?,?,?,?,?)''',
        (evidence_id, case_num, officer_name, datetime.now().isoformat(),
         original_hash, recomputed_hash, file_path_url, result_str, 0 if hashes_match else 1))
    conn3.commit(); conn3.close()

    return {"evidence_id": evidence_id, "result": result_str, "integrity": integrity,
            "flagged": not hashes_match, "original_hash": original_hash,
            "recomputed_hash": recomputed_hash, "filename": filename, "file_path": file_path_url,
            "detail": "Hash match confirmed. File is unaltered." if hashes_match
                      else "HASH MISMATCH — file altered after capture."}


# ══════════════════════════════════════════════════════════════════
# /verify-case-integrity  —  batch hash check for entire case
# ══════════════════════════════════════════════════════════════════
@app.post("/verify-case-integrity")
async def verify_case_integrity(
    case_num: str = Form(...),
    officer_name: str = Form("Unknown Officer")
):
    conn  = get_db()
    rows  = conn.execute("SELECT * FROM evidence_ledger WHERE case_num = ? ORDER BY id ASC", (case_num,)).fetchall()
    conn.close()
    if not rows: raise HTTPException(404, f"No evidence for case {case_num}")

    results  = []; intact = 0; tampered = 0; missing = 0

    for row in rows:
        row = dict(row)
        eid = row["id"]; orig = row["sha256_hash"]; url = row["file_path"] or ""
        sf  = url.split("/uploads/")[-1] if "/uploads/" in url else None
        lp  = os.path.join(UPLOAD_DIR, sf) if sf else None

        if not lp or not os.path.exists(lp):
            result_str = "MISSING"; integrity = "missing"; flagged = True; recomp = None; missing += 1
        else:
            with open(lp, "rb") as f: recomp = hashlib.sha256(f.read()).hexdigest()
            ok = (recomp == orig); result_str = "INTACT" if ok else "TAMPERED"
            integrity = "verified" if ok else "compromised"; flagged = not ok
            if ok: intact += 1
            else:  tampered += 1

        conn2 = get_db()
        conn2.execute("UPDATE evidence_ledger SET integrity = ? WHERE id = ?", (integrity, eid))
        conn2.execute('''INSERT INTO integrity_checks (evidence_id,case_num,officer_name,timestamp,original_hash,recomputed_hash,file_path,result,flagged)
            VALUES (?,?,?,?,?,?,?,?,?)''',
            (eid, case_num, officer_name, datetime.now().isoformat(), orig,
             recomp or "FILE_NOT_FOUND", url, result_str, 1 if flagged else 0))
        conn2.commit(); conn2.close()

        results.append({"evidence_id": eid, "filename": row["filename"], "result": result_str,
                         "integrity": integrity, "flagged": flagged, "original_hash": orig, "recomputed_hash": recomp})

    return {"case_num": case_num, "total": len(rows), "intact": intact, "tampered": tampered,
            "missing": missing, "all_clear": (tampered == 0 and missing == 0), "records": results}


# ══════════════════════════════════════════════════════════════════
# /list-suspects  /get-verifications  /get-ledger
# ══════════════════════════════════════════════════════════════════
@app.get("/list-suspects")
async def list_suspects():
    valid = {".jpg",".jpeg",".png"}
    return {"suspects": [{"filename": f, "name": os.path.splitext(f)[0].replace("_"," ").upper(),
                           "key": os.path.splitext(f)[0]}
                          for f in os.listdir(SUSPECT_DB_DIR)
                          if os.path.splitext(f)[1].lower() in valid],
            "count": sum(1 for f in os.listdir(SUSPECT_DB_DIR) if os.path.splitext(f)[1].lower() in valid)}

@app.get("/get-verifications")
async def get_verifications(case_num: str = None):
    conn = get_db()
    rows = conn.execute("SELECT * FROM suspect_verifications" + (" WHERE case_num = ?" if case_num else "") + " ORDER BY id DESC",
                        (case_num,) if case_num else ()).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/get-ledger")
async def get_ledger():
    try:
        conn = get_db()
        rows = conn.execute("SELECT * FROM evidence_ledger ORDER BY id DESC").fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(500, f"DB Error: {str(e)}")
