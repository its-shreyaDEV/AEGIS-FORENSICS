import os
import shutil
import pandas as pd

# ==========================================
# PATHS
# ==========================================
EXCEL_PATH = "aegis_data/ballistics/StudyInfo.xlsx" 
SOURCE_DIR = "aegis_data/ballistics/cc"      
CLEAN_DIR = "aegis_data/ballistics_ready"

print(f"Reading {EXCEL_PATH}...")
try:
    df = pd.read_excel(EXCEL_PATH, sheet_name="Cartridge Case Measurement", header=1)
    df.columns = [str(c).replace('\n', ' ').replace('\r', '').strip() for c in df.columns]
except Exception as e:
    print(f"Failed to load Excel file. Error: {e}")
    exit()

os.makedirs(CLEAN_DIR, exist_ok=True)

available_images = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
print(f"Found {len(available_images)} images in the 'cc' folder.")
print("Scanning for markers (1.0 or 1)...")

success_count = 0
missing_count = 0

for index, row in df.iterrows():
    file_name_entry = str(row.get('File Name', '')).strip()
    if not file_name_entry or file_name_entry == 'nan':
        continue
        
    base_name = os.path.splitext(file_name_entry)[0] 
    
    # Grab the raw values
    breech_val = str(row.get('Breech Face')).strip()
    firing_val = str(row.get('Firing Pin')).strip()
    ejector_val = str(row.get('Ejector Mark')).strip()
    
    # THE FIX: Look for '1.0' or '1'
    label = None
    if breech_val in ['1.0', '1']:
        label = "Breech_Face"
    elif firing_val in ['1.0', '1']:
        label = "Firing_Pin"
    elif ejector_val in ['1.0', '1']:
        label = "Ejector_Mark"
        
    if label is None:
        continue

    # Case-insensitive file matching
    matched_image = None
    for img in available_images:
        if base_name.lower() in img.lower(): 
            matched_image = img
            break

    # Copy to the clean directory
    if matched_image:
        class_dir = os.path.join(CLEAN_DIR, label)
        os.makedirs(class_dir, exist_ok=True)
        
        src_path = os.path.join(SOURCE_DIR, matched_image)
        dest_path = os.path.join(class_dir, matched_image)
        
        shutil.copy2(src_path, dest_path)
        success_count += 1
    else:
        missing_count += 1

print(f"\nDone! Organized {success_count} images into {CLEAN_DIR}.")
if missing_count > 0:
    print(f"Note: {missing_count} images from the Excel file were not found in the 'cc' folder.")