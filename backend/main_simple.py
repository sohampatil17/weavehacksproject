from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
from agents.workflow import run_agent_workflow

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Clinical Trial Matching API - Simplified")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "version": "Simplified - Real Data"}

@app.post("/upload-pdf")
def upload_pdf(file: UploadFile = File(...)):
    """Upload PDF and run clinical trial matching workflow"""
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    
    print(f"Processing file: {file.filename}")
    result = run_agent_workflow(file_location)
    
    return {"filename": file.filename, "workflow_result": result} 