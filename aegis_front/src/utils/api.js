// src/utils/api.js

const BACKEND_URL = "http://127.0.0.1:8000"; // Your FastAPI address

export const analyzeEvidenceAtBackend = async (file, moduleType) => {
  // 1. Package the file and the requested AI module into a FormData object
  const formData = new FormData();
  formData.append("file", file);
  formData.append("module_type", moduleType); // e.g., 'bloodstain', 'damage', 'ballistics'

  try {
    // 2. Send the POST request to your FastAPI router
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Server failed to process image.");
    }

    // 3. Parse and return the AI prediction
    /* Expected Return Format from your app.py:
      {
        "filename": "blood_spill.jpg",
        "hash": "a1b2c3d4...",
        "prediction": "Blood",
        "confidence": 0.9984,
        "module_type": "bloodstain"
      }
    */
    return await response.json();
    
  } catch (error) {
    console.error("Integration Error:", error);
    throw error;
  }
};