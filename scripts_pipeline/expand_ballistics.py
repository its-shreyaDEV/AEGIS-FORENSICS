import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator, img_to_array, load_img

#Source directory to focus for expanding data
SOURCE_DIR = "aegis_data/ballistics_ready"

#Used to generate 10 new variations for every 1 original image
MULTIPLIER = 10 
print(f"Initializing Data Expansion Pipeline")

# Configure the physics of our synthetic generation to focus heavily on rotation and lighting, as casing marks look completely different under different microscope lights.
datagen = ImageDataGenerator(
    rotation_range=360,
    brightness_range=[0.5, 1.5],
    zoom_range=[0.8, 1.2],
    horizontal_flip=True,
    vertical_flip=True,
    fill_mode='nearest'
)

classes = [d for d in os.listdir(SOURCE_DIR) if os.path.isdir(os.path.join(SOURCE_DIR, d))]
total_generated = 0

for class_name in classes:
    class_path = os.path.join(SOURCE_DIR, class_name)
    images = [f for f in os.listdir(class_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Processing '{class_name}': Found {len(images)} original images.")
    for img_name in images:
        img_path = os.path.join(class_path, img_name)
        try:
            # Load image and convert to a shape the generator understands
            img = load_img(img_path)
            x = img_to_array(img)
            x = x.reshape((1,) + x.shape)
            # Generate and save the new images directly into the same folder
            i = 0
            for batch in datagen.flow(x, batch_size=1, save_to_dir=class_path, save_prefix=f"aug_{img_name.split('.')[0]}", save_format='jpg'):
                i += 1
                total_generated += 1
                if i >= MULTIPLIER:
                    break # Stop once we hit our multiplier for this specific image
        except Exception as e:
            print(f"Error processing {img_name}: {e}")

print(f"\nExpansion Complete! Generated {total_generated} new synthetic images.")