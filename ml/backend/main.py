import os
import sys
import uuid
import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, Depends, HTTPException, Header, Query, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from jose import jwt, JWTError

# Add parent dir to path to import train_model parameters if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .database import engine, Base, get_db
from .models import Prediction, User, WeatherCache, Tariff, Subsidy
from .pdf_generator import generate_pdf_report

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SolarAI India Backend", version="2.0.0")

# Setup CORS
FRONTEND_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
origins = [FRONTEND_URL]
frontend_url_env = os.getenv("FRONTEND_URL")
if frontend_url_env:
    origins.append(frontend_url_env)

cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    origins.extend([origin.strip() for origin in cors_origins_env.split(",") if origin.strip()])

# Include common local addresses in development mode
if os.getenv("APP_ENV", "development") == "development":
    origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ])

# Remove duplicates
origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Secret for Supabase JWT decoding
JWT_SECRET = os.getenv("JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Validates Supabase JWT and returns the user UUID."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token format invalid. Expected 'Bearer <token>'"
            )
        token = parts[1]
        
        # Bypass or mock token handling for dev/testing
        if os.getenv("APP_ENV") == "testing" or not JWT_SECRET or JWT_SECRET == "placeholder-secret":
            if token == "mock-test-token":
                return "00000000-0000-0000-0000-000000000000"
            if token.startswith("mock-user-"):
                return token.split("mock-user-")[1]
            try:
                import uuid
                uuid.UUID(token)
                return token
            except ValueError:
                pass

        if not JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT_SECRET is not configured on the server"
            )

        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: sub claim missing"
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authorization error: {str(e)}"
        )

# Pydantic models for inputs/outputs
class PredictionInput(BaseModel):
    annualGhi: float
    peakSunHoursDaily: float
    avgTemperature: float
    avgHumidity: float
    roofArea: float
    orientation: str
    shading: str
    cleaning: str
    panelType: str
    environment: str
    latitude: float
    month: int
    city: str
    state: str
    monthlyBillInr: float
    monthlyConsumptionKwh: float
    budgetInr: float
    propertyType: str

class WhatIfScenario(BaseModel):
    scenario: str
    generation: float
    payback: float
    co2_offset: float

class PredictionOutput(BaseModel):
    id: str
    dailyGenerationKwh: float
    monthlyGenerationKwh: float
    annualGenerationKwh: float
    netInvestmentInr: float
    grossCostInr: float
    centralSubsidyInr: float
    stateSubsidyInr: float
    paybackYears: float
    roiPct: float
    npvInr: float
    co2OffsetKg: float
    treesEquivalent: int
    solarScore: int
    healthIndex: int
    confidencePercent: int
    confidenceLow: float
    confidenceHigh: float
    recommendations: List[str]
    insights: List[str]
    whatifResults: List[WhatIfScenario]

# Simple prediction pipeline fallback/runner
# We can load model or run mathematical calculation directly in Python matching train_model logic.
def run_model_inference(inp: PredictionInput):
    # Load model if exists
    import joblib
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "solar_model.pkl")
    
    # Feature mappings
    orientation_map = {"south": 1.0, "east": 0.7, "west": 0.5, "north": 0.2}
    shading_map = {"none": 0.0, "partial": 0.5, "heavy": 1.0}
    cleaning_map = {"weekly": 1.0, "monthly": 0.6, "rarely": 0.2}
    panel_eff_map = {
        "hjt": 0.225, "topcon": 0.220, "bifacial": 0.215,
        "mono_perc": 0.205, "mono": 0.205, "poly": 0.18, "thin_film": 0.14
    }
    env_map = {"clean": 1.0, "dusty": 0.7, "urban_smog": 0.5}
    
    # Calculate physical baseline
    panel_wattage = 400
    usable_area = inp.roofArea * 0.75
    panel_count = int(usable_area / 1.96)
    capacity_kwp = panel_count * panel_wattage / 1000
    
    season_factor = 1.0 + 0.15 * (3.14159 * (inp.month - 5) / 6.0)
    # GHI calculation base
    monthly_ghi = (inp.annualGhi / 12.0) * season_factor
    
    features = [
        monthly_ghi,
        inp.peakSunHoursDaily * season_factor,
        inp.avgTemperature,
        inp.avgHumidity,
        inp.roofArea,
        orientation_map.get(inp.orientation, 0.5),
        shading_map.get(inp.shading, 0.0),
        cleaning_map.get(inp.cleaning, 0.6),
        panel_eff_map.get(inp.panelType, 0.2),
        env_map.get(inp.environment, 0.7),
        inp.latitude,
        inp.month
    ]
    
    model_loaded = False
    prediction = 0.0
    r2 = 0.87
    
    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            if isinstance(model, dict) and model.get("type") == "linear":
                # Linear model fallback
                coeffs = model["coefficients"]
                prediction = sum(f * c for f, c in zip(features, coeffs[:-1])) + coeffs[-1]
            else:
                import numpy as np
                X = np.array([features])
                prediction = float(model.predict(X)[0])
            model_loaded = True
        except Exception as e:
            print(f"Error loading model: {e}")
            
    if not model_loaded:
        # Physical model calculation
        prediction = capacity_kwp * inp.peakSunHoursDaily * season_factor * 0.80
        prediction *= (1.0 - shading_map.get(inp.shading, 0.0))
        prediction *= (1.0 - (1.0 - cleaning_map.get(inp.cleaning, 0.6)) * 0.05)
        prediction *= (1.0 - (1.0 - env_map.get(inp.environment, 0.7)) * 0.03)
        prediction *= orientation_map.get(inp.orientation, 0.5)
        prediction *= (panel_eff_map.get(inp.panelType, 0.20) / 0.20)
        
    daily_gen = max(0.1, prediction)
    
    # Calculate confidence interval (R² based)
    uncertainty = (1 - r2) * 1.5
    low_val = daily_gen * (1 - uncertainty)
    high_val = daily_gen * (1 + uncertainty)
    
    return {
        "daily": daily_gen,
        "low": max(0.1, low_val),
        "high": high_val,
        "r2": r2,
        "capacity": capacity_kwp,
        "panel_count": panel_count
    }

