from abc import ABC, abstractmethod
import pandas as pd
import io
import json

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

class GeoJSONReaderStrategy(DataReaderStrategy):
    def read(self, file_content: bytes, filename: str) -> pd.DataFrame:
        data = json.loads(file_content)
        rows = []
        for feature in data.get("features", []):
            row = feature.get("properties", {}).copy()
            # Guardamos la geometria como string JSON
            row["geometry"] = json.dumps(feature.get("geometry", {}))
            rows.append(row)
        return pd.DataFrame(rows)

def get_reader_for_file(filename: str) -> DataReaderStrategy:
    if filename.endswith('.csv'):
        return CSVReaderStrategy()
    elif filename.endswith(('.xls', '.xlsx')):
        return ExcelReaderStrategy()
    elif filename.endswith('.geojson'):
        return GeoJSONReaderStrategy()
    else:
        raise ValueError(f"Format not supported for file: {filename}")
