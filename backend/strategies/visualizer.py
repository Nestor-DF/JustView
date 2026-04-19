from abc import ABC, abstractmethod
import pandas as pd
import plotly.express as px
import plotly.io as pio

class VisualizerStrategy(ABC):
    @abstractmethod
    def generate_chart_json(self, df: pd.DataFrame, config: dict) -> str:
        # config should have: metric, dimension, filters
        pass

def prepare_data(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    dimension = config.get('dimension')
    metric = config.get('metric')
    agg_func = config.get('metric_agg', 'sum').lower()
    
    if not dimension or not metric:
        return df
        
    if metric not in df.columns or dimension not in df.columns:
        return df
        
    # Group by
    try:
        grouped = df.groupby(dimension)[metric].agg(agg_func).reset_index()
    except Exception:
        grouped = df.groupby(dimension).size().reset_index(name='count')
        
    # Sort and limit
    sort_by = config.get('sort_by', metric)
    sort_desc = config.get('sort_desc', True)
    limit = config.get('limit', 100)
    
    if sort_by in grouped.columns:
        grouped = grouped.sort_values(by=sort_by, ascending=not sort_desc)
    if limit:
        grouped = grouped.head(int(limit))
        
    return grouped

class LineChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, config: dict) -> str:
        dimension = config.get('dimension')
        metric = config.get('metric')
        
        plot_df = prepare_data(df, config)
        
        fig = px.line(plot_df, x=dimension, y=metric, title=f"Line Chart: {metric} by {dimension}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class BarChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, config: dict) -> str:
        dimension = config.get('dimension')
        metric = config.get('metric')
        
        plot_df = prepare_data(df, config)
        
        fig = px.bar(plot_df, x=dimension, y=metric, title=f"Bar Chart: {metric} by {dimension}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class PieChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, config: dict) -> str:
        dimension = config.get('dimension')
        metric = config.get('metric')
        
        plot_df = prepare_data(df, config)
        
        fig = px.pie(plot_df, names=dimension, values=metric, title=f"Pie Chart: {metric} by {dimension}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

def get_visualizer(chart_type: str) -> VisualizerStrategy:
    if chart_type == 'line':
        return LineChartStrategy()
    elif chart_type == 'pie':
        return PieChartStrategy()
    else:
        # Default or 'bar'
        return BarChartStrategy()

