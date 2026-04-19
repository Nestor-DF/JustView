from abc import ABC, abstractmethod
import pandas as pd
from typing import List, Dict, Any

class DataProcessorStrategy(ABC):
    @abstractmethod
    def process(self, df: pd.DataFrame, options: Dict[str, Any] = None) -> pd.DataFrame:
        pass

class NullHandlerStrategy(DataProcessorStrategy):
    def process(self, df: pd.DataFrame, options: Dict[str, Any] = None) -> pd.DataFrame:
        # Simple handler: drop nulls
        action = options.get('action', 'drop') if options else 'drop'
        if action == 'drop':
            return df.dropna()
        elif action == 'fill_zero':
            return df.fillna(0)
        return df

class DuplicateHandlerStrategy(DataProcessorStrategy):
    def process(self, df: pd.DataFrame, options: Dict[str, Any] = None) -> pd.DataFrame:
        return df.drop_duplicates()

class OutlierHandlerStrategy(DataProcessorStrategy):
    def process(self, df: pd.DataFrame, options: Dict[str, Any] = None) -> pd.DataFrame:
        # Simple IQR method for numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns
        if not len(numeric_cols):
            return df
            
        df_out = df.copy()
        for col in numeric_cols:
            Q1 = df_out[col].quantile(0.25)
            Q3 = df_out[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df_out = df_out[(df_out[col] >= lower_bound) & (df_out[col] <= upper_bound)]
            
        return df_out

class ProcessorContext:
    def __init__(self):
        self._strategies: List[DataProcessorStrategy] = []

    def add_strategy(self, strategy: DataProcessorStrategy):
        self._strategies.append(strategy)

    def execute_processing(self, df: pd.DataFrame, options: Dict[str, Dict] = None) -> pd.DataFrame:
        options = options or {}
        for strategy in self._strategies:
            strategy_name = strategy.__class__.__name__
            strat_options = options.get(strategy_name, {})
            df = strategy.process(df, strat_options)
        return df

def apply_processing(df: pd.DataFrame, processor_names: List[str]) -> pd.DataFrame:
    context = ProcessorContext()
    for name in processor_names:
        if name == 'nulls':
            context.add_strategy(NullHandlerStrategy())
        elif name == 'duplicates':
            context.add_strategy(DuplicateHandlerStrategy())
        elif name == 'outliers':
            context.add_strategy(OutlierHandlerStrategy())
            
    return context.execute_processing(df)
