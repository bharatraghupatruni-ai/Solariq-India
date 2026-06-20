# SolarIQ India ☀️

SolarIQ India is an AI-powered feasibility and financial analysis platform designed to help residential and commercial properties in India transition to solar energy.

By combining an intelligent Next.js frontend with a powerful Python machine-learning backend, SolarIQ India calculates highly accurate solar generation predictions, net-metering revenue, and discounted cash flow (DCF) financials tailored explicitly to Indian policies like the **PM Surya Ghar** subsidy scheme.

## 🚀 Key Features

*   **AI Generation Prediction:** Accurate daily/monthly/annual solar generation predictions powered by Scikit-learn and environmental parameters.
*   **Hyper-Local Financials:** Natively calculates exact state-wise tariffs, net metering exports, and central/state subsidies out-of-the-box.
*   **Discounted Cash Flow (DCF) NPV:** Enterprise-grade financial projections accounting for electricity inflation, panel degradation, and discount rates over a 25-year lifespan.
*   **Hardware Agnostic:** Automatically adjusts efficiency ratios and pricing for Mono PERC, TOPCon, HJT, Bifacial, Poly, and Thin Film panels.
*   **Automated Pincode Resolution:** Instantly resolves exact Indian cities and districts from a compact, deduplicated local dataset without relying on rate-limited external APIs.

## 🛠️ Tech Stack

### Frontend (User Interface)
*   [Next.js 15](https://nextjs.org/) (React Framework)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Vitest](https://vitest.dev/) (Unit testing)

### Backend (Machine Learning & Core Math)
*   [Python 3](https://www.python.org/)
*   [FastAPI](https://fastapi.tiangolo.com/)
*   [Scikit-learn](https://scikit-learn.org/) / Joblib

### Database & Auth
*   [Supabase](https://supabase.com/) (PostgreSQL & Authentication)

---

## 💻 Running the Project Locally

Because this project uses both a Next.js frontend and a Python backend, you will need to run both servers locally.

### 1. Frontend Setup
Make sure you have Node.js installed.
```bash
# Install NPM dependencies
npm install --legacy-peer-deps

# Start the Next.js development server
npm run dev
```
The UI will be available at `http://localhost:3000`.

### 2. Backend Setup
Make sure you have Python installed.
```bash
# Navigate to the ML directory
cd ml

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi "uvicorn[standard]" scikit-learn joblib pydantic sqlalchemy jose

# Run the FastAPI server
uvicorn backend.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Environment Variables
Copy the `.env.example` file to `.env.local` and fill in your Supabase credentials to enable database connectivity and authentication.

```bash
cp .env.example .env.local
```

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
