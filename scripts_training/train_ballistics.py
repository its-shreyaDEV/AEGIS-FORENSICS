import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau, EarlyStopping
from tensorflow.keras import regularizers

#Data directories
DATA_DIR = "aegis_data/ballistics_ready"
MODEL_SAVE_NAME = "aegis_ballistics_model.keras"

print("Loading Ballistics Data.")

# We use a slightly larger batch size (32) now that we have plenty of data
train_dataset = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="training", seed=123,
    image_size=(224, 224), batch_size=32, label_mode='categorical'
)
val_dataset = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="validation", seed=123,
    image_size=(224, 224), batch_size=32, label_mode='categorical'
)

num_classes = len(train_dataset.class_names)
print(f"Detected Firearm Classes: {train_dataset.class_names}")
AUTOTUNE = tf.data.AUTOTUNE
train_dataset = train_dataset.prefetch(buffer_size=AUTOTUNE)
val_dataset = val_dataset.prefetch(buffer_size=AUTOTUNE)
print("Building Two-Phase EfficientNetB0 Architecture")
base_model = EfficientNetB0(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base_model.trainable = False 
inputs = tf.keras.Input(shape=(224, 224, 3))
x = base_model(inputs, training=False) 
x = GlobalAveragePooling2D()(x)
x = Dropout(0.5)(x) 
predictions = Dense(
    num_classes, 
    activation='softmax',
    kernel_regularizer=regularizers.l2(0.01) 
)(x)
model = Model(inputs=inputs, outputs=predictions)

#PHASE 1: Train the Head
print("\nPHASE 1: Training the New Layers")
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3), 
              loss='categorical_crossentropy', metrics=['accuracy'])

# Only 10 epochs needed for the head since the dataset is large
model.fit(train_dataset, validation_data=val_dataset, epochs=10)

# PHASE 2: Micro Fine-Tuning
print("\nPHASE 2: Micro Fine-Tuning Top 10 Layers")
base_model.trainable = True
for layer in base_model.layers[:-10]:
    layer.trainable = False
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5), 
              loss='categorical_crossentropy', metrics=['accuracy'])
callbacks = [
    ModelCheckpoint(MODEL_SAVE_NAME, save_best_only=True, monitor='val_accuracy', mode='max', verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7, verbose=1),
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, verbose=1)
]
model.fit(train_dataset, validation_data=val_dataset, epochs=20, callbacks=callbacks)
print(f"\nTraining Complete! Best model saved as {MODEL_SAVE_NAME}")