import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau, EarlyStopping

DATA_DIR = "aegis_data/bloodstain_dataset"
IMG_SIZE = 224
BATCH_SIZE = 32


# DATA GENERATOR
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.2,
    rotation_range=25,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.7, 1.3]
)
train_data = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    subset='training'
)
val_data = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    subset='validation'
)
base_model = EfficientNetB0(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

base_model.trainable = False
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.4)(x)
output = Dense(1, activation='sigmoid')(x)
model = Model(inputs=base_model.input, outputs=output)
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss='binary_crossentropy',
    metrics=['accuracy']
)


# handles imbalance automatically
total = 70205 + 36194
weight_for_0 = (1 / 70205) * (total / 2.0)
weight_for_1 = (1 / 36194) * (total / 2.0)
class_weight = {
    0: weight_for_0,  # blood
    1: weight_for_1   # non-blood
}
callbacks = [
    ModelCheckpoint("blood_detector.keras", save_best_only=True, monitor='val_accuracy'),
    ReduceLROnPlateau(patience=2, factor=0.3, verbose=1),
    EarlyStopping(patience=5, restore_best_weights=True)
]
model.fit(
    train_data,
    validation_data=val_data,
    epochs=15,
    class_weight=class_weight,
    callbacks=callbacks
)