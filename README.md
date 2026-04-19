# JustView

JustView is a minimalist data visualization and processing web application inspired by Apache Superset. It consists of a React (Vite) frontend for quick interactivity and a Python (FastAPI) backend for robust data handling and strategy-based processing (Pandas).

## Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (3.9+ recommended)

---

## 1. Setting up the Backend (FastAPI)

The backend handles file uploads, data cleaning strategies, and generation of chart configurations.

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   ```

3. Activate the virtual environment:
   - On Linux/macOS:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

4. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the backend development server:
   ```bash
   uvicorn main:app --reload
   ```
   > The server will start running on `http://localhost:8000`. Keep this terminal open.

---

## 2. Setting up the Frontend (Vite + React)

The frontend handles the user interface, dataset configurations, and chart rendering via `react-plotly.js`.

1. Open a **new** terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The app should now be accessible at `http://localhost:5173`. 

---

## Running the App
Once both servers are running, just open your browser at [http://localhost:5173](http://localhost:5173). You can then upload a dataset (e.g. `test_data.csv`) and start generating dynamic charts.
