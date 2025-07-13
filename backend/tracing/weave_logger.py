import wandb
import json
from datetime import datetime
from typing import Dict, Any, List
from config import WANDB_API_KEY, WANDB_PROJECT

# Initialize W&B
wandb.login(key=WANDB_API_KEY)

class WeaveLogger:
    def __init__(self, session_name: str = None):
        self.session_name = session_name or f"clinical-trial-session-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.run = wandb.init(
            project=WANDB_PROJECT,
            name=self.session_name,
            reinit=True,
            tags=["clinical-trials", "eligibility-analysis", "document-ai", "vertex-ai"]
        )
        self.step_counter = 0
        
    def log_workflow_step(self, step_name: str, data: Dict[str, Any], metadata: Dict[str, Any] = None):
        """
        Log a workflow step with structured data and metadata
        """
        self.step_counter += 1
        
        # Create structured log entry
        log_entry = {
            "step": self.step_counter,
            "step_name": step_name,
            "timestamp": datetime.now().isoformat(),
            "data": data,
            "metadata": metadata or {}
        }
        
        # Log to W&B with step-specific metrics
        wandb.log({
            f"step_{self.step_counter}_{step_name}": log_entry,
            "current_step": self.step_counter,
            "step_name": step_name
        })
        
        # Log step-specific metrics
        self._log_step_metrics(step_name, data, metadata)
        
        print(f"[W&B Weave] Step {self.step_counter} - {step_name}: {self._format_data_for_display(data)}")
    
    def _log_step_metrics(self, step_name: str, data: Dict[str, Any], metadata: Dict[str, Any]):
        """
        Log step-specific metrics and charts
        """
        metrics = {}
        
        if step_name == "upload_pdf":
            metrics["pdf_uploaded"] = 1
            metrics["filename"] = data.get("filename", "unknown")
            
        elif step_name == "parsed_pdf":
            metrics["pdf_parsed"] = 1
            if "age" in data:
                metrics["patient_age"] = data["age"]
            if "allergies" in data:
                metrics["num_allergies"] = len(data["allergies"])
            if "existing_conditions" in data:
                metrics["num_conditions"] = len(data["existing_conditions"])
            if "lab_results" in data:
                metrics["num_lab_results"] = len(data["lab_results"])
                
        elif step_name == "fetched_trials":
            metrics["num_trials_fetched"] = data.get("num_trials", 0)
            
        elif step_name == "eligibility_analysis":
            if isinstance(data, list):
                metrics["num_trials_analyzed"] = len(data)
                eligible_trials = sum(1 for trial in data if trial.get("overall_eligible", False))
                metrics["num_eligible_trials"] = eligible_trials
                metrics["eligibility_rate"] = eligible_trials / len(data) if data else 0
                
                # Log criteria analysis
                total_criteria = sum(len(trial.get("criteria", [])) for trial in data)
                met_criteria = sum(
                    sum(1 for c in trial.get("criteria", []) if c.get("eligible", False))
                    for trial in data
                )
                metrics["total_criteria_analyzed"] = total_criteria
                metrics["criteria_met"] = met_criteria
                metrics["criteria_success_rate"] = met_criteria / total_criteria if total_criteria else 0
        
        # Log metrics to W&B
        if metrics:
            wandb.log(metrics)
    
    def log_patient_summary(self, patient_data: Dict[str, Any]):
        """
        Log patient summary with structured data
        """
        summary = {
            "patient_name": patient_data.get("name", "Unknown"),
            "patient_age": patient_data.get("age"),
            "allergies": patient_data.get("allergies", []),
            "conditions": patient_data.get("existing_conditions", []),
            "lab_results": patient_data.get("lab_results", {}),
            "summary_length": len(patient_data.get("summary", "")),
            "has_raw_text": bool(patient_data.get("raw_text"))
        }
        
        wandb.log({"patient_summary": summary})
        
        # Create patient demographics table
        demographics_data = [
            ["Name", str(patient_data.get("name", "Unknown"))],
            ["Age", str(patient_data.get("age", "Unknown"))],
            ["Allergies", ", ".join(patient_data.get("allergies", []))],
            ["Conditions", ", ".join(patient_data.get("existing_conditions", []))],
            ["Lab Results", str(len(patient_data.get("lab_results", {})))]
        ]
        
        demographics_table = wandb.Table(
            columns=["Field", "Value"],
            data=demographics_data
        )
        
        wandb.log({"patient_demographics": demographics_table})
    
    def log_trials_summary(self, trials: List[Dict[str, Any]]):
        """
        Log trials summary with structured data
        """
        if not trials:
            return
            
        # Create trials table
        trials_data = []
        for trial in trials:
            trials_data.append([
                str(trial.get("trial_id", "Unknown")),
                str(trial.get("title", "Unknown")),
                str(len(trial.get("eligibility_criteria", []))),
                ", ".join(trial.get("conditions", [])),
                str(trial.get("status", "Unknown"))
            ])
        
        trials_table = wandb.Table(
            columns=["Trial ID", "Title", "Criteria Count", "Conditions", "Status"],
            data=trials_data
        )
        
        wandb.log({"trials_summary": trials_table})
        
        # Log aggregate metrics
        wandb.log({
            "total_trials": len(trials),
            "avg_criteria_per_trial": sum(len(t.get("eligibility_criteria", [])) for t in trials) / len(trials),
            "unique_conditions": len(set(c for t in trials for c in t.get("conditions", [])))
        })
    
    def log_eligibility_results(self, results: List[Dict[str, Any]]):
        """
        Log eligibility analysis results with detailed metrics
        """
        if not results:
            return
            
        # Create eligibility results table
        results_data = []
        for result in results:
            eligible_criteria = sum(1 for c in result.get("criteria", []) if c.get("eligible", False))
            total_criteria = len(result.get("criteria", []))
            
            results_data.append([
                str(result.get("trial_id", "Unknown")),
                str(result.get("title", "Unknown")),
                "✅" if result.get("overall_eligible", False) else "❌",
                f"{eligible_criteria}/{total_criteria}",
                str(result.get("eligibility_summary", "No summary"))
            ])
        
        results_table = wandb.Table(
            columns=["Trial ID", "Title", "Eligible", "Criteria Met", "Summary"],
            data=results_data
        )
        
        wandb.log({"eligibility_results": results_table})
        
        # Create detailed criteria analysis
        criteria_data = []
        for result in results:
            for criterion in result.get("criteria", []):
                criteria_data.append([
                    str(result.get("trial_id", "Unknown")),
                    str(criterion.get("type", "Unknown")),
                    str(criterion.get("criterion", "Unknown")),
                    "✅" if criterion.get("eligible", False) else "❌",
                    str(criterion.get("explanation", "No explanation")),
                    str(criterion.get("confidence", "Unknown")),
                    str(criterion.get("analyzed_by", "Unknown"))
                ])
        
        criteria_table = wandb.Table(
            columns=["Trial ID", "Type", "Criterion", "Eligible", "Explanation", "Confidence", "Analyzed By"],
            data=criteria_data
        )
        
        wandb.log({"detailed_criteria_analysis": criteria_table})
    
    def log_error(self, error_type: str, error_message: str, context: Dict[str, Any] = None):
        """
        Log errors with context
        """
        error_entry = {
            "error_type": error_type,
            "error_message": error_message,
            "timestamp": datetime.now().isoformat(),
            "context": context or {}
        }
        
        wandb.log({"error": error_entry})
        print(f"[W&B Weave] ERROR - {error_type}: {error_message}")
    
    def finalize_session(self, final_results: Dict[str, Any]):
        """
        Finalize the session with summary metrics
        """
        summary_metrics = {
            "session_completed": True,
            "total_steps": self.step_counter,
            "completion_time": datetime.now().isoformat(),
            "final_results": final_results
        }
        
        wandb.log(summary_metrics)
        wandb.finish()
        
        print(f"[W&B Weave] Session {self.session_name} completed with {self.step_counter} steps")
    
    def _format_data_for_display(self, data: Dict[str, Any]) -> str:
        """
        Format data for console display
        """
        if isinstance(data, dict):
            if len(str(data)) > 200:
                return f"{str(data)[:200]}..."
            return str(data)
        return str(data)

