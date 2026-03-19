import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, RandomFlip, RandomRotation, RandomZoom, RandomContrast
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau, EarlyStopping
from tensorflow.keras import regularizers

TRAIN_DIR = "aegis_data/damage/data1a/training"
VAL_DIR = "aegis_data/damage/data1a/validation"
MODEL_SAVE_NAME = "aegis_damage_model_v3.keras"

print("Loading Structural Damage Data...")

train_dataset = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR, image_size=(224, 224), batch_size=32, label_mode='categorical'
)
val_dataset = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR, image_size=(224, 224), batch_size=32, label_mode='categorical'
)

num_classes = len(train_dataset.class_names)
print(f"Detected Classes: {train_dataset.class_names}")

AUTOTUNE = tf.data.AUTOTUNE
train_dataset = train_dataset.prefetch(buffer_size=AUTOTUNE)
val_dataset = val_dataset.prefetch(buffer_size=AUTOTUNE)

# Slightly more aggressive rotation to prevent memorization
data_augmentation = tf.keras.Sequential([
    RandomFlip("horizontal_and_vertical"),
    RandomRotation(0.2), 
    RandomZoom(0.15),
    RandomContrast(0.2)
])

print("Building EfficientNetB0 Architecture with L2 Regularization...")
base_model = EfficientNetB0(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base_model.trainable = False 

inputs = tf.keras.Input(shape=(224, 224, 3))
x = data_augmentation(inputs)
x = base_model(x, training=False) 
x = GlobalAveragePooling2D()(x)

# ==========================================
# THE FIX: Extreme Regularization
# ==========================================
# 1. Increased Dropout to 50%
x = Dropout(0.5)(x) 
# 2. Added L2 Weight Decay to mathematically punish memorization
predictions = Dense(
    num_classes, 
    activation='softmax',
    kernel_regularizer=regularizers.l2(0.01) 
)(x)

model = Model(inputs=inputs, outputs=predictions)

# ==========================================
# PHASE 1: Train the Head 
# ==========================================
print("\n--- PHASE 1: Training the New Layers ---")
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3), 
              loss='categorical_crossentropy', 
              metrics=['accuracy'])

# Train slightly longer in Phase 1 since the L2 penalty slows down learning
model.fit(train_dataset, validation_data=val_dataset, epochs=15)

# ==========================================
# PHASE 2: Micro Fine-Tuning
# ==========================================
print("\n--- PHASE 2: Micro Fine-Tuning Top 5 Layers ---")
base_model.trainable = True

# 3. Only unfreeze the absolute top 5 layers to prevent gradient shock
for layer in base_model.layers[:-5]:
    layer.trainable = False

# Use a microscopic learning rate
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5), 
              loss='categorical_crossentropy', 
              metrics=['accuracy'])

callbacks = [
    ModelCheckpoint(MODEL_SAVE_NAME, save_best_only=True, monitor='val_accuracy', mode='max', verbose=1),
    # Added min_lr to prevent the learning rate from essentially dropping to zero
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7, verbose=1),
    EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True, verbose=1)
]

model.fit(train_dataset, validation_data=val_dataset, epochs=25, callbacks=callbacks)

print(f"\nTraining Complete! Best model saved as {MODEL_SAVE_NAME}")