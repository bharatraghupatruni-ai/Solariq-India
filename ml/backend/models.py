import datetime
import uuid
from sqlalchemy import Column, String, Integer, Numeric, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)  # Store UUID as String for SQLite compatibility
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    plan_type = Column(String, default="free")
    credits_remaining = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class City(Base):
    __tablename__ = "cities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    tariff_zone = Column(Integer, default=1)
    discom = Column(String, nullable=True)

class WeatherCache(Base):
    __tablename__ = "weather_cache"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    current_temp = Column(Numeric(5, 2), nullable=True)
    current_humidity = Column(Numeric(5, 2), nullable=True)
    current_clouds = Column(Numeric(5, 2), nullable=True)
    current_conditions = Column(String, nullable=True)
    forecast_data = Column(JSON, default=list)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)

class Tariff(Base):
    __tablename__ = "tariffs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    state = Column(String, unique=True, nullable=False)
    base_rate = Column(Numeric(6, 2), nullable=False)
    commercial_rate = Column(Numeric(6, 2), nullable=False)

class Subsidy(Base):
    __tablename__ = "subsidies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    capacity_limit_kwp = Column(Numeric(6, 2), nullable=False)
    rate_per_kw = Column(Numeric(10, 2), nullable=False)

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)  # Map to auth.users.id
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    roof_area_sqm = Column(Numeric(10, 2), nullable=False)
    monthly_bill_inr = Column(Numeric(10, 2), nullable=False)
    monthly_consumption_kwh = Column(Numeric(10, 2), nullable=False)
    budget_inr = Column(Numeric(12, 2), nullable=False)
    property_type = Column(String, nullable=False)
    panel_type = Column(String, nullable=False)
    orientation = Column(String, nullable=False)
    shading = Column(String, nullable=False)
    cleaning = Column(String, nullable=False)
    environment = Column(String, nullable=False)
    
    # Outputs
    daily_generation_kwh = Column(Numeric(10, 3), nullable=False)
    monthly_generation_kwh = Column(Numeric(10, 3), nullable=False)
    annual_generation_kwh = Column(Numeric(10, 3), nullable=False)
    net_investment_inr = Column(Numeric(12, 2), nullable=False)
    gross_cost_inr = Column(Numeric(12, 2), nullable=False)
    central_subsidy_inr = Column(Numeric(12, 2), nullable=False)
    state_subsidy_inr = Column(Numeric(12, 2), nullable=False)
    payback_years = Column(Numeric(5, 2), nullable=False)
    roi_pct = Column(Numeric(8, 2), nullable=False)
    npv_inr = Column(Numeric(14, 2), nullable=False)
    co2_offset_kg = Column(Numeric(10, 2), nullable=False)
    trees_equivalent = Column(Integer, nullable=False)
    
    # Engine scores & arrays
    solar_score = Column(Integer, nullable=False)
    health_index = Column(Integer, nullable=False)
    recommendations = Column(JSON, default=list)
    insights = Column(JSON, default=list)
    whatif_results = Column(JSON, default=list)
    
    # Confidence metrics
    confidence_percent = Column(Integer, nullable=False)
    confidence_low = Column(Numeric(10, 3), nullable=False)
    confidence_high = Column(Numeric(10, 3), nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    roof_analysis_id = Column(String, nullable=True)
    report_type = Column(String, default="full")
    pdf_url = Column(String, nullable=True)
    pdf_storage_path = Column(String, nullable=True)
    share_token = Column(String, unique=True, default=lambda: uuid.uuid4().hex)
    is_public = Column(Integer, default=0) # 0 for false, 1 for true (SQLite compatibility)
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(days=90))
