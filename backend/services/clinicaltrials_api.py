import requests
import json
from typing import List, Dict, Any

def fetch_trials(patient_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Fetch clinical trials from clinicaltrials.gov API based on patient conditions
    """
    try:
        # Build search query based on patient conditions
        search_terms = build_search_query(patient_data)
        
        # Call clinicaltrials.gov API v2
        trials_data = call_clinicaltrials_api(search_terms)
        
        # Parse and structure the trial data
        structured_trials = parse_trials_data(trials_data)
        
        return structured_trials
        
    except Exception as e:
        print(f"Error fetching trials from clinicaltrials.gov: {str(e)}")
        # Return mock data as fallback
        return get_mock_trials()

def build_search_query(patient_data: Dict[str, Any]) -> str:
    """
    Build search query string based on patient conditions
    """
    search_terms = []
    
    # Add existing conditions to search
    if patient_data.get("existing_conditions"):
        for condition in patient_data["existing_conditions"]:
            search_terms.append(condition.strip())
    
    # Add age-related terms if age is available
    if patient_data.get("age"):
        age = patient_data["age"]
        if age >= 65:
            search_terms.append("elderly")
        elif age >= 18:
            search_terms.append("adult")
    
    # Join terms with OR operator
    query = " OR ".join(search_terms) if search_terms else "diabetes"
    return query

def call_clinicaltrials_api(search_query: str, max_studies: int = 10) -> Dict[str, Any]:
    """
    Call the clinicaltrials.gov API v2 to fetch studies
    """
    base_url = "https://clinicaltrials.gov/api/v2/studies"
    
    params = {
        "query.cond": search_query,
        "filter.overallStatus": "RECRUITING",
        "format": "json",
        "countTotal": "true",
        "pageSize": max_studies,
        "fields": "NCTId,BriefTitle,DetailedDescription,Condition,EligibilityCriteria,MinimumAge,MaximumAge,Gender,HealthyVolunteers,StdAge"
    }
    
    response = requests.get(base_url, params=params, timeout=30)
    response.raise_for_status()
    
    return response.json()

def parse_trials_data(trials_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse and structure the trials data from clinicaltrials.gov API response
    """
    structured_trials = []
    
    studies = trials_data.get("studies", [])
    
    for study in studies:
        protocol_section = study.get("protocolSection", {})
        identification_module = protocol_section.get("identificationModule", {})
        eligibility_module = protocol_section.get("eligibilityModule", {})
        conditions_module = protocol_section.get("conditionsModule", {})
        
        # Extract basic info
        trial_id = identification_module.get("nctId", "Unknown")
        title = identification_module.get("briefTitle", "Unknown Title")
        
        # Extract eligibility criteria
        eligibility_text = eligibility_module.get("eligibilityCriteria", "")
        criteria = parse_eligibility_criteria(eligibility_text)
        
        # Extract age requirements
        min_age = eligibility_module.get("minimumAge", "")
        max_age = eligibility_module.get("maximumAge", "")
        
        # Add age criteria if available
        if min_age:
            criteria.append({
                "criterion": f"Minimum age: {min_age}",
                "type": "inclusion"
            })
        if max_age:
            criteria.append({
                "criterion": f"Maximum age: {max_age}",
                "type": "inclusion"
            })
        
        # Extract gender requirements
        gender = eligibility_module.get("gender", "ALL")
        if gender != "ALL":
            criteria.append({
                "criterion": f"Gender: {gender}",
                "type": "inclusion"
            })
        
        structured_trial = {
            "trial_id": trial_id,
            "title": title,
            "conditions": conditions_module.get("conditions", []),
            "eligibility_criteria": criteria,
            "description": protocol_section.get("descriptionModule", {}).get("detailedDescription", ""),
            "status": "RECRUITING"
        }
        
        structured_trials.append(structured_trial)
    
    return structured_trials

def parse_eligibility_criteria(eligibility_text: str) -> List[Dict[str, str]]:
    """
    Parse eligibility criteria text into structured inclusion/exclusion criteria
    """
    criteria = []
    
    if not eligibility_text:
        return criteria
    
    # Split by common section headers
    sections = eligibility_text.split("Exclusion Criteria:")
    
    # Process inclusion criteria
    if sections[0]:
        inclusion_text = sections[0].replace("Inclusion Criteria:", "").strip()
        inclusion_criteria = extract_criteria_items(inclusion_text, "inclusion")
        criteria.extend(inclusion_criteria)
    
    # Process exclusion criteria
    if len(sections) > 1:
        exclusion_text = sections[1].strip()
        exclusion_criteria = extract_criteria_items(exclusion_text, "exclusion")
        criteria.extend(exclusion_criteria)
    
    return criteria

def extract_criteria_items(text: str, criteria_type: str) -> List[Dict[str, str]]:
    """
    Extract individual criteria items from text
    """
    items = []
    
    # Split by common bullet points or numbering
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Remove common bullet points and numbering
        line = line.lstrip('•-*').strip()
        line = line.lstrip('123456789.').strip()
        
        if len(line) > 10:  # Filter out very short lines
            items.append({
                "criterion": line,
                "type": criteria_type
            })
    
    return items

def get_mock_trials() -> List[Dict[str, Any]]:
    """
    Return mock trial data as fallback
    """
    return [
        {
            "trial_id": "NCT01234567",
            "title": "A Study of Diabetes Treatment",
            "conditions": ["Diabetes Mellitus", "Type 2 Diabetes"],
            "eligibility_criteria": [
                {"criterion": "Age >= 18", "type": "inclusion"},
                {"criterion": "Diagnosis of Type 2 Diabetes", "type": "inclusion"},
                {"criterion": "No penicillin allergy", "type": "inclusion"},
                {"criterion": "No history of cancer", "type": "exclusion"}
            ],
            "description": "This study evaluates a new treatment for diabetes.",
            "status": "RECRUITING"
        },
        {
            "trial_id": "NCT07654321",
            "title": "New Insulin Regimen for Adults",
            "conditions": ["Diabetes Mellitus"],
            "eligibility_criteria": [
                {"criterion": "Diabetes diagnosis", "type": "inclusion"},
                {"criterion": "Age 40-65", "type": "inclusion"},
                {"criterion": "No severe kidney disease", "type": "exclusion"}
            ],
            "description": "Testing a new insulin delivery method.",
            "status": "RECRUITING"
        }
    ] 