# API Endpoints
@app.post("/api/ml/predict", response_model=PredictionOutput)
def create_prediction(
    inp: PredictionInput,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    inf = run_model_inference(inp)
    
    # Calculate financial stats
    panel_costs = {
        "mono_perc": 38000.0,
        "topcon": 45000.0,
        "hjt": 55000.0,
        "bifacial": 42000.0,
        "poly": 35000.0,
        "thin_film": 30000.0
    }
    cost_per_kwp = panel_costs.get(inp.panelType, 45000.0)
    gross_cost = inf["capacity"] * cost_per_kwp
    
    # PM Surya Ghar subsidy rules (identical to TS calculateCentralSubsidy)
    central_subsidy = 0.0
    if inp.propertyType == "residential":
        if inf["capacity"] <= 2.0:
            central_subsidy = inf["capacity"] * 30000.0
        elif inf["capacity"] <= 3.0:
            central_subsidy = 2 * 30000.0 + (inf["capacity"] - 2.0) * 18000.0
        else:
            central_subsidy = 2 * 30000.0 + 1 * 18000.0
        
    state_subsidy = 0.0
    if inp.propertyType == "residential":
        if inp.state.lower() == "gujarat":
            state_subsidy = 10000.0 * inf["capacity"]
        elif inp.state.lower() == "delhi":
            state_subsidy = 2000.0 * inf["capacity"]
        
    net_investment = max(0.0, gross_cost - central_subsidy - state_subsidy)
    
    monthly_gen = inf["daily"] * 30
    annual_gen = inf["daily"] * 365
    
    # Calculate electricity rate from inputs
    electricity_rate = (inp.monthlyBillInr / inp.monthlyConsumptionKwh) if inp.monthlyConsumptionKwh > 0 else 7.5
    
    # Base annual savings
    annual_savings_inr = annual_gen * electricity_rate
    
    # Grid export revenue (Net metering)
    export_ratio = 0.2 if inp.propertyType == "residential" else 0.3
    units_exported = annual_gen * export_ratio
    
    # State tariffs fallback mapping based on INDIAN_STATES in TS
    state_tariffs = {
        "andhra_pradesh": 6.50, "gujarat": 5.80, "maharashtra": 8.50, "rajasthan": 6.20,
        "karnataka": 7.10, "tamil_nadu": 5.00, "telangana": 6.80, "madhya_pradesh": 6.40,
        "uttar_pradesh": 6.00, "haryana": 7.00, "punjab": 7.50, "delhi": 5.50,
        "kerala": 5.20, "west_bengal": 7.20, "odisha": 5.80
    }
    avg_tariff_inr = state_tariffs.get(inp.state.lower().replace(" ", "_"), electricity_rate)
    export_rate = avg_tariff_inr * 0.85
    grid_export_revenue = units_exported * export_rate
    
    total_annual_benefit = annual_savings_inr + grid_export_revenue
        
    payback = net_investment / total_annual_benefit if total_annual_benefit > 0 else 0
    
    def calculate_npv(investment, annual_benefit, inflation_rate=0.06, degradation_rate=0.005, discount_rate=0.08, years=25):
        npv_val = -investment
        for year in range(1, years + 1):
            cashflow = annual_benefit * ((1 + inflation_rate)**(year - 1)) * ((1 - degradation_rate)**(year - 1))
            npv_val += cashflow / ((1 + discount_rate)**year)
        return npv_val

    npv = calculate_npv(net_investment, total_annual_benefit)
    roi = (npv / net_investment * 100.0) if net_investment > 0 else 0.0
    
    co2 = annual_gen * 0.82
    trees = int(co2 / 21.77) # TS uses 21.77
    
    # Solar Readiness Score weighting
    # Solar Resource 30%, Orientation 20%, Shading 20%, Roof Area 10%, Cleaning 5%, Environment 5%, Panel 10%
    resource_score = 30 if inp.annualGhi > 2000 else 22
    orientation_scores = {"south": 20, "east": 14, "west": 10, "north": 4}
    shading_scores = {"none": 20, "partial": 12, "heavy": 5}
    area_score = 10 if inp.roofArea > 100 else 7
    cleaning_scores = {"weekly": 5, "monthly": 3, "rarely": 1}
    env_scores = {"clean": 5, "dusty": 3, "urban_smog": 2}
    panel_scores = {"mono": 10, "topcon": 10, "hjt": 10, "bifacial": 10, "poly": 7, "thin_film": 4}
    
    solar_score = (
        resource_score +
        orientation_scores.get(inp.orientation, 10) +
        shading_scores.get(inp.shading, 10) +
        area_score +
        cleaning_scores.get(inp.cleaning, 3) +
        env_scores.get(inp.environment, 3) +
        panel_scores.get(inp.panelType, 7)
    )
    solar_score = min(100, max(0, solar_score))
    
    # Solar Health Index (0-100)
    # Factors: Dust, Heat, Humidity, Shading, Maintenance
    health_index = 100 - (15 if inp.shading == "heavy" else 5) - (20 if inp.cleaning == "rarely" else 5)
    
    # AI recommendations list
    recs = []
    if inp.shading == "heavy":
        recs.append("Reduce Shading: trim surrounding trees or move installations to high ground.")
    if inp.panelType in ["poly", "thin_film"]:
        recs.append("Switch To Mono Panels: Mono panels yield 15-20% higher generation efficiency.")
    if inp.cleaning == "rarely":
        recs.append("Increase Cleaning Frequency: Weekly cleaning yields 12% output enhancement.")
    if len(recs) == 0:
        recs.append("Install Immediately: excellent solar readiness score and high IRR profile.")
        
    insights = [
        f"Heavy shading reduces generation by 18% in peak hours.",
        f"Weekly cleaning improves output by 12% relative to rarely.",
        f"Mono panels increase annual savings by ₹6,500 compared to poly."
    ]
    
    # What-if results
    whatif = [
        WhatIfScenario(scenario="Current Status", generation=inf["daily"], payback=payback, co2_offset=co2),
        WhatIfScenario(scenario="Mono Panels Upgrade", generation=inf["daily"] * 1.15, payback=max(1.0, payback * 0.9), co2_offset=co2 * 1.15),
        WhatIfScenario(scenario="Weekly Cleaning Routine", generation=inf["daily"] * 1.12, payback=max(1.0, payback * 0.92), co2_offset=co2 * 1.12),
    ]
    
    # Save prediction in DB
    db_pred = Prediction(
        user_id=user_id,
        city=inp.city,
        state=inp.state,
        roof_area_sqm=inp.roofArea,
        monthly_bill_inr=inp.monthlyBillInr,
        monthly_consumption_kwh=inp.monthlyConsumptionKwh,
        budget_inr=inp.budgetInr,
        property_type=inp.propertyType,
        panel_type=inp.panelType,
        orientation=inp.orientation,
        shading=inp.shading,
        cleaning=inp.cleaning,
        environment=inp.environment,
        daily_generation_kwh=inf["daily"],
        monthly_generation_kwh=monthly_gen,
        annual_generation_kwh=annual_gen,
        net_investment_inr=net_investment,
        gross_cost_inr=gross_cost,
        central_subsidy_inr=central_subsidy,
        state_subsidy_inr=state_subsidy,
        payback_years=payback,
        roi_pct=roi,
        npv_inr=npv,
        co2_offset_kg=co2,
        trees_equivalent=trees,
        solar_score=solar_score,
        health_index=health_index,
        recommendations=recs,
        insights=insights,
        whatif_results=[w.model_dump() for w in whatif],
        confidence_percent=int(inf["r2"] * 100),
        confidence_low=inf["low"],
        confidence_high=inf["high"]
    )
    
    if os.getenv("APP_ENV") == "development" or os.getenv("APP_ENV") == "testing":
        db.add(db_pred)
        db.commit()
        db.refresh(db_pred)
        pred_id = db_pred.id
    else:
        pred_id = str(uuid.uuid4())
        db_pred.id = pred_id
    
    return PredictionOutput(
        id=pred_id,
        dailyGenerationKwh=db_pred.daily_generation_kwh,
        monthlyGenerationKwh=db_pred.monthly_generation_kwh,
        annualGenerationKwh=db_pred.annual_generation_kwh,
        netInvestmentInr=db_pred.net_investment_inr,
        grossCostInr=db_pred.gross_cost_inr,
        centralSubsidyInr=db_pred.central_subsidy_inr,
        stateSubsidyInr=db_pred.state_subsidy_inr,
        paybackYears=db_pred.payback_years,
        roiPct=db_pred.roi_pct,
        npvInr=db_pred.npv_inr,
        co2OffsetKg=db_pred.co2_offset_kg,
        treesEquivalent=db_pred.trees_equivalent,
        solarScore=db_pred.solar_score,
        healthIndex=db_pred.health_index,
        confidencePercent=db_pred.confidence_percent,
        confidenceLow=db_pred.confidence_low,
        confidenceHigh=db_pred.confidence_high,
        recommendations=db_pred.recommendations,
        insights=db_pred.insights,
        whatifResults=whatif
    )

@app.get("/api/history")
def get_prediction_history(
    limit: int = 10,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Prediction).filter(Prediction.user_id == user_id)
    total = query.count()
    results = query.order_by(Prediction.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data": results
    }

@app.get("/api/prediction/{pred_id}")
def get_single_prediction(
    pred_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    pred = db.query(Prediction).filter(Prediction.id == pred_id, Prediction.user_id == user_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    return pred

@app.delete("/api/prediction/{pred_id}")
def delete_prediction(
    pred_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    pred = db.query(Prediction).filter(Prediction.id == pred_id, Prediction.user_id == user_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    db.delete(pred)
    db.commit()
    return {"message": "Prediction deleted successfully"}

@app.get("/api/reports/pdf/{pred_id}")
def get_pdf_report(
    pred_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    pred = db.query(Prediction).filter(Prediction.id == pred_id, Prediction.user_id == user_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Feasibility prediction not found")
        
    # Translate DB fields to template dict
    data = {
        "city": pred.city,
        "state": pred.state,
        "roof_area_sqm": float(pred.roof_area_sqm),
        "monthly_bill_inr": float(pred.monthly_bill_inr),
        "budget_inr": float(pred.budget_inr),
        "property_type": pred.property_type,
        "panel_type": pred.panel_type,
        "orientation": pred.orientation,
        "shading": pred.shading,
        "cleaning": pred.cleaning,
        "environment": pred.environment,
        "daily_generation_kwh": float(pred.daily_generation_kwh),
        "monthly_generation_kwh": float(pred.monthly_generation_kwh),
        "annual_generation_kwh": float(pred.annual_generation_kwh),
        "gross_cost_inr": float(pred.gross_cost_inr),
        "central_subsidy_inr": float(pred.central_subsidy_inr),
        "state_subsidy_inr": float(pred.state_subsidy_inr),
        "net_investment_inr": float(pred.net_investment_inr),
        "payback_years": float(pred.payback_years),
        "roi_pct": float(pred.roi_pct),
        "npv_inr": float(pred.npv_inr),
        "co2_offset_kg": float(pred.co2_offset_kg),
        "trees_equivalent": int(pred.trees_equivalent),
        "solar_score": int(pred.solar_score),
        "health_index": int(pred.health_index),
        "recommendations": pred.recommendations,
        "insights": pred.insights,
        "whatif_results": pred.whatif_results,
        "confidence_percent": int(pred.confidence_percent),
        "confidence_low": float(pred.confidence_low),
        "confidence_high": float(pred.confidence_high)
    }
    
    pdf_buffer = generate_pdf_report(data)
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=SolarAI_India_Report_{pred_id}.pdf"}
    )


# Removed PINCODE dictionary and lookup endpoint as frontend handles it directly.


@app.get("/api/health")
def health_check():
    """Simple health-check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}
