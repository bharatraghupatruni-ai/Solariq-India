import os
import unittest
import uuid

# Set environment variables for testing before importing app
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///./test_solarai.db"  # Use file-based DB to avoid connection state sharing issues
os.environ["JWT_SECRET"] = "placeholder-secret"

from fastapi.testclient import TestClient
from ml.backend.main import app
from ml.backend.database import Base, engine

class TestBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create database tables
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        
    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        # Clean up database file
        if os.path.exists("test_solarai.db"):
            try:
                os.remove("test_solarai.db")
            except OSError:
                pass

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy", "version": "2.0.0"})

    def test_pincode_lookup_success(self):
        response = self.client.get("/api/ml/pincode-lookup?pincode=110001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["city"], "New Delhi")
        self.assertEqual(data["state"], "Delhi")

    def test_pincode_lookup_not_found(self):
        response = self.client.get("/api/ml/pincode-lookup?pincode=999999")
        self.assertEqual(response.status_code, 404)

    def test_unauthorized_endpoints(self):
        # Accessing protected endpoint without authorization header
        response = self.client.post("/api/ml/predict", json={})
        self.assertEqual(response.status_code, 401)
        self.assertIn("header missing", response.json()["detail"])

    def test_predict_and_history_flow(self):
        # Use our mock JWT bypass in get_current_user_id
        headers = {"Authorization": "Bearer mock-test-token"}
        
        payload = {
            "annualGhi": 1800.0,
            "peakSunHoursDaily": 5.0,
            "avgTemperature": 28.0,
            "avgHumidity": 60.0,
            "roofArea": 100.0,
            "orientation": "south",
            "shading": "none",
            "cleaning": "weekly",
            "panelType": "mono_perc",
            "environment": "clean",
            "latitude": 28.6,
            "month": 6,
            "city": "New Delhi",
            "state": "Delhi",
            "monthlyBillInr": 5000.0,
            "monthlyConsumptionKwh": 400.0,
            "budgetInr": 200000.0,
            "propertyType": "residential"
        }
        
        # Test Prediction Creation
        response = self.client.post("/api/ml/predict", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        pred_data = response.json()
        self.assertIn("id", pred_data)
        self.assertGreater(pred_data["dailyGenerationKwh"], 0)
        self.assertGreater(pred_data["netInvestmentInr"], 0)
        
        pred_id = pred_data["id"]
        
        # Test Prediction Retrieval
        response = self.client.get(f"/api/prediction/{pred_id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], pred_id)
        
        # Test PDF Report Generation Endpoint
        response = self.client.get(f"/api/reports/pdf/{pred_id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertTrue(len(response.content) > 0)
        
        # Test History Retrieval
        response = self.client.get("/api/history", headers=headers)
        self.assertEqual(response.status_code, 200)
        history = response.json()
        self.assertGreaterEqual(history["total"], 1)
        
        # Test Deletion
        response = self.client.delete(f"/api/prediction/{pred_id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Verify it's gone
        response = self.client.get(f"/api/prediction/{pred_id}", headers=headers)
        self.assertEqual(response.status_code, 404)

if __name__ == "__main__":
    unittest.main()
