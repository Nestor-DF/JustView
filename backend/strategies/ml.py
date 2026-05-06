from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from typing import Dict, Any


class MLStrategy(ABC):
    """Abstract base class for supervised Machine Learning strategies."""

    @abstractmethod
    def train_and_evaluate(self, df: pd.DataFrame, config: Dict[str, Any]) -> dict:
        """
        Train a supervised ML model and return evaluation results.
        
        Args:
            df: The full DataFrame containing features and target.
            config: Dict with 'features' (list of column names), 'target' (column name),
                    and optional 'test_size' (float, default 0.2).
        
        Returns:
            A JSON-serializable dict with model results, metrics, and metadata.
        """
        pass

    def _prepare_data(self, df: pd.DataFrame, config: Dict[str, Any]):
        """Common data preparation: extract X/y, handle NaNs, split."""
        from sklearn.model_selection import train_test_split

        features = config.get('features', [])
        target = config.get('target', '')
        test_size = config.get('test_size', 0.2)

        if not features or not target:
            raise ValueError("Both 'features' and 'target' must be specified.")

        missing_cols = [c for c in features + [target] if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Columns not found in dataset: {missing_cols}")

        subset = df[features + [target]].copy()

        # Check which feature columns can be converted to numeric.
        # A column is considered non-numeric if less than 50% of its
        # non-null values survive pd.to_numeric coercion.
        non_numeric_cols = []
        for col in features:
            original_count = subset[col].dropna().shape[0]
            if original_count == 0:
                non_numeric_cols.append(col)
                continue
            coerced = pd.to_numeric(subset[col], errors='coerce')
            survived = coerced.dropna().shape[0]
            if survived / original_count < 0.5:
                non_numeric_cols.append(col)
            else:
                subset[col] = coerced

        if non_numeric_cols:
            raise ValueError(
                f"The following feature columns are not numeric and cannot be used: "
                f"{', '.join(non_numeric_cols)}. "
                f"Please select only numeric columns as features."
            )

        # Drop rows where any of the selected columns has NaN
        subset = subset.dropna(subset=features + [target])

        if len(subset) < 5:
            raise ValueError(
                f"Not enough valid data rows after cleaning (got {len(subset)}, minimum 5 required). "
                f"Check that the selected columns contain enough non-null numeric values."
            )

        X = subset[features].values
        y = subset[target].values

        # Clamp test_size to valid range
        test_size = max(0.1, min(0.5, test_size))

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        return X_train, X_test, y_train, y_test, features, target


class LinearRegressionStrategy(MLStrategy):
    """Supervised ML strategy for Linear Regression."""

    def train_and_evaluate(self, df: pd.DataFrame, config: Dict[str, Any]) -> dict:
        from sklearn.linear_model import LinearRegression
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

        X_train, X_test, y_train, y_test, features, target = self._prepare_data(df, config)

        # Ensure target is numeric for regression
        y_train = y_train.astype(float)
        y_test = y_test.astype(float)

        model = LinearRegression()
        model.fit(X_train, y_train)

        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)

        # Coefficients table
        coefficients = []
        for feat, coef in zip(features, model.coef_):
            coefficients.append({"feature": feat, "coefficient": round(float(coef), 6)})

        # Sample predictions (up to 20 rows)
        sample_size = min(20, len(y_test))
        sample_predictions = []
        for i in range(sample_size):
            sample_predictions.append({
                "actual": round(float(y_test[i]), 4),
                "predicted": round(float(y_pred_test[i]), 4)
            })

        return {
            "ml_method": "linear_regression",
            "target": target,
            "features": features,
            "num_train_samples": int(len(X_train)),
            "num_test_samples": int(len(X_test)),
            "intercept": round(float(model.intercept_), 6),
            "coefficients": coefficients,
            "metrics": {
                "r2_train": round(float(r2_score(y_train, y_pred_train)), 6),
                "r2_test": round(float(r2_score(y_test, y_pred_test)), 6),
                "rmse": round(float(mean_squared_error(y_test, y_pred_test) ** 0.5), 6),
                "mae": round(float(mean_absolute_error(y_test, y_pred_test)), 6),
            },
            "sample_predictions": sample_predictions,
            # Internal objects for persistence (stripped before JSON response)
            "_model_object": model,
            "_features": features,
            "_target": target,
            "_label_encoder": None,
        }


class LogisticRegressionStrategy(MLStrategy):
    """Supervised ML strategy for Logistic Regression."""

    def train_and_evaluate(self, df: pd.DataFrame, config: Dict[str, Any]) -> dict:
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
        from sklearn.preprocessing import LabelEncoder

        X_train, X_test, y_train, y_test, features, target = self._prepare_data(df, config)

        # Encode target labels if they are not numeric
        le = LabelEncoder()
        y_all = np.concatenate([y_train, y_test])
        le.fit(y_all)
        y_train_enc = le.transform(y_train)
        y_test_enc = le.transform(y_test)
        class_labels = [str(c) for c in le.classes_]

        model = LogisticRegression(max_iter=1000, random_state=42)
        model.fit(X_train, y_train_enc)

        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)

        # Classification report as structured dict
        report = classification_report(y_test_enc, y_pred_test, target_names=class_labels, output_dict=True, zero_division=0)

        # Build a clean report table
        report_table = []
        for label in class_labels:
            if label in report:
                report_table.append({
                    "class": label,
                    "precision": round(float(report[label]["precision"]), 4),
                    "recall": round(float(report[label]["recall"]), 4),
                    "f1_score": round(float(report[label]["f1-score"]), 4),
                    "support": int(report[label]["support"]),
                })

        # Confusion matrix
        cm = confusion_matrix(y_test_enc, y_pred_test)
        confusion = {
            "matrix": cm.tolist(),
            "labels": class_labels,
        }

        # Coefficients (one row per feature, one column per class)
        coefficients = []
        coef_matrix = model.coef_  # shape: (n_classes, n_features) or (1, n_features) for binary
        for i, feat in enumerate(features):
            row = {"feature": feat}
            for j, cls in enumerate(class_labels):
                if j < coef_matrix.shape[0]:
                    row[cls] = round(float(coef_matrix[j][i]), 6)
            coefficients.append(row)

        return {
            "ml_method": "logistic_regression",
            "target": target,
            "features": features,
            "classes": class_labels,
            "num_train_samples": int(len(X_train)),
            "num_test_samples": int(len(X_test)),
            "coefficients": coefficients,
            "metrics": {
                "accuracy_train": round(float(accuracy_score(y_train_enc, y_pred_train)), 6),
                "accuracy_test": round(float(accuracy_score(y_test_enc, y_pred_test)), 6),
            },
            "classification_report": report_table,
            "confusion_matrix": confusion,
            # Internal objects for persistence (stripped before JSON response)
            "_model_object": model,
            "_features": features,
            "_target": target,
            "_label_encoder": le,
        }


def get_ml_strategy(method: str) -> MLStrategy:
    """Factory function to obtain the concrete ML strategy by name."""
    if method == 'linear_regression':
        return LinearRegressionStrategy()
    elif method == 'logistic_regression':
        return LogisticRegressionStrategy()
    else:
        raise ValueError(f"Unknown ML method: '{method}'. Available: linear_regression, logistic_regression")
