# Clinical Trial Matcher

A comprehensive clinical trial matching tool that uses AI to analyze patient records and match them with relevant clinical trials from clinicaltrials.gov. Built for the Weave Hacks competition using Google's latest AI tools and frameworks.

## 🎯 Overview

This tool takes patient medical records (PDF format) and:
1. **Parses patient data** using Google Document AI
2. **Fetches relevant clinical trials** from clinicaltrials.gov API
3. **Analyzes eligibility** using Vertex AI Gemini LLM
4. **Tracks experiments** with W&B Weave logging
5. **Orchestrates workflow** using Google ADK and A2A protocol

## 🏗️ Tech Stack

### **Phase 1 (Completed) - Core API Integrations**
- ✅ **Google Document AI** - PDF parsing and data extraction
- ✅ **clinicaltrials.gov API** - Real-time trial fetching
- ✅ **Vertex AI Gemini** - LLM-powered eligibility reasoning
- ✅ **W&B Weave** - Experiment tracking and logging
- ✅ **FastAPI** - Backend REST API
- ✅ **React** - Frontend web application

### **Phase 2 (In Progress) - Agent Orchestration**
- 🚧 **Google ADK (Agent Development Kit)** - Agent workflow definition
- 🚧 **A2A Protocol** - Agent-to-agent communication
- 🚧 **MCP (Model Context Protocol)** - Enhanced context passing

### **Phase 3 (Planned) - UI Enhancement**
- 📋 **Dashboard UI** - Patient summary and provider interface
- ✅ **Trial Cards** - Visual trial representation with eligibility ticks
- 🔄 **Loading States** - Better UX during processing

## 🚀 Features

### **Current Features (Phase 1)**
- **PDF Upload & Parsing**: Upload patient records and extract structured data
- **Real-time Trial Matching**: Fetch recruiting trials based on patient conditions
- **AI-Powered Eligibility Analysis**: LLM reasoning for each eligibility criterion
- **Comprehensive Logging**: W&B Weave experiment tracking with visualizations
- **Structured Results**: JSON response with eligibility per criterion

### **Example Output**
```json
{
  "parsed_data": {
    "name": "Smith, John",
    "age": 65,
    "allergies": ["Latex - Causes rashes"],
    "existing_conditions": ["Pyelonephritis"],
    "lab_results": {...}
  },
  "trials": [...],
  "eligibility_results": [
    {
      "trial_id": "NCT05002439",
      "overall_eligible": false,
      "criteria": [
        {
          "criterion": "Minimum age: 65 Years",
          "eligible": true,
          "explanation": "Patient meets minimum age requirement",
          "confidence": "HIGH"
        }
      ]
    }
  ]
}
```

## 🛠️ Setup & Installation

### **Prerequisites**
- Python 3.8+
- Node.js 14+
- Google Cloud credentials
- W&B account
- Vertex AI API access

### **Backend Setup**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn google-cloud-documentai google-cloud-aiplatform wandb requests
```

### **Frontend Setup**
```bash
cd frontend
npm install
```

### **Configuration**
Update `backend/config.py` with your credentials:
```python
GOOGLE_APPLICATION_CREDENTIALS = "/path/to/your/credentials.json"
VERTEX_API_KEY = "your-vertex-ai-api-key"
WANDB_API_KEY = "your-wandb-api-key"
WANDB_PROJECT = "clinical-trial-match"
DOCUMENT_AI_PROCESSOR_ID = "your-processor-id"
DOCUMENT_AI_PROJECT_ID = "your-project-id"
```

## 🏃‍♂️ Running the Application

### **Start Backend**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### **Start Frontend**
```bash
cd frontend
npm start
```

### **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/health

## 📊 W&B Weave Dashboard

The application logs comprehensive experiment data to W&B Weave:
- **Patient Demographics** - Structured patient data tables
- **Trial Summaries** - Fetched trials with metadata
- **Eligibility Results** - Detailed criterion-by-criterion analysis
- **Workflow Steps** - Complete audit trail of processing
- **Performance Metrics** - Success rates and processing times

## 🧪 Testing

Upload any PDF medical record to test the complete workflow:
1. Upload PDF via frontend
2. Monitor backend logs for W&B Weave steps
3. View structured results in frontend
4. Check W&B dashboard for experiment tracking

## 🏆 Competition Category

Built for **Google Tools Category** in Weave Hacks, showcasing:
- Google Document AI for medical record parsing
- Vertex AI Gemini for clinical reasoning
- Google ADK for agent orchestration
- A2A protocol for agent communication
- Integration with W&B Weave for experiment tracking

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This project was built for the Weave Hacks competition. Contributions welcome!

## 📧 Contact

Built by [Soham Patil](https://github.com/sohampatil17) for Weave Hacks 2024 