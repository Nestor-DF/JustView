import React, { useState } from 'react';
import DataUploader from './components/DataUploader';
import ProcessConfigurator from './components/ProcessConfigurator';
import ChartConfigurator from './components/ChartConfigurator';
import ChartViewer from './components/ChartViewer';
import { Eye } from 'lucide-react';

function App() {
    const [file, setFile] = useState(null);
    const [processOptions, setProcessOptions] = useState([]);
    const [datasetMeta, setDatasetMeta] = useState(null);
    const [chartConfig, setChartConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUploadAndProcess = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('process_options', JSON.stringify(processOptions));

        try {
            // Assuming backend is running on 8000
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Upload failed');
            }

            setDatasetMeta(data);
            // Initialize default chart config
            setChartConfig({
                dataset_id: data.dataset_id,
                chart_type: 'bar',
                common: { limit: 100 },
                specific: {
                    x_axis: data.columns.length > 0 ? data.columns[0] : '',
                    y_axis: data.columns.length > 0 ? data.columns[data.columns.length - 1] : '',
                    aggregation: 'sum'
                }
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setProcessOptions([]);
        setDatasetMeta(null);
        setChartConfig(null);
        setError('');
    };

    return (
        <div className="app-container">
            {/* Sidebar for Controls */}
            <div className="sidebar">
                <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Eye size={28} />
                    <h1>JustView</h1>
                </div>

                {error && <div style={{ color: 'red', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

                {!datasetMeta ? (
                    <>
                        <DataUploader file={file} setFile={setFile} />
                        {file && (
                            <>
                                <ProcessConfigurator options={processOptions} setOptions={setProcessOptions} />
                                <button
                                    onClick={handleUploadAndProcess}
                                    disabled={loading}
                                    style={{ width: '100%', marginTop: '20px' }}>
                                    {loading ? 'Processing...' : 'Load & Process Data'}
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <div className="card" style={{ marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Dataset Info</h3>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                <p>File: {datasetMeta.filename}</p>
                                <p>Rows: {datasetMeta.num_rows}</p>
                                <p>Columns: {datasetMeta.columns.length}</p>
                            </div>
                            <button className="secondary" onClick={handleReset} style={{ width: '100%', marginTop: '10px', fontSize: '12px', padding: '6px' }}>
                                Load New Dataset
                            </button>
                        </div>

                        <ChartConfigurator
                            columns={datasetMeta.columns}
                            config={chartConfig}
                            setConfig={setChartConfig}
                        />
                    </>
                )}
            </div>

            {/* Main Content for Charts */}
            <div className="main-content">
                {!datasetMeta ? (
                    <div className="chart-container-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                        <div style={{ textAlign: 'center', color: '#888' }}>
                            <Eye size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <h2>Welcome to JustView</h2>
                            <p>Upload a CSV or Excel file to get started.</p>
                        </div>
                    </div>
                ) : (
                    <ChartViewer config={chartConfig} />
                )}
            </div>
        </div>
    );
}

export default App;
