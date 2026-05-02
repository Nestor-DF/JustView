from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
import uuid

# Importers from strategies
from strategies.reader import get_reader_for_file, ReaderContext
from strategies.processor import apply_processing
from strategies.visualizer import get_visualizer

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

ChartRequest = Union[BarRequest, PieRequest, LineRequest, ScatterRequest, HistogramRequest, DensityRequest, BoxplotRequest, CorrelogramRequest]
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
