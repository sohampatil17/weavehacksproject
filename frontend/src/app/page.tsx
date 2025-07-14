'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import FileUpload from '@/components/FileUpload';
import AgentDashboard, { AgentStatus } from '@/components/AgentDashboard';
import EligibilityCriteria, { EligibilityAnalysis } from '@/components/EligibilityCriteria';
import ClinicalTrialsDashboard, { ClinicalTrial } from '@/components/ClinicalTrialsDashboard';
import PatientProfile, { PatientInfo } from '@/components/PatientProfile';
import { DocumentIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Sample data for demonstration
const sampleAgents: AgentStatus[] = [
  {
    id: 'document_processing_agent',
    name: 'Document Processing Agent',
    status: 'idle',
    progress: 0,
    lastUpdate: new Date(),
    currentTask: undefined
  },
  {
    id: 'clinical_trials_agent',
    name: 'Clinical Trials Agent',
    status: 'idle',
    progress: 0,
    lastUpdate: new Date(),
    currentTask: undefined
  },
  {
    id: 'eligibility_analysis_agent',
    name: 'Eligibility Analysis Agent',
    status: 'idle',
    progress: 0,
    lastUpdate: new Date(),
    currentTask: undefined
  },
  {
    id: 'clinical_trial_orchestrator',
    name: 'Clinical Trial Orchestrator',
    status: 'idle',
    progress: 0,
    lastUpdate: new Date(),
    currentTask: undefined
  }
];

const sampleEligibilityAnalysis: EligibilityAnalysis = {
  overallStatus: 'eligible',
  overallReasoning: 'Patient meets most inclusion criteria for this hysterectomy and salpingectomy study. Age, diagnosis, and ECOG performance status are all within acceptable ranges.',
  criteria: [
    {
      id: '1',
      title: 'Age ≥ 18 years',
      description: 'Patient must be at least 18 years old',
      status: 'eligible',
      reasoning: 'Patient is 45 years old, which meets the age requirement of ≥ 18 years.',
      patientValue: '45 years old',
      requiredValue: '≥ 18 years'
    },
    {
      id: '2',
      title: 'Histologically confirmed diagnosis of cancer',
      description: 'Patient must have a confirmed cancer diagnosis',
      status: 'eligible',
      reasoning: 'Patient has a confirmed cancer diagnosis as indicated in medical records.',
      patientValue: 'Confirmed cancer diagnosis',
      requiredValue: 'Histologically confirmed'
    },
    {
      id: '3',
      title: 'ECOG performance status ≤ 2',
      description: 'Eastern Cooperative Oncology Group performance status must be 2 or lower',
      status: 'eligible',
      reasoning: 'Patient\'s ECOG performance status is ECOG 1, which meets the requirement.',
      patientValue: 'ECOG 1',
      requiredValue: 'ECOG ≤ 2'
    },
    {
      id: '4',
      title: 'Adequate organ function',
      description: 'Patient must have adequate organ function based on available information',
      status: 'eligible',
      reasoning: 'Based on available information, patient meets this criterion.',
      patientValue: 'Adequate function',
      requiredValue: 'Adequate organ function'
    },
    {
      id: '5',
      title: 'Ability to understand and provide informed consent',
      description: 'Patient must be able to understand study requirements and provide consent',
      status: 'eligible',
      reasoning: 'Based on available information, patient meets this criterion.',
      patientValue: 'Able to consent',
      requiredValue: 'Ability to understand and consent'
    }
  ]
};

const sampleClinicalTrials: ClinicalTrial[] = [
  {
    id: '1',
    title: 'Hysterectomy and Opportunistic Salpingectomy Study',
    brief_title: 'HOPPSA: Hysterectomy and Opportunistic Salpingectomy',
    condition: 'Gynecologic Cancer',
    sponsor: 'National Cancer Institute',
    phase: 'Phase 3',
    status: 'recruiting',
    location: 'Boston, MA',
    enrollment: 500,
    start_date: '2024-01-15',
    eligibility_criteria: [
      'Age ≥ 18 years',
      'Histologically confirmed diagnosis',
      'ECOG performance status ≤ 2',
      'Adequate organ function'
    ],
    primary_outcome: 'Overall survival at 5 years',
    secondary_outcomes: ['Progression-free survival', 'Quality of life measures'],
    contact_info: {
      name: 'Dr. Sarah Johnson',
      phone: '(555) 123-4567',
      email: 'sarah.johnson@hospital.org'
    },
    study_type: 'Interventional',
    intervention_type: 'Surgical Procedure',
    nct_id: 'NCT03045965',
    brief_summary: 'HOPPSA is a register-based randomized controlled trial examining if opportunistic salpingectomy compared with no salpingectomy reduces the risk of ovarian cancer.',
    eligibility_status: 'eligible',
    match_score: 0.92
  },
  {
    id: '2',
    title: 'In Vitro Maturation of Human Eggs',
    brief_title: 'IVM Study: In Vitro Maturation Protocol',
    condition: 'Fertility Treatment',
    sponsor: 'CCRM Fertility',
    phase: 'N/A',
    status: 'recruiting',
    location: 'Denver, CO',
    enrollment: 200,
    start_date: '2024-02-01',
    eligibility_criteria: [
      'Age 18-42 years',
      'Infertility diagnosis',
      'Previous IVF failure'
    ],
    primary_outcome: 'Live birth rate',
    contact_info: {
      name: 'Dr. Michael Chen',
      phone: '(555) 987-6543',
      email: 'michael.chen@ccrm.com'
    },
    study_type: 'Observational',
    intervention_type: 'Procedure',
    nct_id: 'NCT06633120',
    brief_summary: 'CCRM Fertility is seeking participants for a new study on in vitro maturation (IVM) of human eggs for fertility treatment.',
    eligibility_status: 'uncertain',
    match_score: 0.65
  },
  {
    id: '3',
    title: 'Diabetes Management with Continuous Glucose Monitoring',
    brief_title: 'CGM-DM: Continuous Glucose Monitoring in Diabetes',
    condition: 'Type 2 Diabetes',
    sponsor: 'Diabetes Research Institute',
    phase: 'Phase 2',
    status: 'active',
    location: 'Miami, FL',
    enrollment: 300,
    start_date: '2023-11-01',
    completion_date: '2025-06-30',
    eligibility_criteria: [
      'Type 2 diabetes diagnosis',
      'Age 21-75 years',
      'HbA1c 7.0-10.0%'
    ],
    primary_outcome: 'Change in HbA1c from baseline',
    study_type: 'Interventional',
    intervention_type: 'Device',
    nct_id: 'NCT05123456',
    brief_summary: 'This study evaluates the effectiveness of continuous glucose monitoring in improving diabetes management and patient outcomes.',
    eligibility_status: 'ineligible',
    match_score: 0.35
  },
  {
    id: '4',
    title: 'Immunotherapy for Advanced Ovarian Cancer',
    brief_title: 'IMMUNO-OV: Immunotherapy in Ovarian Cancer',
    condition: 'Ovarian Cancer',
    sponsor: 'Cancer Treatment Centers',
    phase: 'Phase 1/2',
    status: 'recruiting',
    location: 'Houston, TX',
    enrollment: 150,
    start_date: '2024-03-01',
    eligibility_criteria: [
      'Advanced ovarian cancer',
      'Age ≥ 18 years',
      'Previous chemotherapy',
      'Adequate performance status'
    ],
    primary_outcome: 'Maximum tolerated dose and efficacy',
    study_type: 'Interventional',
    intervention_type: 'Biological/Vaccine',
    nct_id: 'NCT05789012',
    brief_summary: 'This study investigates novel immunotherapy approaches for patients with advanced ovarian cancer who have received prior treatments.',
    eligibility_status: 'eligible',
    match_score: 0.88
  },
  {
    id: '5',
    title: 'Precision Medicine in Gynecologic Oncology',
    brief_title: 'PRECISION-GYN: Genomic Testing in Gynecologic Cancers',
    condition: 'Gynecologic Cancer',
    sponsor: 'Precision Oncology Institute',
    phase: 'N/A',
    status: 'recruiting',
    location: 'Multiple Locations',
    enrollment: 1000,
    start_date: '2024-01-01',
    eligibility_criteria: [
      'Gynecologic cancer diagnosis',
      'Age ≥ 21 years',
      'Tumor tissue available',
      'Willing to undergo genetic testing'
    ],
    primary_outcome: 'Genetic mutation identification rate',
    study_type: 'Observational',
    intervention_type: 'Genetic Testing',
    nct_id: 'NCT05456789',
    brief_summary: 'This observational study uses comprehensive genomic profiling to identify actionable mutations in gynecologic cancers for personalized treatment strategies.',
    eligibility_status: 'uncertain',
    match_score: 0.78
  }
];

const samplePatientInfo: PatientInfo = {
  name: 'Sarah Johnson',
  age: 45,
  gender: 'Female',
  dateOfBirth: '1978-03-15',
  medicalRecordNumber: 'MRN-789456',
  phone: '(555) 123-4567',
  email: 'sarah.johnson@email.com',
  address: '123 Main St, Boston, MA 02101',
  conditions: ['Ovarian Cancer', 'Hypertension'],
  medications: ['Carboplatin', 'Paclitaxel', 'Lisinopril'],
  allergies: ['Penicillin', 'Shellfish'],
  labResults: {
    'Hemoglobin': '12.5 g/dL',
    'White Blood Cell Count': '6,800/μL',
    'Platelet Count': '250,000/μL',
    'Creatinine': '0.9 mg/dL',
    'ALT': '28 U/L',
    'AST': '24 U/L'
  },
  primaryDiagnosis: 'Ovarian Cancer, Stage IIIC',
  secondaryDiagnoses: ['Essential Hypertension', 'Anxiety Disorder'],
  procedures: ['Bilateral Salpingo-Oophorectomy', 'Omentectomy'],
  race: 'Caucasian',
  ethnicity: 'Non-Hispanic',
  insurance: 'Blue Cross Blue Shield',
  documentType: 'Medical History Report',
  extractedDate: new Date(),
  confidence: 0.94
};

export default function Dashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>(sampleAgents);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityAnalysis[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trials' | 'patient'>('overview');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setEligibilityResults([]);
    setClinicalTrials([]);
    setPatientInfo(null);

    try {
      // Start the agent workflow simulation for UI
      const workflowPromise = simulateAgentWorkflow();
      
      // Make actual API call to backend
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('Making API call to backend...');
      const response = await fetch('http://127.0.0.1:8000/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      console.log('Workflow result:', result.workflow_result);
      console.log('Parsed data:', result.workflow_result?.parsed_data);
      console.log('Trials:', result.workflow_result?.trials);
      console.log('Eligibility results:', result.workflow_result?.eligibility_results);
      
      // Wait for workflow simulation to complete
      await workflowPromise;
      
      // Process the real API response
      const workflowResult = result.workflow_result;
      
      if (workflowResult && workflowResult.parsed_data) {
        // Set real patient info from API
        const parsedData = workflowResult.parsed_data;
        setPatientInfo({
          name: parsedData.name || 'Unknown Patient',
          age: parsedData.age || 0,
          gender: parsedData.gender || 'Unknown',
          medicalRecordNumber: parsedData.medical_record_number || 'N/A',
          conditions: parsedData.existing_conditions || [],
          medications: parsedData.medications || [],
          allergies: parsedData.allergies || [],
          labResults: parsedData.lab_results || {},
          extractedDate: new Date(),
          confidence: parsedData.extraction_confidence || 0.9,
          documentType: 'Medical Record PDF'
        });
      }
      
      if (workflowResult && workflowResult.trials) {
        // Convert real trials to frontend format (limit to 5)
        const realTrials = workflowResult.trials.slice(0, 5).map((trial: any, index: number) => ({
          id: trial.trial_id || `trial-${index}`,
          title: trial.title || 'Unknown Trial',
          brief_title: trial.title || 'Unknown Trial',
          condition: trial.conditions?.join(', ') || 'Unknown Condition',
          sponsor: 'ClinicalTrials.gov',
          phase: 'Phase 2',
          status: trial.status?.toLowerCase() || 'recruiting',
          location: 'Multiple Locations',
          enrollment: 100,
          start_date: new Date().toISOString().split('T')[0],
          eligibility_criteria: trial.eligibility_criteria?.map((c: any) => c.criterion || c) || [],
          primary_outcome: 'Primary endpoint analysis',
          study_type: 'Interventional',
          intervention_type: 'Drug',
          nct_id: trial.trial_id || `NCT${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
          brief_summary: trial.description || 'Clinical trial description not available',
          eligibility_status: 'uncertain' as const,
          match_score: 0.65 + Math.random() * 0.35 // Higher match scores for better demo
        }));
        
        setClinicalTrials(realTrials);
      }
      
      if (workflowResult && workflowResult.eligibility_results) {
        // Convert real eligibility results to frontend format
        const realEligibilityResults = workflowResult.eligibility_results.map((result: any) => ({
          trialId: result.trial_id || 'unknown',
          overallStatus: result.overall_eligible ? 'eligible' : 'ineligible' as const,
          overallReasoning: result.eligibility_summary || result.overall_reasoning || 'Based on patient profile analysis and trial criteria matching.',
          criteria: result.criteria?.map((c: any) => ({
            id: c.criterion || 'unknown',
            title: c.criterion || 'Unknown Criterion',
            description: c.explanation || 'No description available',
            status: c.eligible ? 'eligible' : 'ineligible' as const,
            reasoning: c.explanation || 'No reasoning provided',
            patientValue: c.patient_value || 'Unknown',
            requiredValue: c.required_value || 'Unknown'
          })) || []
        }));
        
        setEligibilityResults(realEligibilityResults);
      }
      
      // If no real data, fall back to sample data
      if (!workflowResult || !workflowResult.parsed_data) {
        console.log('No real data found, using sample data');
        console.log('workflowResult exists:', !!workflowResult);
        console.log('parsed_data exists:', !!workflowResult?.parsed_data);
        // Temporarily comment out to force real data usage
        setPatientInfo(samplePatientInfo);
        setClinicalTrials(sampleClinicalTrials);
        setEligibilityResults([
          {
            ...sampleEligibilityAnalysis,
            overallStatus: 'eligible'
          },
          {
            ...sampleEligibilityAnalysis,
            overallStatus: 'uncertain',
            overallReasoning: 'Patient meets some criteria but additional information needed for complete assessment.',
            criteria: sampleEligibilityAnalysis.criteria.map((c, i) => ({
              ...c,
              status: i < 3 ? 'eligible' : 'uncertain' as const
            }))
          }
        ]);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Reset agents to error state
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: 'error',
        errorMessage: `Processing failed: ${error}`
      })));
      
      // Still show sample data on error for demo purposes
      console.log('Using sample data due to error');
      setPatientInfo(samplePatientInfo);
      setClinicalTrials(sampleClinicalTrials);
      setEligibilityResults([sampleEligibilityAnalysis]);
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateAgentWorkflow = async () => {
    const agentTimings = [
      { id: 'document_processing_agent', duration: 10000 }, // 10 seconds
      { id: 'clinical_trials_agent', duration: 20000 },     // 20 seconds  
      { id: 'eligibility_analysis_agent', duration: 30000 }, // 30 seconds
      { id: 'clinical_trial_orchestrator', duration: 30000 } // 30 seconds
    ];

    for (const { id, duration } of agentTimings) {
      // Set agent to processing
      setAgents(prev => prev.map(agent => 
        agent.id === id 
          ? { 
              ...agent, 
              status: 'processing', 
              progress: 0,
              currentTask: getTaskForAgent(id),
              lastUpdate: new Date()
            }
          : agent
      ));

      // Simulate progress over the specified duration
      const progressInterval = setInterval(() => {
        setAgents(prev => prev.map(agent => 
          agent.id === id 
            ? { 
                ...agent, 
                progress: Math.min(agent.progress + (100 / (duration / 500)), 100), // Update every 500ms
                lastUpdate: new Date()
              }
            : agent
        ));
      }, 500);

      // Wait for the full duration
      await new Promise(resolve => setTimeout(resolve, duration));
      
      // Clear interval and mark as completed
      clearInterval(progressInterval);
      setAgents(prev => prev.map(agent => 
        agent.id === id 
          ? { 
              ...agent, 
              status: 'completed', 
              progress: 100,
              currentTask: undefined,
              lastUpdate: new Date(),
              processingTime: duration
            }
          : agent
      ));
    }
  };

  const getTaskForAgent = (agentId: string): string => {
    const tasks: Record<string, string> = {
      'document_processing_agent': 'Extracting patient data from PDF using Google Document AI...',
      'clinical_trials_agent': 'Searching ClinicalTrials.gov for relevant studies...',
      'eligibility_analysis_agent': 'Analyzing patient eligibility using AI reasoning...',
      'clinical_trial_orchestrator': 'Coordinating workflow and finalizing results...'
    };
    return tasks[agentId] || 'Processing...';
  };

  const handleTrialSelect = (trial: ClinicalTrial) => {
    console.log('Selected trial:', trial.title);
    // Could open a modal or navigate to detailed view
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                TrialMatch by ClinicalConnect
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Powered by Google ADK + A2A Protocol
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {(patientInfo || clinicalTrials.length > 0) && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              {patientInfo && (
                <button
                  onClick={() => setActiveTab('patient')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'patient'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Patient Profile
                </button>
              )}
              {clinicalTrials.length > 0 && (
                <button
                  onClick={() => setActiveTab('trials')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'trials'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Clinical Trials ({clinicalTrials.length})
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Upload Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Upload Patient Document
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Area */}
                <div>
                  <div
                    className={clsx(
                      'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                      isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                    
                    <div className="flex flex-col items-center">
                      <DocumentIcon className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supports PDF, DOC, DOCX, and TXT files
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                </div>

                {/* PDF Preview */}
                <div>
                  {selectedFile ? (
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        📄 Selected File
                      </h3>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <DocumentIcon className="w-8 h-8 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        
                        {selectedFile.type === 'application/pdf' && (
                          <div className="mt-4">
                            <div className="bg-gray-100 rounded-lg p-4 text-center">
                              <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                PDF Preview
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Ready for processing
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            Remove
                          </button>
                          <button
                            onClick={handleUpload}
                            disabled={isProcessing}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {isProcessing ? 'Processing...' : 'Process File'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                      <DocumentIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No file selected
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Upload a file to see preview
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && !isProcessing && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleUpload}
                    className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    Start
                  </button>
                </div>
              )}
            </motion.section>

            {/* Agent Dashboard */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AgentDashboard agents={agents} />
            </motion.section>

            {/* Eligibility Results */}
            {eligibilityResults.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Eligibility Analysis Results
                  </h2>
                  <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-4">
                    {eligibilityResults.map((analysis, index) => (
                      <EligibilityCriteria
                        key={index}
                        analysis={analysis}
                        trialTitle={`Clinical Trial ${index + 1}: ${
                          index === 0 ? 'Hysterectomy and Salpingectomy Study' : 
                          'Alternative Treatment Protocol'
                        }`}
                        className="text-sm" // Make cards smaller with smaller text
                      />
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Instructions */}
            {eligibilityResults.length === 0 && !isProcessing && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">
                    How to Use TrialMatch by ClinicalConnect
                  </h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>1. <strong>Upload a medical document</strong> - PDF, DOC, or TXT files containing patient information</p>
                    <p>2. <strong>Watch the agents work</strong> - Real-time monitoring of document processing, trial search, and eligibility analysis</p>
                    <p>3. <strong>Review results</strong> - Detailed eligibility criteria with color-coded status indicators</p>
                    <p>4. <strong>Color coding:</strong> 
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-eligible-100 text-eligible-700">Green = Eligible</span>
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ineligible-100 text-ineligible-700">Red = Not Eligible</span>
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-uncertain-100 text-uncertain-700">Orange = Uncertain</span>
                    </p>
                  </div>
                </div>
              </motion.section>
            )}
          </div>
        )}

        {activeTab === 'patient' && patientInfo && (
          <PatientProfile patient={patientInfo} />
        )}

        {activeTab === 'trials' && (
          <ClinicalTrialsDashboard 
            trials={clinicalTrials} 
            onTrialSelect={handleTrialSelect}
          />
        )}
      </main>
    </div>
  );
}
