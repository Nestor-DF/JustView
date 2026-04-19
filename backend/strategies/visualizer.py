from abc import ABC, abstractmethod
import pandas as pd
import plotly.express as px
import plotly.io as pio

class VisualizerStrategy(ABC):
    @abstractmethod
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        pass

def prepare_data(df: pd.DataFrame, group_col: str, val_col: str, agg_func: str, common_config: dict) -> pd.DataFrame:
    if not group_col:
        return df
        
    if val_col and val_col not in df.columns:
        return df
        
    # Group by
    try:
        if agg_func == 'count':
            grouped = df.groupby(group_col).size().reset_index(name='count')
            val_col = 'count'
        elif not val_col:
            # Cannot do sum/mean without val_col
            return df
        else:
            grouped = df.groupby(group_col)[val_col].agg(agg_func).reset_index()
    except Exception:
        grouped = df.groupby(group_col).size().reset_index(name='count')
        val_col = 'count'
        
    # Sort and limit
    limit = common_config.get('limit', 100)
    
    # We sort by value descending by default
    if val_col in grouped.columns:
        grouped = grouped.sort_values(by=val_col, ascending=False)
    if limit:
        grouped = grouped.head(int(limit))
        
    return grouped

class LineChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        x_axis = specific_config.get('x_axis')
        y_axis = specific_config.get('y_axis')
        agg_func = specific_config.get('aggregation', 'sum').lower()
        time_granularity = specific_config.get('time_granularity', 'none')
        
        plot_df = df.copy()
        
        if time_granularity and time_granularity != 'none' and x_axis in plot_df.columns:
            # Try to convert to datetime
            try:
                plot_df[x_axis] = pd.to_datetime(plot_df[x_axis])
                if time_granularity == 'day':
                    plot_df[x_axis] = plot_df[x_axis].dt.to_period('D').dt.to_timestamp()
                elif time_granularity == 'month':
                    plot_df[x_axis] = plot_df[x_axis].dt.to_period('M').dt.to_timestamp()
                elif time_granularity == 'year':
                    plot_df[x_axis] = plot_df[x_axis].dt.to_period('Y').dt.to_timestamp()
            except Exception:
                pass # Fallback if not date
                
        plot_df = prepare_data(plot_df, x_axis, y_axis, agg_func, common_config)
        if agg_func == 'count':
            y_axis = 'count'
            
        # Sort by x_axis for line charts instead of value descending
        if x_axis in plot_df.columns:
            plot_df = plot_df.sort_values(by=x_axis, ascending=True)
            
        fig = px.line(plot_df, x=x_axis, y=y_axis, title=f"Line Chart: {y_axis} by {x_axis}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class BarChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        x_axis = specific_config.get('x_axis')
        y_axis = specific_config.get('y_axis')
        agg_func = specific_config.get('aggregation', 'sum').lower()
        
        plot_df = prepare_data(df, x_axis, y_axis, agg_func, common_config)
        if agg_func == 'count':
            y_axis = 'count'
            
        fig = px.bar(plot_df, x=x_axis, y=y_axis, title=f"Bar Chart: {y_axis} by {x_axis}")
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
        return pio.to_json(fig)

class PieChartStrategy(VisualizerStrategy):
    def generate_chart_json(self, df: pd.DataFrame, common_config: dict, specific_config: dict) -> str:
        category = specific_config.get('category')
        value = specific_config.get('value')
        agg_func = specific_config.get('aggregation', 'sum').lower()
        
        plot_df = prepare_data(df, category, value, agg_func, common_config)
        if agg_func == 'count':
            value = 'count'
            
        fig = px.pie(plot_df, names=category, values=value, title=f"Pie Chart: {value} by {category}")
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

