"""
Google ADK Agent Implementation for Clinical Trial Matching
Refactors the existing workflow into proper Google ADK agents with A2A Protocol support
"""

import json
import os
from typing import Dict, List, Any, Optional
from google.adk import Agent, Runner
from google.adk.tools import FunctionTool
from a2a_protocol.dataclass import Message, TextPart, Role, Task, TaskStatus

from services.document_ai import parse_pdf_with_document_ai
from services.clinicaltrials_api import fetch_trials
from services.vertex_ai import run_eligibility_analysis
from tracing.weave_logger import (
    log_workflow_step, 
    log_patient_summary, 
    log_trials_summary, 
    log_eligibility_results,
    log_error,
    finalize_session
)

class DocumentProcessingAgent:
    """ADK Agent for processing patient PDF documents using Google Document AI"""
    
    def __init__(self):
        self.agent = Agent(
            name="document_processing_agent",
            model="gemini-2.0-flash",
            description="Agent specialized in processing patient medical documents using Google Document AI",
            instruction=(
                "You are a medical document processing agent. Your role is to extract patient information "
                "from PDF documents including demographics, medical conditions, allergies, and lab results. "
                "Use the parse_patient_pdf function to process documents."
            ),
            tools=[FunctionTool(self.parse_patient_pdf)]
        )
    
    def parse_patient_pdf(self, pdf_path: str) -> dict:
        """
        Parse patient PDF document using Google Document AI
        
        Args:
            pdf_path: Path to the patient PDF file
            
        Returns:
            Dictionary containing extracted patient information
        """
        try:
            log_workflow_step("parsing_pdf", {"status": "starting", "file": pdf_path})
            parsed_data = parse_pdf_with_document_ai(pdf_path)
            log_workflow_step("parsed_pdf", parsed_data)
            log_patient_summary(parsed_data)
            return parsed_data
        except Exception as e:
            log_error("document_processing_error", str(e), {"pdf_path": pdf_path})
            raise


class ClinicalTrialsAgent:
    """ADK Agent for fetching relevant clinical trials from clinicaltrials.gov"""
    
    def __init__(self):
        self.agent = Agent(
            name="clinical_trials_agent",
            model="gemini-2.0-flash",
            description="Agent specialized in finding relevant clinical trials from clinicaltrials.gov",
            instruction=(
                "You are a clinical trials research agent. Your role is to find relevant clinical trials "
                "based on patient conditions and demographics. Use the fetch_clinical_trials function "
                "to search for trials."
            ),
            tools=[FunctionTool(self.fetch_clinical_trials)]
        )
    
    def fetch_clinical_trials(self, patient_data: dict) -> list:
        """
        Fetch relevant clinical trials based on patient data
        
        Args:
            patient_data: Dictionary containing patient information
            
        Returns:
            List of relevant clinical trials
        """
        try:
            log_workflow_step("fetching_trials", {
                "status": "starting", 
                "patient_conditions": patient_data.get("existing_conditions", [])
            })
            trials = fetch_trials(patient_data)
            log_workflow_step("fetched_trials", {"num_trials": len(trials)})
            log_trials_summary(trials)
            return trials
        except Exception as e:
            log_error("clinical_trials_error", str(e), {"patient_data": patient_data})
            raise


class EligibilityAnalysisAgent:
    """ADK Agent for analyzing patient eligibility using Vertex AI Gemini"""
    
    def __init__(self):
        self.agent = Agent(
            name="eligibility_analysis_agent",
            model="gemini-2.0-flash",
            description="Agent specialized in analyzing patient eligibility for clinical trials using AI",
            instruction=(
                "You are an AI-powered eligibility analysis agent. Your role is to analyze patient data "
                "against clinical trial criteria and determine eligibility with detailed reasoning. "
                "Use the analyze_eligibility function to perform the analysis."
            ),
            tools=[FunctionTool(self.analyze_eligibility)]
        )
    
    def analyze_eligibility(self, patient_data: dict, trials: list) -> list:
        """
        Analyze patient eligibility for clinical trials
        
        Args:
            patient_data: Dictionary containing patient information
            trials: List of clinical trials to analyze
            
        Returns:
            List of eligibility analysis results
        """
        try:
            log_workflow_step("analyzing_eligibility", {
                "status": "starting", 
                "num_trials": len(trials)
            })
            eligibility_results = run_eligibility_analysis(patient_data, trials)
            log_workflow_step("eligibility_analysis", eligibility_results)
            log_eligibility_results(eligibility_results)
            return eligibility_results
        except Exception as e:
            log_error("eligibility_analysis_error", str(e), {
                "patient_data": patient_data,
                "num_trials": len(trials)
            })
            raise


