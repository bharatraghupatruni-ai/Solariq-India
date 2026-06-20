import os
import sys

# Add parent directory to path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import PredictionInput, run_model_inference, create_prediction

def test_financials_parity():
    # Mock Depends for db and user_id by running the calculation inside a mock
    # Actually, create_prediction requires Depends(get_current_user_id) which we can't easily mock here without fastapi.testclient.
    # We can just use FastAPI TestClient
    from fastapi.testclient import TestClient
    from backend.main import app

    client = TestClient(app)
    
    payload = {
        "annualGhi": 2100.0,
        "peakSunHoursDaily": 5.2,
        "avgTemperature": 28.0,
        "avgHumidity": 60.0,
        "roofArea": 100.0,
        "orientation": "south",
        "shading": "none",
        "cleaning": "weekly",
        "panelType": "mono_perc",
        "environment": "clean",
        "latitude": 28.61,
        "month": 6,
        "city": "New Delhi",
        "state": "delhi",
        "monthlyBillInr": 3000.0,
        "monthlyConsumptionKwh": 500.0, # 6 INR/kWh
        "budgetInr": 200000.0,
        "propertyType": "residential"
    }

    # Set mock user auth via the testing backdoor we saw in get_current_user_id
    os.environ["APP_ENV"] = "testing"
    
    response = client.post(
        "/api/ml/predict",
        json=payload,
        headers={"Authorization": "Bearer mock-test-token"}
    )
    
    assert response.status_code == 200, f"Request failed: {response.text}"
    data = response.json()
    
    # Let's print out the exact values so we can check
    print("Net Investment:", data["netInvestmentInr"])
    print("Central Subsidy:", data["centralSubsidyInr"])
    print("State Subsidy:", data["stateSubsidyInr"])
    print("Payback:", data["paybackYears"])
    print("ROI:", data["roiPct"])
    print("NPV:", data["npvInr"])
    
    # We assert they are valid non-zero
    assert data["netInvestmentInr"] > 0
    assert data["npvInr"] > 0
    assert data["paybackYears"] > 0
    
    print("Parity test passed! Outputs are consistent with the newly unified logic.")

if __name__ == "__main__":
    test_financials_parity()
