import requests
import json
from typing import List, Dict, Any
from config import VERTEX_API_KEY

def run_eligibility_analysis(patient_data: Dict[str, Any], trials: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Run LLM-based eligibility analysis using Vertex AI Gemini
    """
    try:
        results = []
        
        for trial in trials:
            # Analyze eligibility for each trial
            trial_result = analyze_trial_eligibility(patient_data, trial)
            results.append(trial_result)
        
        return results
        
    except Exception as e:
        print(f"Error running eligibility analysis with Vertex AI: {str(e)}")
        # Return mock analysis as fallback
        return get_mock_eligibility_analysis(patient_data, trials)

def analyze_trial_eligibility(patient_data: Dict[str, Any], trial: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze patient eligibility for a specific trial using Gemini
    """
    criteria_results = []
    
    for criterion in trial.get("eligibility_criteria", []):
        # Analyze each criterion using Gemini
        eligibility_result = analyze_single_criterion(patient_data, criterion, trial)
        criteria_results.append(eligibility_result)
    
    # Determine overall eligibility
    inclusion_criteria = [c for c in criteria_results if c.get("type") == "inclusion"]
    exclusion_criteria = [c for c in criteria_results if c.get("type") == "exclusion"]
    
    # Patient is eligible if they meet ALL inclusion criteria AND NO exclusion criteria
    meets_inclusions = all(c.get("eligible", False) for c in inclusion_criteria)
    meets_exclusions = all(not c.get("eligible", True) for c in exclusion_criteria)
    
    overall_eligible = meets_inclusions and meets_exclusions
    
    return {
        "trial_id": trial["trial_id"],
        "title": trial["title"],
        "criteria": criteria_results,
        "overall_eligible": overall_eligible,
        "eligibility_summary": generate_eligibility_summary(criteria_results, overall_eligible)
    }

def analyze_single_criterion(patient_data: Dict[str, Any], criterion: Dict[str, str], trial: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze a single eligibility criterion using Gemini
    """
    # Create prompt for Gemini
    prompt = create_eligibility_prompt(patient_data, criterion, trial)
    
    try:
        # Call Gemini API
        gemini_response = call_gemini_api(prompt)
        
        # Parse response
        eligibility_result = parse_gemini_response(gemini_response, criterion)
        
        return eligibility_result
        
    except Exception as e:
        print(f"Error analyzing criterion with Gemini: {str(e)}")
        # Fallback to rule-based analysis
        return fallback_criterion_analysis(patient_data, criterion)

def create_eligibility_prompt(patient_data: Dict[str, Any], criterion: Dict[str, str], trial: Dict[str, Any]) -> str:
    """
    Create a prompt for Gemini to analyze eligibility
    """
    prompt = f"""
You are a clinical trial eligibility expert. Analyze whether a patient meets a specific eligibility criterion.

PATIENT INFORMATION:
- Name: {patient_data.get('name', 'Unknown')}
- Age: {patient_data.get('age', 'Unknown')}
- Allergies: {', '.join(patient_data.get('allergies', []))}
- Medical Conditions: {', '.join(patient_data.get('existing_conditions', []))}
- Lab Results: {json.dumps(patient_data.get('lab_results', {}))}
- Summary: {patient_data.get('summary', 'No summary available')}

TRIAL INFORMATION:
- Trial ID: {trial['trial_id']}
- Title: {trial['title']}
- Conditions: {', '.join(trial.get('conditions', []))}

ELIGIBILITY CRITERION TO EVALUATE:
- Type: {criterion['type']} criterion
- Criterion: {criterion['criterion']}

INSTRUCTIONS:
1. Analyze if the patient meets this specific criterion
2. Provide a clear YES or NO answer
3. Give a brief explanation (1-2 sentences)
4. Consider the criterion type (inclusion vs exclusion)

RESPONSE FORMAT:
ELIGIBLE: [YES/NO]
EXPLANATION: [Brief explanation]
CONFIDENCE: [HIGH/MEDIUM/LOW]
"""
    
    return prompt

def call_gemini_api(prompt: str) -> str:
    """
    Call the Vertex AI Gemini API
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={VERTEX_API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 500
        }
    }
    
    response = requests.post(url, headers=headers, json=data, timeout=30)
    response.raise_for_status()
    
    result = response.json()
    return result["candidates"][0]["content"]["parts"][0]["text"]

def parse_gemini_response(response_text: str, criterion: Dict[str, str]) -> Dict[str, Any]:
    """
    Parse Gemini's response to extract eligibility decision
    """
    # Extract eligible status
    eligible = False
    explanation = "Unable to determine eligibility"
    confidence = "LOW"
    
    lines = response_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if line.startswith("ELIGIBLE:"):
            eligible_text = line.split(":", 1)[1].strip().upper()
            eligible = eligible_text == "YES"
        elif line.startswith("EXPLANATION:"):
            explanation = line.split(":", 1)[1].strip()
        elif line.startswith("CONFIDENCE:"):
            confidence = line.split(":", 1)[1].strip().upper()
    
    return {
        "criterion": criterion["criterion"],
        "type": criterion["type"],
        "eligible": eligible,
        "explanation": explanation,
        "confidence": confidence,
        "analyzed_by": "gemini"
    }

def fallback_criterion_analysis(patient_data: Dict[str, Any], criterion: Dict[str, str]) -> Dict[str, Any]:
    """
    Fallback rule-based analysis if Gemini fails
    """
    eligible = True
    explanation = "Analyzed using rule-based fallback"
    
    criterion_text = criterion["criterion"].lower()
    
    # Age-based criteria
    if "age" in criterion_text and patient_data.get("age"):
        age = patient_data["age"]
        if ">=" in criterion_text:
            try:
                min_age = int(criterion_text.split(">=")[-1].strip())
                eligible = age >= min_age
                explanation = f"Patient age ({age}) vs minimum age ({min_age})"
            except:
                pass
        elif "40-65" in criterion_text:
            eligible = 40 <= age <= 65
            explanation = f"Patient age ({age}) vs required range (40-65)"
    
    # Allergy-based criteria
    elif "allergy" in criterion_text and patient_data.get("allergies"):
        allergies = [a.lower() for a in patient_data["allergies"]]
        if "penicillin" in criterion_text.lower():
            eligible = "penicillin" not in allergies
            explanation = f"Patient allergies: {', '.join(patient_data['allergies'])}"
    
    # Condition-based criteria
    elif any(condition in criterion_text for condition in ["diabetes", "cancer", "kidney"]):
        conditions = [c.lower() for c in patient_data.get("existing_conditions", [])]
        if "diabetes" in criterion_text:
            eligible = any("diabetes" in c for c in conditions)
            explanation = f"Patient conditions: {', '.join(patient_data.get('existing_conditions', []))}"
        elif "cancer" in criterion_text and criterion["type"] == "exclusion":
            eligible = not any("cancer" in c for c in conditions)
            explanation = f"No cancer history found in patient conditions"
    
    return {
        "criterion": criterion["criterion"],
        "type": criterion["type"],
        "eligible": eligible,
        "explanation": explanation,
        "confidence": "MEDIUM",
        "analyzed_by": "fallback"
    }

def generate_eligibility_summary(criteria_results: List[Dict[str, Any]], overall_eligible: bool) -> str:
    """
    Generate a summary of eligibility analysis
    """
    total_criteria = len(criteria_results)
    met_criteria = sum(1 for c in criteria_results if c.get("eligible", False))
    
    if overall_eligible:
        return f"Patient is ELIGIBLE. Meets {met_criteria}/{total_criteria} criteria."
    else:
        return f"Patient is NOT ELIGIBLE. Meets {met_criteria}/{total_criteria} criteria."

def get_mock_eligibility_analysis(patient_data: Dict[str, Any], trials: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Return mock eligibility analysis as fallback
    """
    results = []
    
    for trial in trials:
        criteria_results = []
        for crit in trial.get("eligibility_criteria", []):
            # Mock logic
            eligible = True
            explanation = "Mock analysis"
            
            if crit["type"] == "exclusion" and "cancer" in patient_data.get("summary", "").lower():
                eligible = False
                explanation = "Patient has cancer history"
            elif crit["type"] == "inclusion" and "age" in crit["criterion"].lower():
                if patient_data.get("age"):
                    age = patient_data["age"]
                    if ">=" in crit["criterion"]:
                        min_age = int(crit["criterion"].split(">=")[-1].strip())
                        eligible = age >= min_age
                        explanation = f"Patient age ({age}) vs minimum ({min_age})"
                    elif "40-65" in crit["criterion"]:
                        eligible = 40 <= age <= 65
                        explanation = f"Patient age ({age}) vs range (40-65)"
            
            criteria_results.append({
                "criterion": crit["criterion"],
                "type": crit["type"],
                "eligible": eligible,
                "explanation": explanation,
                "confidence": "MEDIUM",
                "analyzed_by": "mock"
            })
        
        overall_eligible = all(c["eligible"] for c in criteria_results if c["type"] == "inclusion") and \
                          all(not c["eligible"] for c in criteria_results if c["type"] == "exclusion")
        
        trial_result = {
            "trial_id": trial["trial_id"],
            "title": trial["title"],
            "criteria": criteria_results,
            "overall_eligible": overall_eligible,
            "eligibility_summary": generate_eligibility_summary(criteria_results, overall_eligible)
        }
        results.append(trial_result)
    
    return results 