class ClinicalTrialOrchestrator:
    """Main orchestrator agent that coordinates the workflow using A2A Protocol"""
    
    def __init__(self):
        self.document_agent = DocumentProcessingAgent()
        self.trials_agent = ClinicalTrialsAgent()
        self.eligibility_agent = EligibilityAnalysisAgent()
        
        self.agent = Agent(
            name="clinical_trial_orchestrator",
            model="gemini-2.0-flash",
            description="Main orchestrator for clinical trial matching workflow",
            instruction=(
                "You are the main orchestrator for clinical trial matching. You coordinate between "
                "document processing, clinical trials search, and eligibility analysis agents to "
                "provide comprehensive clinical trial matching services."
            ),
            tools=[FunctionTool(self.run_full_workflow)]
        )
    
    def run_full_workflow(self, patient_pdf_path: str) -> dict:
        """
        Run the complete clinical trial matching workflow
        
        Args:
            patient_pdf_path: Path to the patient PDF file
            
        Returns:
            Complete workflow results
        """
        context = {"pdf_path": patient_pdf_path}
        log_workflow_step("start_workflow", context)
        
        try:
            # Step 1: Document Processing
            parsed_data = self.document_agent.parse_patient_pdf(patient_pdf_path)
            context["parsed_data"] = parsed_data
            
            # Step 2: Clinical Trials Search
            trials = self.trials_agent.fetch_clinical_trials(parsed_data)
            context["trials"] = trials
            
            # Step 3: Eligibility Analysis
            eligibility_results = self.eligibility_agent.analyze_eligibility(parsed_data, trials)
            context["eligibility_results"] = eligibility_results
            
            # Step 4: Finalize
            eligible_count = sum(1 for r in eligibility_results if r.get("overall_eligible", False))
            log_workflow_step("end_workflow", {
                "status": "completed", 
                "total_trials": len(trials), 
                "eligible_trials": eligible_count
            })
            finalize_session(context)
            
            return context
            
        except Exception as e:
            error_context = {
                "pdf_path": patient_pdf_path,
                "current_context": context
            }
            log_error("workflow_error", str(e), error_context)
            
            context["error"] = str(e)
            context["status"] = "failed"
            return context


class A2AMessageHandler:
    """Handler for A2A Protocol messages between agents"""
    
    def __init__(self, orchestrator: ClinicalTrialOrchestrator):
        self.orchestrator = orchestrator
    
    def handle_message(self, message: Message) -> Message:
        """
        Handle incoming A2A Protocol messages
        
        Args:
            message: A2A Protocol message
            
        Returns:
            Response message
        """
        try:
            if message.role == Role.user and message.parts:
                text_part = message.parts[0]
                if isinstance(text_part, TextPart):
                    # Parse the message to extract PDF path
                    if "pdf_path:" in text_part.text:
                        pdf_path = text_part.text.split("pdf_path:")[1].strip()
                        
                        # Run the workflow
                        results = self.orchestrator.run_full_workflow(pdf_path)
                        
                        # Create response message
                        response_text = json.dumps(results, indent=2)
                        return Message(
                            role=Role.agent,
                            parts=[TextPart(type="text", text=response_text)]
                        )
            
            return Message(
                role=Role.agent,
                parts=[TextPart(type="text", text="Invalid message format")]
            )
            
        except Exception as e:
            return Message(
                role=Role.agent,
                parts=[TextPart(type="text", text=f"Error processing message: {str(e)}")]
            )


# Initialize the ADK agents
def initialize_adk_agents():
    """Initialize all Google ADK agents"""
    orchestrator = ClinicalTrialOrchestrator()
    message_handler = A2AMessageHandler(orchestrator)
    
    return {
        "orchestrator": orchestrator,
        "message_handler": message_handler,
        "document_agent": orchestrator.document_agent,
        "trials_agent": orchestrator.trials_agent,
        "eligibility_agent": orchestrator.eligibility_agent
    } 