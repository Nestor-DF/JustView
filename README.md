# JustView

JustView is a minimalist data visualization and processing web application inspired by Apache Superset. It consists of a React (Vite) frontend for quick interactivity and a Python (FastAPI) backend for robust data handling and strategy-based processing (Pandas).

## Prerequisites

- **Docker** and **Docker Compose** (for easy deployment)
- **Node.js** (v18+ recommended, for local development)
- **Python** (3.9+ recommended, for local development)

---

## 1. Running with Docker (Recommended)

The easiest way to get the application up and running is using Docker Compose.

1. Ensure Docker is running.
2. Open a terminal in the root directory of the project.
3. Run the following command:
   ```bash
   docker compose up
   ```
   *(Use `docker compose up -d` to run in the background)*

4. The application will be available at:
   - **Frontend**: [http://localhost:8080](http://localhost:8080)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)

---

## 2. Setting up Locally (Manual)

### Backend (FastAPI)

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

### Frontend (Vite + React)

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
   > The app should now be accessible at `http://localhost:8080`. 

---

## Running the App
Once the servers are running (either via Docker or locally), just open your browser at [http://localhost:8080](http://localhost:8080). You can then upload a dataset (e.g. `test_data.csv`) and start generating dynamic charts.
