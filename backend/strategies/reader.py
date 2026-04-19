from abc import ABC, abstractmethod
import pandas as pd
import io

class DataReaderStrategy(ABC):
    @abstractmethod
    def read(self, file_content: bytes, filename: str) -> pd.DataFrame:
        pass

class CSVReaderStrategy(DataReaderStrategy):
    def read(self, file_content: bytes, filename: str) -> pd.DataFrame:
        # Intenta adivinar el separador y la codificacion si fuera necesario
        try:
            return pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            # Fallback for alternative separation
            return pd.read_csv(io.BytesIO(file_content), sep=';')

class ExcelReaderStrategy(DataReaderStrategy):
    def read(self, file_content: bytes, filename: str) -> pd.DataFrame:
        return pd.read_excel(io.BytesIO(file_content))

class ReaderContext:
    def __init__(self, strategy: DataReaderStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: DataReaderStrategy):
        self._strategy = strategy

    def execute_read(self, file_content: bytes, filename: str) -> pd.DataFrame:
        return self._strategy.read(file_content, filename)

def get_reader_for_file(filename: str) -> DataReaderStrategy:
    if filename.endswith('.csv'):
        return CSVReaderStrategy()
    elif filename.endswith(('.xls', '.xlsx')):
        return ExcelReaderStrategy()
    else:
        raise ValueError(f"Format not supported for file: {filename}")
