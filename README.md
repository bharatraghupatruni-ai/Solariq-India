# ☀️ SolarIQ India — AI-Powered Solar Feasibility Platform

SolarIQ India is an advanced, AI-powered solar feasibility platform designed for Indian rooftops. By leveraging real-time NASA satellite solar irradiance data, local meteorological parameters, and state-specific electricity tariffs, SolarIQ helps homeowners and businesses estimate solar generation, financial ROI, and policy subsidies under the **MNRE PM Surya Ghar Muft Bijli Yojana (2024)**.

🚀 **Live Site:** [https://solariq-india.vercel.app](https://solariq-india.vercel.app)

---

## 🌟 Key Features

- **Claymorphic UI/UX**: Soft, tactile, modern three-dimensional design system engineered for maximum visual appeal and clean interactivity.
- **4-Step Analysis Wizard**: Quickly captures property details, pincode-based geographical coordinates, historical utility bills, and hardware preferences.
- **XGBoost Machine Learning Engine**: Predicts annual and monthly generation using 12 engineered features, modeling temperature coefficients, orientation, shading, and monsoonal variations.
- **MNRE Subsidy Calculator**: Automatically models PM Surya Ghar scheme subsidies (capping at ₹78,000 for residential systems) and handles commercial AD/tax offsets.
- **Interactive What-If Simulator**: Real-time sliding controls to simulate variations in shading, cleaning frequency, and panel types on overall payback periods.
- **EMI Cash Flow Estimator**: Automatically compares solar loan EMIs against monthly electricity savings to show immediate net-positive cash flows.
- **25-Year Projections**: Compounds electricity price inflation ($6\%$) and panel degradation ($0.5\%/\text{year}$) to output standard NPV, IRR, and payback calculations.
- **PDF Feasibility Reports**: Clean, download-ready PDF report generation summarizing key engineering and financial data.

---

## 🗺️ System Architecture Flow

```mermaid
graph TD
    A[User Input: PINCODE & Rooftop Parameters] --> B[PINCODE Engine]
    B -->|Resolves State, City, Lat/Lon, DISCOM| C[NASA POWER API v2]
    B -->|Resolves Local Climate| D[OpenWeather API]
    C -->|GHI, Temp, Humidity, Cloud Cover| E[Supabase Weather Cache]
    D -->|Current Weather & Forecasts| E
    
    E --> F[ML Prediction Engine]
    A --> F
    F -->|XGBoost Surrogate Model| G[Solar Generation Predictions]
    
    G --> H[Financial Projections Engine]
    A --> H
    H -->|MNRE Subsidy, ROI, IRR, NPV, Payback, EMI| I[Supabase DB]
    
    I --> J[AI Insights & Recommendations]
    I --> K[What-if Simulator]
    I --> L[PDF Generation Route]
    
    J --> M[Claymorphic Next.js Dashboard]
    K --> M
    L --> M
```

---

## 🛠️ Tech Stack

### Frontend & Web Application
- **Framework**: Next.js 15 (App Router, Server Actions, Middleware)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (Custom Claymorphic utility tokens)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React

### Database & Auth
- **Database**: Supabase PostgreSQL
- **Security**: Strict PostgreSQL Row-Level Security (RLS) policies
- **Auth**: Supabase SSR Client & Server Session Management

### Machine Learning & Backend
- **Framework**: FastAPI (Python)
- **Model**: XGBoost Regressor (12 feature input vectors)
- **ORM**: SQLAlchemy / PostgreSQL
- **Reporting**: ReportLab (PDF Engine)

### External Integrations
- **NASA POWER API**: Global Horizontal Irradiance (GHI) and meteorological tables
- **OpenWeather API**: Local real-time weather alerts and solar-sky forecasts

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and configure your API credentials before launching the application:

```ini
# SUPABASE CONFIG
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# PYTHON BACKEND CONFIG
ML_BACKEND_URL=http://localhost:8000
JWT_SECRET=your-supabase-jwt-secret-here

# EXTERNAL APIS
NASA_POWER_BASE_URL=https://power.larc.nasa.gov/api/temporal/daily/point
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
OPENWEATHER_API_KEY=your-openweather-api-key-here

# APP CONFIG
APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Python**: `v3.10.x` or higher (for ML backend)

### 2. Frontend Installation & Start
```bash
# Clone the repository
git clone https://github.com/bharatraghupatruni-ai/Solariq-India.git
cd Solariq-India

# Install dependencies (utilizes legacy-peer-deps for React 19 matching packages)
npm install

# Start the dev server
npm run dev
```
Open `http://localhost:3000` to view the frontend dashboard.

### 3. ML Backend Setup (Optional)
```bash
# Navigate to backend directory
cd ml/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload
```
FastAPI docs will be available at `http://localhost:8000/docs`.

### 4. Running Verification Tests
To run unit and mathematics calibration tests locally:
```bash
# Run tests
npm run test

# Run typescript compilation verification
npm run typecheck
```

---

## 🌐 Production Deployment

### Frontend (Vercel)
The Next.js frontend is configured to build out-of-the-box on Vercel:
1. Ensure all `NEXT_PUBLIC_` variables are set in **Project Settings -> Environment Variables**.
2. Point `ML_BACKEND_URL` to your production backend URL.
3. Next.js bakes environment variables into client assets at compile time, so **redeploy** after adding or editing any configuration.

### Backend (Render)
The FastAPI server can be deployed on Render using the provided `Dockerfile.backend`:
1. Select Docker runtime in Web Service creation.
2. Define `DATABASE_URL` (Supabase DB Connection) and `JWT_SECRET` (Supabase API JWT Settings) in Render environment variables.
3. Configure `NEXT_PUBLIC_APP_URL` to match your Vercel domain to support CORS.
