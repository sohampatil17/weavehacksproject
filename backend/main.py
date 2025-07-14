from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
from agents.workflow import run_agent_workflow
from agents.a2a_server import create_a2a_server
from tracing.weave_logger import log_workflow_step

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Clinical Trial Matching API with Google ADK + A2A Protocol")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize A2A Protocol server
a2a_server = create_a2a_server()

# Mount A2A Protocol endpoints
app.mount("/a2a", a2a_server.app)

@app.get("/health")
def health():
    return {"status": "ok", "version": "Phase 2 - Google ADK + A2A Protocol"}

@app.post("/upload-pdf")
def upload_pdf(file: UploadFile = File(...)):
    """Legacy endpoint - uses original workflow"""
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    log_workflow_step("upload_pdf", {"filename": file.filename})
    result = run_agent_workflow(file_location)
    return {"filename": file.filename, "workflow_result": result}

@app.post("/upload-pdf-adk")
async def upload_pdf_adk(file: UploadFile = File(...)):
    """New endpoint - uses Google ADK agents with A2A Protocol"""
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    
    log_workflow_step("upload_pdf_adk", {"filename": file.filename})
    
    # Use A2A Protocol to run workflow
    try:
        # Use the orchestrator agent directly
        from agents.adk_agents import ClinicalTrialOrchestrator
        orchestrator = ClinicalTrialOrchestrator()
        response = orchestrator.run_full_workflow(file_location)
        
        return {
            "filename": file.filename, 
            "workflow_result": response,
            "agent_system": "Google ADK + A2A Protocol"
        }
    except Exception as e:
        # Fall back to original workflow if A2A fails
        print(f"A2A workflow failed: {e}, falling back to original workflow")
        result = run_agent_workflow(file_location)
        return {
            "filename": file.filename, 
            "workflow_result": result,
            "agent_system": "Fallback - Original Workflow"
        }

@app.get("/agents")
async def list_agents():
    """List all available agents"""
    return await a2a_server.app.get("/agents")

@app.get("/agents/{agent_id}")
async def get_agent_info(agent_id: str):
    """Get information about a specific agent"""
    return await a2a_server.app.get(f"/agents/{agent_id}")

@app.post("/agents/{agent_id}/message")
async def send_agent_message(agent_id: str, message: dict):
    """Send a message to a specific agent"""
    from agents.a2a_server import A2ARequest
    request = A2ARequest(agent_id=agent_id, message=message)
    return await a2a_server.app.post(f"/agents/{agent_id}/message", json=request.dict()) 