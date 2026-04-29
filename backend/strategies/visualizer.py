from abc import ABC, abstractmethod
import pandas as pd
import plotly.express as px
import plotly.io as pio

class VisualizerStrategy(ABC):
    @abstractmethod
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        pass

def prepare_data(df: pd.DataFrame, dimension: str, metric: dict, common_config: dict) -> tuple:
    if not dimension or dimension not in df.columns:
        return df, dimension, None
        
    agg_func = metric.get('aggregation', 'sum').lower()
    col = metric.get('column')
    
    if agg_func != 'count' and (not col or col not in df.columns):
        return df, dimension, None
        
    try:
        if agg_func == 'count':
            if not col or col == '*':
                y_col = 'COUNT(*)'
                grouped = df.groupby(dimension).size().reset_index(name=y_col)
            elif col in df.columns:
                y_col = f'COUNT({col})'
                grouped = df.groupby(dimension)[col].count().reset_index(name=y_col)
            else:
                y_col = 'COUNT(*)'
                grouped = df.groupby(dimension).size().reset_index(name=y_col)
        else:
            y_col = f'{agg_func.upper()}({col})'
            grouped = df.groupby(dimension)[col].agg(agg_func).reset_index(name=y_col)
    except Exception:
        y_col = 'COUNT(*)'
        grouped = df.groupby(dimension).size().reset_index(name=y_col)
        
    limit = common_config.get('limit', 100)
    
    if y_col in grouped.columns:
        grouped = grouped.sort_values(by=y_col, ascending=False)
    if limit:
        grouped = grouped.head(int(limit))
        
    return grouped, dimension, y_col

class LineChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        dimension = specific_config.get('dimension')
        metric = specific_config.get('metric', {})
        time_granularity = specific_config.get('time_granularity', 'none')
        
        plot_df = df.copy()
        
        if time_granularity and time_granularity != 'none' and dimension in plot_df.columns:
            try:
                plot_df[dimension] = pd.to_datetime(plot_df[dimension])
                if time_granularity == 'day':
                    plot_df[dimension] = plot_df[dimension].dt.to_period('D').dt.to_timestamp()
                elif time_granularity == 'month':
                    plot_df[dimension] = plot_df[dimension].dt.to_period('M').dt.to_timestamp()
                elif time_granularity == 'year':
                    plot_df[dimension] = plot_df[dimension].dt.to_period('Y').dt.to_timestamp()
            except Exception:
                pass
                
        plot_df, x_col, y_col = prepare_data(plot_df, dimension, metric, common_config)
            
        if x_col in plot_df.columns:
            plot_df = plot_df.sort_values(by=x_col, ascending=True)
            
        if not y_col: return "{}"
        fig = px.line(plot_df, x=x_col, y=y_col, title=f"Line Chart: {y_col} by {x_col}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class BarChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        dimension = specific_config.get('dimension')
        metric = specific_config.get('metric', {})
        
        plot_df, x_col, y_col = prepare_data(df, dimension, metric, common_config)
        
        if not y_col: return "{}"
        fig = px.bar(plot_df, x=x_col, y=y_col, title=f"Bar Chart: {y_col} by {x_col}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class PieChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        dimension = specific_config.get('dimension')
        metric = specific_config.get('metric', {})
        
        plot_df, category_col, value_col = prepare_data(df, dimension, metric, common_config)
        
        if not value_col: return "{}"
        fig = px.pie(plot_df, names=category_col, values=value_col, title=f"Pie Chart: {value_col} by {category_col}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class ScatterChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        x_col = specific_config.get('x_column')
        y_col = specific_config.get('y_column')
        limit = common_config.get('limit', 100)
        
        if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
            return "{}"
            
        plot_df = df.head(int(limit)) if limit else df
        fig = px.scatter(plot_df, x=x_col, y=y_col, title=f"Scatter Plot: {y_col} vs {x_col}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class HistogramStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        col = specific_config.get('column')
        limit = common_config.get('limit', 100)
        
        if not col or col not in df.columns:
            return "{}"
            
        plot_df = df.head(int(limit)) if limit else df
        fig = px.histogram(plot_df, x=col, title=f"Histogram: {col}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

def get_visualizer(chart_type: str) -> VisualizerStrategy:
    if chart_type == 'line':
        return LineChartStrategy()
    elif chart_type == 'pie':
        return PieChartStrategy()
    elif chart_type == 'bar':
        return BarChartStrategy()
    elif chart_type == 'scatter':
        return ScatterChartStrategy()
    elif chart_type == 'histogram':
        return HistogramStrategy()
    else:
        # Default
        return BarChartStrategy()
