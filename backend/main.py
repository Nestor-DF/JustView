from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
import json
import uuid

# Importers from strategies
from strategies.reader import get_reader_for_file, ReaderContext
from strategies.processor import apply_processing
from strategies.visualizer import get_visualizer
from strategies.ml import get_ml_strategy

app = FastAPI()

# Configurar CORS (para desarrollo con vite port 5173 o local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global dict to hold datasets in memory for simple implementation
DATASETS_STORE = {}

# Global dict to hold trained ML models in memory
MODELS_STORE = {}

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    process_options: str = Form("[]") # JSON string containing strategies to apply
):
    try:
        content = await file.read()
        
        # 1. Strategy: Reader
        reader = get_reader_for_file(file.filename)
        reader_context = ReaderContext(reader)
        df = reader_context.execute_read(content, file.filename)
        
        # 2. Strategy: Processor
        options_list = json.loads(process_options)
        if options_list:
            df = apply_processing(df, options_list)
        
        # Store df and its meta
        dataset_id = str(uuid.uuid4())
        DATASETS_STORE[dataset_id] = df
        
        # Return info to frontend
        columns = df.columns.tolist()
        num_rows = len(df)
        
        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "columns": columns,
            "num_rows": num_rows,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from pydantic import BaseModel
from typing import Literal, Union, Any

class CommonConfig(BaseModel):
    limit: Optional[int] = 100

class MetricConfig(BaseModel):
    aggregation: Literal["sum", "mean", "count", "min", "max"]
    column: Optional[str] = None

class BarSpecific(BaseModel):
    dimension: str
    metric: MetricConfig

class PieSpecific(BaseModel):
    dimension: str
    metric: MetricConfig

class LineSpecific(BaseModel):
    dimension: str
    metric: MetricConfig
    time_granularity: Optional[str] = "none"

class ScatterSpecific(BaseModel):
    x_column: str
    y_column: str

class HistogramSpecific(BaseModel):
    column: str

class DensitySpecific(BaseModel):
    column: str
    group_by: Optional[str] = None

class BoxplotSpecific(BaseModel):
    column: str
    group_by: Optional[str] = None

class CorrelogramSpecific(BaseModel):
    columns: Optional[List[str]] = None

class MapSpecific(BaseModel):
    latitude_column: Optional[str] = None
    longitude_column: Optional[str] = None
    geojson_column: Optional[str] = None
    tooltip_column: Optional[str] = None

class BaseChartRequest(BaseModel):
    dataset_id: str
    common: CommonConfig

class BarRequest(BaseChartRequest):
    chart_type: Literal["bar"]
    specific: BarSpecific

class PieRequest(BaseChartRequest):
    chart_type: Literal["pie"]
    specific: PieSpecific

class LineRequest(BaseChartRequest):
    chart_type: Literal["line"]
    specific: LineSpecific

class ScatterRequest(BaseChartRequest):
    chart_type: Literal["scatter"]
    specific: ScatterSpecific

class HistogramRequest(BaseChartRequest):
    chart_type: Literal["histogram"]
    specific: HistogramSpecific

class DensityRequest(BaseChartRequest):
    chart_type: Literal["density"]
    specific: DensitySpecific

class BoxplotRequest(BaseChartRequest):
    chart_type: Literal["boxplot"]
    specific: BoxplotSpecific

class CorrelogramRequest(BaseChartRequest):
    chart_type: Literal["correlogram"]
    specific: CorrelogramSpecific

class MapRequest(BaseChartRequest):
    chart_type: Literal["map"]
    specific: MapSpecific

ChartRequest = Union[BarRequest, PieRequest, LineRequest, ScatterRequest, HistogramRequest, DensityRequest, BoxplotRequest, CorrelogramRequest, MapRequest]
    
@app.post("/api/chart")
async def generate_chart(request: ChartRequest):
    dataset_id = request.dataset_id
    if dataset_id not in DATASETS_STORE:
        raise HTTPException(status_code=404, detail="Dataset not found or session expired.")
        
    df = DATASETS_STORE[dataset_id]
    
    # 3. Strategy: Visualizer
    visualizer = get_visualizer(request.chart_type)
    
    try:
        chart_json = visualizer.generate_chart_json(df, request.common.model_dump(), request.specific.model_dump())
        return json.loads(chart_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Visualizer Error: {str(e)}")

# --- ML (Machine Learning) Models ---

class LinearRegressionSpecific(BaseModel):
    features: List[str]
    target: str
    test_size: Optional[float] = 0.2

class LogisticRegressionSpecific(BaseModel):
    features: List[str]
    target: str
    test_size: Optional[float] = 0.2

class BaseMLRequest(BaseModel):
    dataset_id: str

class LinearRegressionRequest(BaseMLRequest):
    ml_method: Literal["linear_regression"]
    specific: LinearRegressionSpecific

class LogisticRegressionRequest(BaseMLRequest):
    ml_method: Literal["logistic_regression"]
    specific: LogisticRegressionSpecific

MLRequest = Union[LinearRegressionRequest, LogisticRegressionRequest]

@app.post("/api/ml")
async def run_ml(request: MLRequest):
    dataset_id = request.dataset_id
    if dataset_id not in DATASETS_STORE:
        raise HTTPException(status_code=404, detail="Dataset not found or session expired.")
    
    df = DATASETS_STORE[dataset_id]
    
    # 4. Strategy: Machine Learning
    try:
        strategy = get_ml_strategy(request.ml_method)
        results = strategy.train_and_evaluate(df, request.specific.model_dump())

        # Extract and store internal model objects
        model_obj = results.pop("_model_object", None)
        features = results.pop("_features", None)
        target = results.pop("_target", None)
        label_encoder = results.pop("_label_encoder", None)

        model_id = str(uuid.uuid4())
        MODELS_STORE[model_id] = {
            "model": model_obj,
            "features": features,
            "target": target,
            "ml_method": request.ml_method,
            "label_encoder": label_encoder,
        }

        results["model_id"] = model_id
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"ML Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ML error: {str(e)}")


# --- ML Predict & Download ---

class PredictRequest(BaseModel):
    model_id: str
    values: Dict[str, float]

@app.post("/api/ml/predict")
async def predict(request: PredictRequest):
    if request.model_id not in MODELS_STORE:
        raise HTTPException(status_code=404, detail="Model not found or session expired.")
    
    entry = MODELS_STORE[request.model_id]
    model = entry["model"]
    features = entry["features"]
    label_encoder = entry.get("label_encoder")
    ml_method = entry["ml_method"]

    # Validate that all features are provided
    missing = [f for f in features if f not in request.values]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing feature values: {missing}")

    try:
        import numpy as np
        X = np.array([[request.values[f] for f in features]])
        raw_pred = model.predict(X)

        if ml_method == "logistic_regression" and label_encoder is not None:
            predicted_label = label_encoder.inverse_transform(raw_pred)
            return {
                "prediction": str(predicted_label[0]),
                "prediction_type": "class",
            }
        else:
            return {
                "prediction": round(float(raw_pred[0]), 6),
                "prediction_type": "value",
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")


from fastapi.responses import StreamingResponse
import io

@app.get("/api/ml/download/{model_id}")
async def download_model(model_id: str):
    if model_id not in MODELS_STORE:
        raise HTTPException(status_code=404, detail="Model not found or session expired.")
    
    entry = MODELS_STORE[model_id]

    try:
        import joblib
        buffer = io.BytesIO()
        joblib.dump(entry["model"], buffer)
        buffer.seek(0)

        filename = f"{entry['ml_method']}_{entry['target']}.joblib"
        return StreamingResponse(
            buffer,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
