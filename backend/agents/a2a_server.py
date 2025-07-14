"""
A2A Protocol Server for Clinical Trial Matching Agents
Implements agent discovery and communication using A2A Protocol
"""

import json
import uuid
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from a2a_protocol.dataclass import Message, TextPart, Role, Task, TaskStatus
from a2a_protocol.pydantic_v2 import Message as PydanticMessage, Part, TextPart as PydanticTextPart, Role as PydanticRole

from agents.adk_agents import initialize_adk_agents
from tracing.weave_logger import log_workflow_step, log_error

# Agent registry for discovery
AGENT_REGISTRY = {}

class AgentInfo(BaseModel):
    """Agent information for discovery"""
    agent_id: str
    name: str
    description: str
    capabilities: List[str]
    endpoint: str
    status: str = "active"

class A2ARequest(BaseModel):
    """A2A Protocol request"""
    agent_id: str
    message: Dict[str, Any]
    task_id: Optional[str] = None

class A2AResponse(BaseModel):
    """A2A Protocol response"""
    status: str
    message: Dict[str, Any]
    task_id: Optional[str] = None
    agent_id: str

class A2AProtocolServer:
    """A2A Protocol Server for agent communication"""
    
    def __init__(self):
        self.app = FastAPI(title="Clinical Trial Matching A2A Server")
        self.agents = initialize_adk_agents()
        self.tasks = {}  # Task tracking
        self.setup_routes()
        self.register_agents()
    
    def setup_routes(self):
        """Setup FastAPI routes for A2A Protocol"""
        
        @self.app.get("/agents")
        async def list_agents():
            """List all available agents"""
            return {"agents": list(AGENT_REGISTRY.values())}
        
        @self.app.get("/agents/{agent_id}")
        async def get_agent_info(agent_id: str):
            """Get information about a specific agent"""
            if agent_id not in AGENT_REGISTRY:
                raise HTTPException(status_code=404, detail="Agent not found")
            return AGENT_REGISTRY[agent_id]
        
        @self.app.post("/agents/{agent_id}/message")
        async def send_message(agent_id: str, request: A2ARequest):
            """Send a message to a specific agent"""
            try:
                if agent_id not in AGENT_REGISTRY:
                    raise HTTPException(status_code=404, detail="Agent not found")
                
                # Process message based on agent type
                response_message = await self.process_agent_message(agent_id, request.message)
                
                return A2AResponse(
                    status="success",
                    message=response_message,
                    task_id=request.task_id,
                    agent_id=agent_id
                )
                
            except Exception as e:
                log_error("a2a_message_error", str(e), {"agent_id": agent_id, "request": request.dict()})
                return A2AResponse(
                    status="error",
                    message={"error": str(e)},
                    task_id=request.task_id,
                    agent_id=agent_id
                )
        
        @self.app.post("/workflow/run")
        async def run_workflow(pdf_path: str):
            """Run the complete clinical trial matching workflow"""
            try:
                task_id = str(uuid.uuid4())
                
                # Create A2A message for orchestrator
                message = {
                    "role": "user",
                    "parts": [{"type": "text", "text": f"pdf_path:{pdf_path}"}]
                }
                
                # Send to orchestrator
                request = A2ARequest(
                    agent_id="clinical_trial_orchestrator",
                    message=message,
                    task_id=task_id
                )
                
                response = await self.send_message("clinical_trial_orchestrator", request)
                return response
                
            except Exception as e:
                log_error("workflow_error", str(e), {"pdf_path": pdf_path})
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/tasks/{task_id}")
        async def get_task_status(task_id: str):
            """Get task status"""
            if task_id not in self.tasks:
                raise HTTPException(status_code=404, detail="Task not found")
            return self.tasks[task_id]
        
        @self.app.post("/tasks/{task_id}/cancel")
        async def cancel_task(task_id: str):
            """Cancel a task"""
            if task_id not in self.tasks:
                raise HTTPException(status_code=404, detail="Task not found")
            
            self.tasks[task_id]["status"] = "cancelled"
            return {"status": "cancelled", "task_id": task_id}
    
    def register_agents(self):
        """Register all agents in the registry"""
        
        # Document Processing Agent
        AGENT_REGISTRY["document_processing_agent"] = AgentInfo(
            agent_id="document_processing_agent",
            name="Document Processing Agent",
            description="Processes patient PDF documents using Google Document AI",
            capabilities=["pdf_parsing", "data_extraction", "medical_document_processing"],
            endpoint="/agents/document_processing_agent/message"
        ).dict()
        
        # Clinical Trials Agent
        AGENT_REGISTRY["clinical_trials_agent"] = AgentInfo(
            agent_id="clinical_trials_agent",
            name="Clinical Trials Agent",
            description="Fetches relevant clinical trials from clinicaltrials.gov",
            capabilities=["trial_search", "condition_matching", "eligibility_filtering"],
            endpoint="/agents/clinical_trials_agent/message"
        ).dict()
        
        # Eligibility Analysis Agent
        AGENT_REGISTRY["eligibility_analysis_agent"] = AgentInfo(
            agent_id="eligibility_analysis_agent",
            name="Eligibility Analysis Agent",
            description="Analyzes patient eligibility for clinical trials using AI",
            capabilities=["eligibility_analysis", "ai_reasoning", "criteria_matching"],
            endpoint="/agents/eligibility_analysis_agent/message"
        ).dict()
        
        # Orchestrator Agent
        AGENT_REGISTRY["clinical_trial_orchestrator"] = AgentInfo(
            agent_id="clinical_trial_orchestrator",
            name="Clinical Trial Orchestrator",
            description="Main orchestrator for clinical trial matching workflow",
            capabilities=["workflow_orchestration", "agent_coordination", "result_aggregation"],
            endpoint="/agents/clinical_trial_orchestrator/message"
        ).dict()
    
    async def process_agent_message(self, agent_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """Process message for a specific agent"""
        
        log_workflow_step("a2a_message", {
            "agent_id": agent_id,
            "message_type": message.get("role", "unknown")
        })
        
        try:
            # Convert message to A2A Protocol format
            a2a_message = Message(
                role=Role.user if message.get("role") == "user" else Role.agent,
                parts=[TextPart(type="text", text=part.get("text", "")) for part in message.get("parts", [])]
            )
            
            # Route to appropriate agent
            if agent_id == "document_processing_agent":
                # Extract PDF path from message
                text = message.get("parts", [{}])[0].get("text", "")
                if "pdf_path:" in text:
                    pdf_path = text.split("pdf_path:")[1].strip()
                    result = self.agents["document_agent"].parse_patient_pdf(pdf_path)
                    return {"role": "agent", "parts": [{"type": "text", "text": json.dumps(result)}]}
            
            elif agent_id == "clinical_trials_agent":
                # Extract patient data from message
                text = message.get("parts", [{}])[0].get("text", "")
                if "patient_data:" in text:
                    patient_data_str = text.split("patient_data:")[1].strip()
                    patient_data = json.loads(patient_data_str)
                    result = self.agents["trials_agent"].fetch_clinical_trials(patient_data)
                    return {"role": "agent", "parts": [{"type": "text", "text": json.dumps(result)}]}
            
            elif agent_id == "eligibility_analysis_agent":
                # Extract patient data and trials from message
                text = message.get("parts", [{}])[0].get("text", "")
                if "patient_data:" in text and "trials:" in text:
                    parts = text.split("trials:")
                    patient_data_str = parts[0].split("patient_data:")[1].strip()
                    trials_str = parts[1].strip()
                    
                    patient_data = json.loads(patient_data_str)
                    trials = json.loads(trials_str)
                    
                    result = self.agents["eligibility_agent"].analyze_eligibility(patient_data, trials)
                    return {"role": "agent", "parts": [{"type": "text", "text": json.dumps(result)}]}
            
            elif agent_id == "clinical_trial_orchestrator":
                # Use the message handler
                response = self.agents["message_handler"].handle_message(a2a_message)
                return {
                    "role": "agent",
                    "parts": [{"type": "text", "text": response.parts[0].text if response.parts else ""}]
                }
            
            else:
                raise ValueError(f"Unknown agent: {agent_id}")
                
        except Exception as e:
            log_error("agent_processing_error", str(e), {"agent_id": agent_id, "message": message})
            return {
                "role": "agent",
                "parts": [{"type": "text", "text": f"Error processing message: {str(e)}"}]
            }


# Create the A2A server instance
def create_a2a_server():
    """Create and configure the A2A Protocol server"""
    return A2AProtocolServer()


# For testing the server
if __name__ == "__main__":
    import uvicorn
    
    server = create_a2a_server()
    uvicorn.run(server.app, host="0.0.0.0", port=8001) 