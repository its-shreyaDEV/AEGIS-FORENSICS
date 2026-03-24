// src/utils/api.js
const BACKEND_URL = "http://127.0.0.1:10000";

// ── Core forensic analysis ────────────────────────────────────────
export const analyzeEvidenceAtBackend = async (file, moduleType, officerName = "Unknown Officer", caseNum = "CAS-UNKNOWN") => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("officer_name", officerName);
  fd.append("case_num", caseNum);
  try {
    if (moduleType === "facial_recognition" || moduleType === "face") {
      const res = await fetch(`${BACKEND_URL}/analyze-face`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Facial recognition failed.");
      return await res.json();
    }
    fd.append("module_type", moduleType);
    const res = await fetch(`${BACKEND_URL}/analyze`, { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Analysis failed.");
    return await res.json();
  } catch (e) { console.error("analyzeEvidenceAtBackend:", e); throw e; }
};

// ── 1-to-1 suspect verification ───────────────────────────────────
export const verifySuspect = async (file, suspectName, officerName = "Unknown Officer", caseNum = "CAS-UNKNOWN") => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("suspect_name", suspectName);
  fd.append("officer_name", officerName);
  fd.append("case_num", caseNum);
  try {
    const res = await fetch(`${BACKEND_URL}/verify-suspect`, { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Verification failed.");
    return await res.json();
  } catch (e) { console.error("verifySuspect:", e); throw e; }
};

// ── List suspects ─────────────────────────────────────────────────
export const listSuspects = async () => {
  const res = await fetch(`${BACKEND_URL}/list-suspects`);
  if (!res.ok) throw new Error("Could not load suspect list.");
  return await res.json();
};

// ── Verification history ──────────────────────────────────────────
export const getVerifications = async (caseNum = null) => {
  const url = caseNum
    ? `${BACKEND_URL}/get-verifications?case_num=${encodeURIComponent(caseNum)}`
    : `${BACKEND_URL}/get-verifications`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch verifications.");
  return await res.json();
};

// ── Single evidence integrity check ──────────────────────────────
// Re-hashes one evidence file on disk and compares to the sealed hash.
// Returns: { result: "INTACT"|"TAMPERED"|"MISSING", flagged, original_hash, recomputed_hash, ... }
export const verifyEvidenceIntegrity = async (evidenceId, officerName = "Unknown Officer", caseNum = "CAS-UNKNOWN") => {
  const fd = new FormData();
  fd.append("evidence_id",  evidenceId);
  fd.append("officer_name", officerName);
  fd.append("case_num",     caseNum);
  try {
    const res = await fetch(`${BACKEND_URL}/verify-evidence-integrity`, { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Integrity check failed.");
    return await res.json();
  } catch (e) { console.error("verifyEvidenceIntegrity:", e); throw e; }
};

// ── Batch case integrity check ────────────────────────────────────
// Re-hashes every file in a case. Returns a full report.
// Returns: { all_clear, total, intact, tampered, missing, records: [...] }
export const verifyCaseIntegrity = async (caseNum, officerName = "Unknown Officer") => {
  const fd = new FormData();
  fd.append("case_num",     caseNum);
  fd.append("officer_name", officerName);
  try {
    const res = await fetch(`${BACKEND_URL}/verify-case-integrity`, { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Case integrity check failed.");
    return await res.json();
  } catch (e) { console.error("verifyCaseIntegrity:", e); throw e; }
};

// ── Full ledger ───────────────────────────────────────────────────
export const getLedger = async () => {
  const res = await fetch(`${BACKEND_URL}/get-ledger`);
  if (!res.ok) throw new Error("Could not fetch ledger.");
  return await res.json();
};
