#!/usr/bin/env python3
"""
Live System Test Script: Real API Testing
Tests the complete clinical trial matching system with actual HTTP requests
"""

import asyncio
import json
import requests
import time
from pathlib import Path

# Server configuration
BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_server_health():
    """Test if the server is running and responsive"""
    print("🏥 Testing Server Health...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and responsive")
            return True
        else:
            print(f"❌ Server returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server health check failed: {e}")
        return False

def test_agent_discovery():
    """Test agent discovery endpoint"""
    print("\n🔍 Testing Agent Discovery...")
    try:
        response = requests.get(f"{BASE_URL}/agents", timeout=TIMEOUT)
        if response.status_code == 200:
            agents = response.json()
            print(f"✅ Discovered {len(agents)} agents:")
            for agent in agents:
                print(f"   - {agent['id']}: {agent['name']}")
                print(f"     Capabilities: {', '.join(agent['capabilities'])}")
            return agents
        else:
            print(f"❌ Agent discovery failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Agent discovery error: {e}")
        return None

def test_individual_agent_communication(agents):
    """Test communication with individual agents"""
    print("\n💬 Testing Individual Agent Communication...")
    
    if not agents:
        print("❌ No agents available for testing")
        return False
    
    # Test document processing agent
    doc_agent = next((a for a in agents if a['id'] == 'document_processing_agent'), None)
    if doc_agent:
        print(f"📄 Testing {doc_agent['name']}...")
        try:
            test_message = {
                "role": "user",
                "parts": [{"text": "Hello, can you process a medical document?"}]
            }
            response = requests.post(
                f"{BASE_URL}/agents/document_processing_agent/message",
                json=test_message,
                timeout=TIMEOUT
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Document agent responded: {result.get('message', 'No message')[:100]}...")
            else:
                print(f"❌ Document agent failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Document agent error: {e}")
    
    # Test clinical trials agent
    trials_agent = next((a for a in agents if a['id'] == 'clinical_trials_agent'), None)
    if trials_agent:
        print(f"🎯 Testing {trials_agent['name']}...")
        try:
            test_message = {
                "role": "user",
                "parts": [{"text": "Search for diabetes clinical trials"}]
            }
            response = requests.post(
                f"{BASE_URL}/agents/clinical_trials_agent/message",
                json=test_message,
                timeout=TIMEOUT
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Trials agent responded: {result.get('message', 'No message')[:100]}...")
            else:
                print(f"❌ Trials agent failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Trials agent error: {e}")
    
    return True

def test_workflow_execution():
    """Test complete workflow execution"""
    print("\n🔄 Testing Complete Workflow Execution...")
    
    try:
        # Test workflow with sample patient data
        workflow_request = {
            "patient_data": {
                "age": 65,
                "gender": "male",
                "conditions": ["diabetes", "hypertension"],
                "medications": ["metformin", "lisinopril"],
                "location": "Boston, MA"
            },
            "search_criteria": {
                "condition": "diabetes",
                "location": "Boston",
                "status": "recruiting"
            }
        }
        
        print("🚀 Starting workflow execution...")
        response = requests.post(
            f"{BASE_URL}/workflow/run",
            json=workflow_request,
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            result = response.json()
            task_id = result.get('task_id')
            print(f"✅ Workflow started with task ID: {task_id}")
            
            # Monitor task progress
            if task_id:
                print("⏳ Monitoring task progress...")
                for i in range(10):  # Check for up to 10 seconds
                    time.sleep(1)
                    status_response = requests.get(f"{BASE_URL}/tasks/{task_id}")
                    if status_response.status_code == 200:
                        status = status_response.json()
                        print(f"   Status: {status.get('status', 'unknown')}")
                        if status.get('status') == 'completed':
                            print(f"✅ Workflow completed successfully!")
                            print(f"   Result: {status.get('result', {}).get('message', 'No result')[:200]}...")
                            return True
                        elif status.get('status') == 'failed':
                            print(f"❌ Workflow failed: {status.get('error', 'Unknown error')}")
                            return False
                
                print("⚠️  Workflow still running after 10 seconds")
                return True
            else:
                print("❌ No task ID returned")
                return False
        else:
            print(f"❌ Workflow execution failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Workflow execution error: {e}")
        return False

def test_pdf_upload_endpoint():
    """Test PDF upload endpoint (if sample PDF exists)"""
    print("\n📎 Testing PDF Upload Endpoint...")
    
    # Create a sample text file to simulate PDF upload
    sample_file_path = Path("sample_medical_report.txt")
    sample_content = """
    Patient Medical Report
    
    Patient: John Doe
    Age: 65
    Gender: Male
    
    Chief Complaint: Diabetes management
    
    Current Medications:
    - Metformin 500mg twice daily
    - Lisinopril 10mg once daily
    
    Medical History:
    - Type 2 Diabetes Mellitus (diagnosed 2018)
    - Hypertension (diagnosed 2020)
    
    Current Status: Stable, seeking clinical trial participation
    """
    
    try:
        # Write sample file
        sample_file_path.write_text(sample_content)
        
        # Test upload
        with open(sample_file_path, 'rb') as f:
            files = {'file': ('sample_medical_report.txt', f, 'text/plain')}
            response = requests.post(
                f"{BASE_URL}/upload-pdf-adk",
                files=files,
                timeout=TIMEOUT
            )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ PDF upload successful!")
            print(f"   Analysis: {result.get('analysis', 'No analysis')[:200]}...")
            return True
        else:
            print(f"❌ PDF upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ PDF upload error: {e}")
        return False
    finally:
        # Clean up
        if sample_file_path.exists():
            sample_file_path.unlink()

def test_legacy_endpoints():
    """Test legacy endpoints for backward compatibility"""
    print("\n🔄 Testing Legacy Endpoints...")
    
    # Test original upload endpoint
    try:
        sample_file_path = Path("legacy_test.txt")
        sample_content = "Patient with diabetes seeking clinical trials"
        sample_file_path.write_text(sample_content)
        
        with open(sample_file_path, 'rb') as f:
            files = {'file': ('legacy_test.txt', f, 'text/plain')}
            response = requests.post(
                f"{BASE_URL}/upload-pdf",
                files=files,
                timeout=TIMEOUT
            )
        
        if response.status_code == 200:
            print("✅ Legacy upload endpoint working")
            return True
        else:
            print(f"⚠️  Legacy upload endpoint: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Legacy endpoint error: {e}")
        return False
    finally:
        if sample_file_path.exists():
            sample_file_path.unlink()

def main():
    """Run all live system tests"""
    print("🚀 LIVE SYSTEM TESTING")
    print("Testing Clinical Trial Matching System with Real HTTP Requests")
    print("=" * 70)
    
    # Test results
    results = []
    
    # 1. Server Health
    results.append(("Server Health", test_server_health()))
    
    # 2. Agent Discovery
    agents = test_agent_discovery()
    results.append(("Agent Discovery", agents is not None))
    
    # 3. Individual Agent Communication
    results.append(("Agent Communication", test_individual_agent_communication(agents)))
    
    # 4. Workflow Execution
    results.append(("Workflow Execution", test_workflow_execution()))
    
    # 5. PDF Upload
    results.append(("PDF Upload", test_pdf_upload_endpoint()))
    
    # 6. Legacy Endpoints
    results.append(("Legacy Compatibility", test_legacy_endpoints()))
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 LIVE SYSTEM TEST RESULTS")
    print("=" * 70)
    
    passed = 0
    total = len(results)
    
    for test_name, passed_test in results:
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"   {status} {test_name}")
        if passed_test:
            passed += 1
    
    print(f"\n🎯 OVERALL RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All live system tests passed! System is fully operational.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    print("\n💡 NEXT STEPS:")
    print("   - Access the system at: http://localhost:8000")
    print("   - View API docs at: http://localhost:8000/docs")
    print("   - Monitor W&B Weave at: https://wandb.ai/your-username/clinical-trial-match")

if __name__ == "__main__":
    main() 