import React from 'react';

export default function ChartConfigurator({ columns, config, setConfig }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>Chart Configuration</h2>
      
      <div className="form-group">
        <label>Visualization Type</label>
        <select name="chart_type" value={config.chart_type} onChange={handleChange}>
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
      </div>

      <div className="form-group">
        <label>Dimension (Group By / X-Axis)</label>
        <select name="dimension" value={config.dimension} onChange={handleChange}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Metric (Measure / Y-Axis)</label>
        <select name="metric" value={config.metric} onChange={handleChange}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label>Aggregation</label>
          <select name="metric_agg" value={config.metric_agg} onChange={handleChange}>
            <option value="sum">Sum</option>
            <option value="mean">Average</option>
            <option value="count">Count</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Row Limit</label>
          <input 
            type="number" 
            name="limit" 
            value={config.limit} 
            onChange={handleChange} 
            min="1"
          />
        </div>
      </div>
    </div>
  );
}