# Global logger instance
_logger = None

def get_logger() -> WeaveLogger:
    """
    Get or create the global logger instance
    """
    global _logger
    if _logger is None:
        _logger = WeaveLogger()
    return _logger

def log_workflow_step(step_name: str, data: Dict[str, Any], metadata: Dict[str, Any] = None):
    """
    Convenience function for logging workflow steps
    """
    logger = get_logger()
    logger.log_workflow_step(step_name, data, metadata)

def log_patient_summary(patient_data: Dict[str, Any]):
    """
    Convenience function for logging patient summary
    """
    logger = get_logger()
    logger.log_patient_summary(patient_data)

def log_trials_summary(trials: List[Dict[str, Any]]):
    """
    Convenience function for logging trials summary
    """
    logger = get_logger()
    logger.log_trials_summary(trials)

def log_eligibility_results(results: List[Dict[str, Any]]):
    """
    Convenience function for logging eligibility results
    """
    logger = get_logger()
    logger.log_eligibility_results(results)

def log_error(error_type: str, error_message: str, context: Dict[str, Any] = None):
    """
    Convenience function for logging errors
    """
    logger = get_logger()
    logger.log_error(error_type, error_message, context)

def finalize_session(final_results: Dict[str, Any]):
    """
    Convenience function for finalizing the session
    """
    logger = get_logger()
    logger.finalize_session(final_results) 