import os
import shutil

SOURCE_DIR = "./aegis_data/bloodstain"  #Original Dataset that we use
OUTPUT_DIR = "./aegis_data/bloodstain_dataset"  #Output dataset which will be used for model training

BLOOD_DIR = os.path.join(OUTPUT_DIR, "blood")
NON_BLOOD_DIR = os.path.join(OUTPUT_DIR, "non_blood")

os.makedirs(BLOOD_DIR, exist_ok=True)
os.makedirs(NON_BLOOD_DIR, exist_ok=True)

# Allowed image formats
VALID_EXT = (".jpg", ".jpeg", ".png")

#Helper Function to handle the images
def copy_images(src_folder, dest_folder, limit=None):
    count = 0
    for root, _, files in os.walk(src_folder):
        for file in files:
            if file.lower().endswith(VALID_EXT):
                src_path = os.path.join(root, file)
                dst_path = os.path.join(dest_folder, f"{count}_{file}")
                try:
                    shutil.copy(src_path, dst_path)
                    count += 1
                    if limit and count >= limit:
                        return count
                except:
                    continue
    return count

#Blood data split
print("\nProcessing BLOOD datasets...")
# Blood cells (ALL go to blood)
copy_images(os.path.join(SOURCE_DIR, "blood", "blood_cell"), BLOOD_DIR)
# Malaria dataset (both are blood)
copy_images(os.path.join(SOURCE_DIR, "blood", "malaria_blood"), BLOOD_DIR)
# GI bleeding → ONLY Lesion folder
copy_images(os.path.join(SOURCE_DIR, "blood", "gastrointestinal_bleeding", "Lesion"), BLOOD_DIR)
# Wound dataset → train_images only
copy_images(os.path.join(SOURCE_DIR, "blood", "wound", "data_wound_seg", "train_images"), BLOOD_DIR)


#Non blood data split
print("\nProcessing NON-BLOOD datasets...")
# Animals, objects along with non-blood items
copy_images(os.path.join(SOURCE_DIR, "non_blood", "animal_img"), NON_BLOOD_DIR)
# Skin cancer dataset → use raw images (mostly non-blood)
copy_images(os.path.join(SOURCE_DIR, "non_blood", "skin_cancer", "raw-img"), NON_BLOOD_DIR)
# GI bleeding → NORMAL images = non-blood
copy_images(os.path.join(SOURCE_DIR, "blood", "gastrointestinal_bleeding", "Normal"), NON_BLOOD_DIR)

#Final Count to verify blood v/s non blood data split
print("\nDATASET BUILD COMPLETE")
print(f"Blood images: {len(os.listdir(BLOOD_DIR))}")
print(f"Non-blood images: {len(os.listdir(NON_BLOOD_DIR))}")