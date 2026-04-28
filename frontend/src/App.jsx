import React, { useState } from 'react';
import DataUploader from './components/DataUploader';
import ProcessConfigurator from './components/ProcessConfigurator';
import ChartConfigurator from './components/ChartConfigurator';
import ChartViewer from './components/ChartViewer';
import { Eye, Plus, Trash2, Maximize2, Minimize2 } from 'lucide-react';

function App() {
    const [file, setFile] = useState(null);
    const [processOptions, setProcessOptions] = useState([]);
    const [datasetMeta, setDatasetMeta] = useState(null);
    const [charts, setCharts] = useState([]);
    const [activeChartId, setActiveChartId] = useState(null);
    const [maximizedChartId, setMaximizedChartId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const createDefaultChartConfig = (data) => {
        const defaultCol1 = data.columns.length > 0 ? data.columns[0] : '';
        const defaultCol2 = data.columns.length > 0 ? data.columns[data.columns.length - 1] : '';
        return {
            dataset_id: data.dataset_id,
            chart_type: 'bar',
            common: { limit: 100 },
            specific: {
                dimension: defaultCol1,
                metric: { aggregation: 'sum', column: defaultCol2 }
            }
        };
    };

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
            
            // Initialize first chart
            const newChartId = Date.now().toString();
            setCharts([{
                id: newChartId,
                config: createDefaultChartConfig(data)
            }]);
            setActiveChartId(newChartId);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChart = () => {
        if (!datasetMeta) return;
        const newChartId = Date.now().toString();
        setCharts(prev => [
            ...prev,
            {
                id: newChartId,
                config: createDefaultChartConfig(datasetMeta)
            }
        ]);
        setActiveChartId(newChartId);
    };

    const handleRemoveChart = (id, e) => {
        e.stopPropagation();
        setCharts(prev => {
            const newCharts = prev.filter(c => c.id !== id);
            // If we removed the active chart, pick the last available one
            if (activeChartId === id) {
                setActiveChartId(newCharts.length > 0 ? newCharts[newCharts.length - 1].id : null);
            }
            return newCharts;
        });
    };

    const updateChartConfig = (newConfigFn) => {
        setCharts(prev => prev.map(chart => {
            if (chart.id === activeChartId) {
                // Determine new config by passing the current config to the setter function
                const newConfig = typeof newConfigFn === 'function' ? newConfigFn(chart.config) : newConfigFn;
                return { ...chart, config: newConfig };
            }
            return chart;
        }));
    };

    const handleReset = () => {
        setFile(null);
        setProcessOptions([]);
        setDatasetMeta(null);
        setCharts([]);
        setActiveChartId(null);
        setMaximizedChartId(null);
        setError('');
    };

    const activeChart = charts.find(c => c.id === activeChartId);

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

                        <div className="card" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '14px' }}>Charts ({charts.length})</h3>
                                <button className="icon-button" onClick={handleAddChart} title="Add Chart" style={{ padding: '4px', display: 'flex' }}>
                                    <Plus size={16} />
                                </button>
                            </div>
                            
                            {charts.length === 0 ? (
                                <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '10px 0' }}>
                                    No charts. Add one!
                                </div>
                            ) : (
                                <ul className="chart-list">
                                    {charts.map((chart, index) => (
                                        <li 
                                            key={chart.id} 
                                            className={chart.id === activeChartId ? 'active' : ''}
                                            onClick={() => setActiveChartId(chart.id)}
                                        >
                                            <span>{chart.config.chart_type.toUpperCase()} Chart {index + 1}</span>
                                            <Trash2 
                                                size={14} 
                                                className="delete-icon" 
                                                onClick={(e) => handleRemoveChart(chart.id, e)} 
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {activeChart && (
                            <ChartConfigurator
                                columns={datasetMeta.columns}
                                config={activeChart.config}
                                setConfig={updateChartConfig}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Main Content for Charts */}
            <div className="main-content">
                {!datasetMeta ? (
                    <div className="chart-container-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', flex: 1 }}>
                        <div style={{ textAlign: 'center', color: '#888' }}>
                            <Eye size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <h2>Welcome to JustView</h2>
                            <p>Upload a CSV or Excel file to get started.</p>
                        </div>
                    </div>
                ) : charts.length === 0 ? (
                    <div className="chart-container-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', flex: 1 }}>
                        <div style={{ textAlign: 'center', color: '#888' }}>
                            <p>No charts to display. Add a chart from the sidebar.</p>
                        </div>
                    </div>
                ) : (
                    <div className="charts-grid">
                        {charts.map((chart) => {
                            const isMaximized = chart.id === maximizedChartId;
                            return (
                                <div 
                                    key={chart.id} 
                                    className={`chart-wrapper ${chart.id === activeChartId ? 'active-chart' : ''} ${isMaximized ? 'maximized' : ''}`}
                                    onClick={() => setActiveChartId(chart.id)}
                                    onDoubleClick={() => setMaximizedChartId(isMaximized ? null : chart.id)}
                                >
                                    <div className="maximize-btn" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                        <button 
                                            className="icon-button" 
                                            onClick={(e) => { e.stopPropagation(); setMaximizedChartId(isMaximized ? null : chart.id); }} 
                                            title={isMaximized ? "Minimize" : "Maximize"}
                                        >
                                            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                        </button>
                                    </div>
                                    <ChartViewer config={chart.config} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
