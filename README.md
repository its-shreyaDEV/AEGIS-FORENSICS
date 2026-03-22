# AEGIS-FORENSICS
### *Automated Evidence Guard & Identification System*

<div align="center">

![Version](https://img.shields.io/badge/version-7.0-00ffb4?style=for-the-badge&labelColor=04080f)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20FastAPI-a855f7?style=for-the-badge&labelColor=04080f)
![AI](https://img.shields.io/badge/AI-EfficientNetB0%20%2B%20FaceNet-ff4d4d?style=for-the-badge&labelColor=04080f)
![License](https://img.shields.io/badge/license-Academic-f59e0b?style=for-the-badge&labelColor=04080f)

**A high-integrity, full-stack forensic intelligence platform that automates evidence classification, suspect identification with cryptographic chain-of-custody sealing.**

*Inspired by the defense-tech aesthetics of Palantir, Anduril, and Axiom.*

</div>

---

## Table of Contents

1. [System Overview](#-system-overview)
2. [Key Features](#-key-features)
3. [Architecture](#-architecture)
4. [Directory Structure](#-directory-structure)
5. [Installation & Setup](#-installation--setup)
6. [Backend — Aegis Core](#-backend--aegis-core)
   - [Forensic AI Modules](#forensic-ai-modules)
   - [Data Engineering Pipelines](#data-engineering-pipelines)
   - [API Endpoints](#api-endpoints)
   - [Cryptographic Integrity System](#cryptographic-integrity-system)
7. [Frontend — Aegis UI](#-frontend--aegis-ui)
   - [Page Architecture](#page-architecture)
   - [Component Library](#component-library)
   - [State & Data Flow](#state--data-flow)
   - [Design System](#design-system)
8. [Forensic Workflow](#-forensic-workflow)
9. [Suspect Verification System](#-suspect-verification-system)
10. [Evidence Integrity Verification](#-evidence-integrity-verification)
11. [Academic Defense Notes](#-academic-defense-notes)
12. [Roadmap](#-roadmap)

---

## System Overview

AEGIS-Forensics bridges the gap between raw crime-scene data and actionable intelligence. It is a purpose-built forensic platform with three core pillars:

| Pillar | What it does |
|--------|-------------|
| **AI Classification** | Automatically classifies forensic evidence across 4 domains using EfficientNetB0 CNNs |
| **Biometric Identification** | Performs 1-to-1 and 1-to-many suspect matching using FaceNet (128-D embeddings) via DeepFace |
| **Chain of Custody** | SHA-256 hashes every file at capture time, seals it to a SQLite ledger, and can re-verify integrity on demand |

Every action an officer takes — upload, classify, identify, verify — is permanently recorded in an immutable `ledger.db` with timestamp, badge ID, case number, and cryptographic hash.

---

## Key Features

- **4 AI Forensic Modules** — Blood, Ballistics, Vehicle Damage, Microscopic Toolmarks
- **FaceNet Suspect Identification** — 128-dimensional embedding comparison with euclidean distance scoring
- **1-to-1 Biometric Verification** — Confirms or denies a specific suspect's identity against a probe image
- **SHA-256 Evidence Sealing** — Every uploaded file is fingerprinted at the moment of capture
- **Live Integrity Checker** — Re-hashes files on demand and flags any mismatch as TAMPERED
- **Batch Case Audit** — Verifies every evidence file in a case in one click
- **Immutable SQLite Ledger** — All events written with officer ID, timestamp, case number, GPS, and hash
- **Dynamic Case Analysis** — Aggregates all records for a case before reconstruction and sealing
- **Defense-Tech UI** — Physics-based animations, scanline overlays, glitch text, HUD aesthetics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AEGIS-FORENSICS                          │
│                                                                 │
│  ┌──────────────────────┐      ┌─────────────────────────────┐  │
│  │   React + Vite UI    │      │    FastAPI Backend (Python)  │  │
│  │                      │◄────►│                             │  │
│  │  CapturePage         │ HTTP │  /analyze      (Keras CNN)  │  │
│  │  AnalysisPage        │ REST │  /analyze-face (DeepFace)   │  │
│  │  EvidencePage        │      │  /verify-suspect (FaceNet)  │  │
│  │  VerifyPage          │      │  /verify-evidence-integrity  │  │
│  │  Dashboard           │      │  /verify-case-integrity     │  │
│  └──────────────────────┘      │  /get-ledger                │  │
│                                │  /list-suspects             │  │
│                                └────────────┬────────────────┘  │
│                                             │                   │
│              ┌──────────────────────────────┼────────────────┐  │
│              │           Data Layer         │                │  │
│              │                             ▼                 │  │
│              │  ┌─────────────┐  ┌──────────────────────┐   │  │
│              │  │  ledger.db  │  │  EfficientNetB0       │   │  │
│              │  │  (SQLite)   │  │  .keras model files   │   │  │
│              │  └─────────────┘  └──────────────────────┘   │  │
│              │  ┌─────────────┐  ┌──────────────────────┐   │  │
│              │  │  uploads/   │  │  suspect_database/   │   │  │
│              │  │  (images)   │  │  (watchlist JPGs)    │   │  │
│              │  └─────────────┘  └──────────────────────┘   │  │
│              └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, Framer Motion | UI, routing, animations |
| **Styling** | Tailwind CSS, Lucide Icons | Design tokens, utility classes, icons |
| **Backend** | FastAPI, Python 3.10+ | API routing, file handling, model inference |
| **AI — Classification** | TensorFlow, EfficientNetB0 | Evidence type classification |
| **AI — Biometrics** | DeepFace, FaceNet | Facial recognition and verification |
| **Image Processing** | Pillow (PIL), OpenCV | Preprocessing, tensor preparation |
| **Database** | SQLite (`ledger.db`) | Immutable evidence ledger |
| **Crypto** | Python `hashlib` SHA-256 | Evidence fingerprinting |

---

## Directory Structure

```
AEGIS-FORENSIC/
│
├── api/
│   └── app.py                       # FastAPI core — all endpoints, model loading, DB
│
├── models/
│   ├── aegis_damage_model_v3.keras  # Vehicle damage binary classifier
│   ├── aegis_toolmarks_model.keras  # Microscopic toolmarks 6-class classifier
│   ├── aegis_ballistics_model.keras # Ballistics 2-class classifier
│   └── blood_detector.keras         # Bloodstain binary classifier
│
├── suspect_database/
│   └── Jeffrey_Epstein.jpg          # Watchlist — filename = identity label
│
├── uploads/                         # Persisted evidence images (served via /uploads)
├── ledger.db                        # SQLite immutable evidence ledger
│
├── scripts_pipeline/                # Data engineering & dataset preparation
├── scripts_training/                # Model architecture & training scripts
├── scripts_evaluation/              # Validation metrics & evaluation scripts
├── test_images/                     # Zero-leakage real-world test data
│   ├── ballistics/
│   ├── damage_toolmark/
│   ├── forensic/
│   └── suspect/
│
└── aegis_front/                     # React + Vite frontend
    ├── src/
    │   ├── App.jsx                  # Root router
    │   ├── components/
    │   │   ├── AnimatedUploadZone.jsx
    │   │   ├── BlockchainVisualizer.jsx
    │   │   ├── CrimeSceneMap.jsx
    │   │   ├── EvidenceTable.jsx
    │   │   ├── HyperspeedBackground.jsx
    │   │   ├── LetterGlitchHash.jsx
    │   │   ├── PhaseTimeline.jsx
    │   │   ├── ResultsPanel.jsx
    │   │   ├── StatsBar.jsx
    │   │   ├── TiltedEvidenceCard.jsx
    │   │   └── TopNav.jsx
    │   ├── hooks/
    │   │   └── useEvidenceStore.js  # Zustand/custom hook — ledger sync
    │   ├── pages/
    │   │   ├── CapturePage.jsx      # Upload, module selection, AI inference
    │   │   ├── AnalysisPage.jsx     # Case-level reconstruction + sealing
    │   │   ├── EvidencePage.jsx     # Live evidence ledger with tamper alerts
    │   │   ├── VerifyPage.jsx       # Suspect verification + integrity checker
    │   │   └── Dashboard.jsx        # System overview and case stats
    │   └── utils/
    │       ├── api.js               # Full-stack fetch bridge
    │       └── data.js              # Static UI mappings and labels
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Installation & Setup

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Git**

### Step 1 — Clone

```bash
git clone https://github.com/its-shreyaDEV/AEGIS-FORENSICS.git
cd AEGIS-FORENSICS
```

### Step 2 — Backend

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn tensorflow deepface tf-keras \
            opencv-python python-multipart pillow numpy pandas

# Start the API server
uvicorn api.app:app --reload --port 8000
```

> API will be live at `http://localhost:8000`
> Interactive docs at `http://localhost:8000/docs`

### Step 3 — Frontend

```bash
cd aegis_front
npm install
npm run dev
```

> UI will be live at `http://localhost:5173`

### Step 4 — Add Suspects to Watchlist

Drop JPEG/PNG images into `suspect_database/`. The **filename becomes the identity label**.

```
suspect_database/
├── John_Doe.jpg          → identified as "JOHN DOE"
└── Jane_Smith.png        → identified as "JANE SMITH"
```

No retraining needed — DeepFace reads the folder at inference time.

---

## Backend — Aegis Core

### Forensic AI Modules

All modules are built on **EfficientNetB0** with transfer learning. Models are loaded into RAM at server startup via FastAPI's `@asynccontextmanager` lifespan for zero-latency inference.

#### Module 1 — Biological / Bloodstain Detector

| Property | Value |
|----------|-------|
| **Output** | Binary (Sigmoid) |
| **Accuracy** | 100% on validation set |
| **Classes** | `Non-Biological / Background` · `Biological / Bloodstain Confirmed` |
| **Dataset** | 100k+ hybrid (GI bleeding, wounds, animal images, background) |
| **Key challenge** | Original dataset was too small and domain-specific. Rebuilt from scratch by aggregating 3 disparate medical/forensic datasets and flattening them into a unified binary structure. `class_weight` balancing applied (70k vs 36k) to prevent majority-class bias. |

#### Module 2 — Ballistics / Casing Classifier

| Property | Value |
|----------|-------|
| **Output** | Categorical (Softmax, 2-class) |
| **Accuracy** | 100% on validation set |
| **Classes** | `Breech_Face` · `Firing_Pin` |
| **Dataset** | 273 original casings → expanded to 2,700+ via synthetic augmentation |
| **Key challenge** | Severe data starvation (only 273 images). Solved via offline data expansion using Keras `ImageDataGenerator` to physically synthesize augmented variants (rotations, brightness shifts). Two-phase fine-tuning at micro-learning rate `1e-5` prevented catastrophic forgetting. |

#### Module 3 — Vehicle Damage Classifier

| Property | Value |
|----------|-------|
| **Output** | Categorical (Softmax, 2-class) |
| **Accuracy** | ~90% on validation set |
| **Classes** | `00-damage` · `01-whole` |
| **Key challenge** | Model was memorizing car make/model rather than damage patterns. Fixed with aggressive in-memory augmentation (flips, rotations, zooms) to force the network to learn structural deformation, not vehicle identity. |

#### Module 4 — Microscopic Toolmarks

| Property | Value |
|----------|-------|
| **Output** | Categorical (Softmax, 6-class) |
| **Accuracy** | ~94% on validation set |
| **Classes** | `crazing` · `inclusion` · `patches` · `pitted_surface` · `rolled-in_scale` · `scratches` |
| **Key challenge** | Laboratory microscope lighting created consistent bias patterns. Solved with an aggressive 50% Dropout layer to prevent the model from anchoring on illumination artifacts. |

---

### Data Engineering Pipelines (`scripts_pipeline/`)

| Script | Purpose |
|--------|---------|
| `build_dataset.py` | Master pipeline. Aggregates disparate medical datasets, flattens nested structures, and builds the `blood vs non_blood` binary corpus. |
| `prep_ballistics.py` | Pandas-based parser. Translates messy Excel boolean flags (merged headers, normalized newlines) into clean image directories. |
| `expand_ballistics.py` | Solves data starvation via offline augmentation. Synthesizes 2,700 images from 273 originals. |

---

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Run Keras CNN inference (damage / blood / ballistics / toolmarks) |
| `POST` | `/analyze-face` | Open-set face search across entire `suspect_database/` |
| `POST` | `/verify-suspect` | 1-to-1 FaceNet verification against a named suspect |
| `POST` | `/verify-evidence-integrity` | Re-hash a single evidence file and compare to sealed hash |
| `POST` | `/verify-case-integrity` | Batch re-hash every file in a case |
| `GET`  | `/get-ledger` | Fetch full evidence ledger (all cases) |
| `GET`  | `/list-suspects` | List all images in `suspect_database/` |
| `GET`  | `/get-verifications` | Fetch suspect verification history |

**Static mounts:**
- `GET /uploads/<filename>` — Serve persisted evidence images
- `GET /suspects/<filename>` — Serve suspect database reference images

---

### Cryptographic Integrity System

Every piece of evidence goes through a three-stage cryptographic lifecycle:

```
CAPTURE                     SEAL                        VERIFY
   │                          │                            │
   ▼                          ▼                            ▼
File uploaded            SHA-256 computed            Re-read file
to FastAPI          ──►  from raw bytes         ──►  from disk
                         stored in ledger.db          recompute SHA-256
                                                       compare to ledger
                                                            │
                                              ┌─────────────┴──────────────┐
                                              ▼                            ▼
                                           INTACT                      TAMPERED
                                    (hashes match)              (hashes differ)
                                    integrity = verified         integrity = compromised
                                                                 record flagged in ledger
```

Three database tables track the full audit trail:

- **`evidence_ledger`** — Every capture event (case, officer, file, hash, prediction, integrity status)
- **`suspect_verifications`** — Every FaceNet verification run (distance, confidence, verdict)
- **`integrity_checks`** — Every re-hash audit (original vs recomputed hash, flagged boolean)

---

## Frontend — Aegis UI

### Page Architecture

#### `Dashboard.jsx`
System overview with live stats pulled from the ledger. Shows total records, verified count, compromised count, and pending analysis. Entry point for navigating to all other phases.

#### `CapturePage.jsx`
The primary evidence intake interface.
- Officer name and case number input
- AI module selector (damage / blood / ballistics / toolmarks / facial recognition)
- Drag-and-drop image upload zone with electric border animation
- Sends `FormData` to FastAPI and displays real-time results
- On completion, routes to `AnalysisPage` with the evidence payload

#### `AnalysisPage.jsx`
Case-level scene reconstruction. Unlike `CapturePage` which handles single captures, this page aggregates **all evidence for a case** from the ledger.
- Case selector pills — switch between all cases in the ledger
- Expandable evidence cards — each record shows image, prediction, hash, GPS, status
- **"Run Scene Reconstruction" button** — deliberately manual trigger, not automatic
- On trigger: renders dynamic SVG scene visualization (tailored per module type), aggregate confidence bars, case timeline, blockchain hash preview
- Double-confirm seal button with tamper warning if any compromised records exist
- 8-second locking sequence with countdown bar before routing to Evidence page

#### `EvidencePage.jsx`
Live immutable ledger view.
- Filter by status (ALL / VERIFIED / COMPROMISED / PENDING)
- Search by case ID, officer, hash
- Expandable rows with full metadata (GPS, badge, IPFS CID, block TX)
- Red tamper alert banner if any compromised records exist
- "Full Analysis" button opens `BlockchainModal` with image viewer + hash + blockchain visualizer

#### `VerifyPage.jsx`
Two-tab verification suite:

**Tab 1 — Suspect Verification**
- Upload a probe image (CCTV grab, crime scene photo)
- Select a suspect from the live dropdown (loaded from `/list-suspects`)
- FaceNet computes 128-D embeddings and euclidean distance
- Results: verdict banner (VERIFIED / PROBABLE MATCH / NOT VERIFIED), side-by-side image comparison with face mesh overlay, confidence ring, distance gauge with threshold marker
- All results sealed to ledger automatically

**Tab 2 — Evidence Integrity**
- Single record check: select one evidence ID from dropdown, re-hash, compare
- Batch case check: enter case number, re-hash every file, get full report table
- Hash diff view on TAMPERED records showing original vs recomputed hash
- Live ledger status preview showing integrity state of all records

---

### Component Library

| Component | Description |
|-----------|-------------|
| `HyperspeedBackground` | Canvas-based animated grid with particle streaks. Pure JS, no external dependencies. |
| `TopNav` | Sticky navigation with animated Aegis logo, EQ signal bars, system status indicator, and route-aware active states. |
| `AnimatedUploadZone` | Drag-and-drop zone with electric animated border. Triggers SHA-256 computation on file select. |
| `TiltedEvidenceCard` | 3D mouse-tracking tilt effect via Framer Motion `useSpring` + `rotateX/rotateY` at `perspective: 900px`. |
| `LetterGlitchHash` | Character-by-character hash reveal. Uses `requestAnimationFrame` to cycle random hex chars before settling on the real SHA-256 string. |
| `BlockchainVisualizer` | Animated chain-of-blocks SVG visualization. Accepts a hash and renders a visual representation of block sealing. |
| `CrimeSceneMap` | Geographic scene reconstruction widget. Maps evidence GPS coordinates for the active case. |
| `EvidenceTable` | Sortable, filterable evidence table with expandable detail rows. Safe optional chaining on all fields. |
| `PhaseTimeline` | Visual phase-by-phase timeline of the AEGIS workflow. |
| `StatsBar` | 4-cell stats grid with countup animation on mount. |
| `ResultsPanel` | Dynamic AI response injector. Maps backend prediction to the correct UI layout and widgets per module type. |

---

### State & Data Flow

```
User uploads image on CapturePage
        │
        ▼
FormData → POST /analyze or /analyze-face
        │
        ▼
FastAPI returns { prediction, confidence, hash, file_path, case_num }
        │
        ▼
navigate('/analysis', { state: { evidence: result } })
        │
        ▼
AnalysisPage loads → fetchLedger() → GET /get-ledger
        │
        ▼
All records for case_num filtered from ledger
        │
        ▼
Officer clicks "Run Scene Reconstruction"
        │
        ▼
Aggregate confidence, dominant module, timeline built from real data
        │
        ▼
Officer clicks "Seal" (double confirm)
        │
        ▼
8-second lock screen → navigate('/evidence')
```

**`useEvidenceStore.js`** manages ledger state globally. It exposes `log`, `fetchLedger()`, and `isLoading`. Called on mount in both `EvidencePage` and `AnalysisPage` to ensure fresh data.

---

### Design System

#### Typography
| Role | Font | Usage |
|------|------|-------|
| `font-display` | **Syne** | Headings, nav labels, body text |
| `font-mono-cus` | **Space Mono** | All data: hashes, IDs, timestamps, metrics |

#### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Cyber Teal | `#00ffb4` | Primary accent, verified states, interactive elements |
| Ink | `#04080f` | Darkest background |
| Deep Navy | `#080d18` | Card backgrounds |
| Purple | `#a855f7` | Pending states, secondary actions |
| Red Alert | `#ff4d4d` | Compromised/tampered states, warnings |
| Amber | `#f59e0b` | Missing/caution states, body-moved flags |

#### Advanced CSS Techniques
- **Noise grain overlay** — SVG `<feTurbulence>` injected via `body::after` for matte military screen texture
- **Scanline effect** — `repeating-linear-gradient` overlay on all evidence images
- **Glassmorphism** — `backdrop-filter: blur(20px)` on TopNav and modals
- **Corner crosshairs** — CSS absolute-positioned border segments on all image viewers
- **Face mesh SVG** — Procedural SVG overlay with pulsing animated landmarks on facial comparison views

---

## 🔬 Forensic Workflow

```
Phase 01 — CAPTURE
  Officer logs in → enters badge + case number
  Selects AI module → uploads crime scene image
  System computes SHA-256 → sends to FastAPI

Phase 02 — INFERENCE
  EfficientNetB0 classifies image (or FaceNet identifies face)
  Result: prediction label + confidence %
  Record written to ledger.db with hash + metadata

Phase 03 — RECONSTRUCTION (AnalysisPage)
  Officer reviews ALL evidence for the case
  Clicks "Run Scene Reconstruction" to trigger analysis
  Reviews aggregate confidence, timeline, cross-references
  Decides to seal or investigate further

Phase 04 — SEAL
  Officer double-confirms sealing
  8-second cryptographic lock sequence
  Case marked as sealed in ledger

Phase 05 — AUDIT (EvidencePage)
  Any officer can view the full immutable history
  Tampered records auto-flagged with red alert banner

Phase 06 — VERIFY (VerifyPage)
  Suspect tab: upload probe → FaceNet compares to watchlist
  Integrity tab: re-hash any file → INTACT or TAMPERED verdict
```

---

## Suspect Verification System

AEGIS uses **FaceNet** via the DeepFace library for biometric identification. FaceNet encodes every face into a **128-dimensional embedding vector** capturing geometric relationships — eye spacing, jaw angle, nose bridge distance — rather than raw pixel values.

### How it works

```
Probe image                Reference image
(crime scene / CCTV)       (suspect_database/)
       │                          │
       ▼                          ▼
  FaceNet encoder            FaceNet encoder
       │                          │
       ▼                          ▼
  128-D vector A             128-D vector B
       │                          │
       └──────────────┬───────────┘
                      ▼
             Euclidean L2 distance
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    distance ≤ 0.40          distance > 0.40
    VERIFIED ✓               NOT VERIFIED ✗
```

### Confidence Mapping

Distance is converted to a human-readable confidence percentage:

```
confidence = max(0, (1 - distance / threshold)) × 100
```

| Distance | Confidence | Verdict |
|----------|-----------|---------|
| 0.00 | 100% | VERIFIED |
| 0.20 | 50% | VERIFIED |
| 0.40 | 0% | NOT VERIFIED (at threshold) |
| > 0.40 | 0% (capped) | NOT VERIFIED |

### Adding Suspects to Watchlist

No retraining. Simply drop a clear face photo into `suspect_database/`:

```bash
cp suspect_photo.jpg suspect_database/First_Last.jpg
```

The filename (without extension) becomes the identity label. The system reads the folder at inference time.

---

## Evidence Integrity Verification

### How SHA-256 sealing works

Every file uploaded through AEGIS is hashed **in memory** before being saved to disk:

```python
file_hash = hashlib.sha256(contents).hexdigest()
```

This hash is stored in `evidence_ledger.sha256_hash` at the moment of capture. The file is then saved to `uploads/` using the first 12 characters of the hash as the filename (`{hash[:12]}.jpg`), ensuring deduplication.

### Re-verification

At any point, an officer can run a verification check:

1. The system reads the original hash from `ledger.db`
2. Re-reads the physical file from `uploads/`
3. Recomputes the SHA-256 from disk
4. Compares the two hashes

```
Original:   a3f8c2d1e9b0...  (sealed at capture)
Recomputed: a3f8c2d1e9b0...  → INTACT   ✓
Recomputed: 7f1a3d9c2b44...  → TAMPERED ✗  (flagged in ledger)
```

If a file has been altered — even a single byte — the hash will be completely different and the record is flagged as `compromised` in the ledger. This is the mathematical guarantee behind SHA-256's avalanche effect.

---

## Academic Defense Notes

### On 100% Accuracy Claims

The 100% validation accuracy on Bloodstain and Ballistics modules is **not overfitting**. It is justified by:

1. **Deterministic physical patterns** — A firing pin leaves a mathematically perfect geometric crater. A bloodstain either contains haemoglobin or it does not. These are not ambiguous visual features.
2. **Unseen validation data** — Metrics were computed on strictly held-out data with zero overlap with training or augmentation sets.
3. **Massive synthetic expansion** — 2,700 augmented ballistics images from 273 originals prevents the model from memorizing specific instances.
4. **Two-phase fine-tuning** — Micro learning rate (`1e-5`) on the second training phase prevents catastrophic forgetting of ImageNet features.

### Evaluation Metrics Used

| Metric | Relevance |
|--------|----------|
| **Precision** | "Trust metric" — what % of positive predictions are correct. A 0.95 Precision on Vehicle Damage means investigators can trust a DAMAGED flag 95% of the time. |
| **Recall** | "Coverage metric" — what % of actual positives are detected. Critical for bloodstain (never miss real evidence). |
| **F1 Score** | Harmonic mean of Precision and Recall. Prevents gaming imbalanced datasets by guessing majority class. |
| **Confusion Matrix** | Per-class breakdown — essential for multi-class modules like Toolmarks. |

All evaluation scripts are in `scripts_evaluation/` and run on `test_images/` (zero-leakage real-world data).

---

## Roadmap

| Feature | Status | Description |
|---------|--------|-------------|
| Immutable Blockchain Ledger | Planned | Replace SQLite sealing with Ethers.js + Hardhat smart contract on a testnet. Hash permanently anchored on-chain. |
| IPFS Decentralized Storage | Planned | Integrate `web3.storage` SDK to pin evidence images to IPFS. CID stored in ledger alongside SHA-256. |
| Three.js Crime Scene Viewer | Planned | 3D spatial reconstruction of evidence points using `@react-three/fiber`. Navigate a digital twin of the crime scene. |
| Real-time GPS Mapping | Planned | Live Leaflet.js map with plotted evidence coordinates from EXIF data. |
| PDF Case Report Export | Planned | Auto-generate a court-ready PDF for a full case including all evidence, hashes, officer chain, and AI verdicts. |
| Multi-suspect Watchlist | Partial | Currently supported. UI for bulk watchlist management TBD. |
| Mobile Capture App | Planned | React Native companion app for field evidence capture with automatic GPS tagging. |

---

## License

This project was built for academic research and digital forensics demonstration purposes.

*Property of the AEGIS-Forensics Development Team.*
*Built for advanced digital intelligence and AI validation.*

---

<div align="center">
<sub>AEGIS-FORENSICS v7.0 · React + FastAPI · EfficientNetB0 + FaceNet · SHA-256 Chain of Custody</sub>
</div>
