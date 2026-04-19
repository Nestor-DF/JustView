import React from 'react';

function CommonConfigurator({ config, setConfig }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, common: { ...prev.common, [name]: value } }));
  };

  return (
    <div className="form-group">
      <label>Row Limit</label>
      <input 
        type="number" 
        name="limit" 
        value={config.common?.limit || 100} 
        onChange={handleChange} 
        min="1"
      />
    </div>
  );
}

function BarLineConfigurator({ columns, config, setConfig }) {
  const specific = config.specific || {};
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, specific: { ...prev.specific, [name]: value } }));
  };

  return (
    <>
      <div className="form-group">
        <label>X-Axis (Dimension)</label>
        <select name="x_axis" value={specific.x_axis || ''} onChange={handleChange}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Y-Axis (Metric)</label>
        <select name="y_axis" value={specific.y_axis || ''} onChange={handleChange} disabled={specific.aggregation === 'count'}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        {specific.aggregation === 'count' && <div style={{fontSize:'11px', color:'#888', marginTop:'4px'}}>Ignorado al contar.</div>}
      </div>
      <div className="form-group">
        <label>Aggregation</label>
        <select name="aggregation" value={specific.aggregation || 'sum'} onChange={handleChange}>
          <option value="sum">Sum</option>
          <option value="mean">Average</option>
          <option value="count">Count</option>
          <option value="min">Min</option>
          <option value="max">Max</option>
        </select>
      </div>
      {config.chart_type === 'line' && (
        <div className="form-group">
          <label>Time Granularity</label>
          <select name="time_granularity" value={specific.time_granularity || 'none'} onChange={handleChange}>
            <option value="none">None (Raw/Default)</option>
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
      )}
    </>
  );
}

function PieConfigurator({ columns, config, setConfig }) {
  const specific = config.specific || {};
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, specific: { ...prev.specific, [name]: value } }));
  };

  return (
    <>
      <div className="form-group">
        <label>Category (Wedges)</label>
        <select name="category" value={specific.category || ''} onChange={handleChange}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Value (Size)</label>
        <select name="value" value={specific.value || ''} onChange={handleChange} disabled={specific.aggregation === 'count'}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        {specific.aggregation === 'count' && <div style={{fontSize:'11px', color:'#888', marginTop:'4px'}}>Ignorado al contar.</div>}
      </div>
      <div className="form-group">
        <label>Aggregation</label>
        <select name="aggregation" value={specific.aggregation || 'sum'} onChange={handleChange}>
          <option value="sum">Sum</option>
          <option value="mean">Average</option>
          <option value="count">Count</option>
          <option value="min">Min</option>
          <option value="max">Max</option>
        </select>
      </div>
    </>
  );
}

export default function ChartConfigurator({ columns, config, setConfig }) {
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    
    // Generate default specific config based on type
    const defaultCol1 = columns.length > 0 ? columns[0] : '';
    const defaultCol2 = columns.length > 0 ? columns[columns.length - 1] : '';
    
    let newSpecific = {};
    if (newType === 'bar' || newType === 'line') {
      newSpecific = { x_axis: defaultCol1, y_axis: defaultCol2, aggregation: 'sum' };
      if (newType === 'line') newSpecific.time_granularity = 'none';
    } else if (newType === 'pie') {
      newSpecific = { category: defaultCol1, value: defaultCol2, aggregation: 'sum' };
    }

    setConfig(prev => ({ 
      ...prev, 
      chart_type: newType, 
      specific: newSpecific 
    }));
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>Chart Configuration</h2>
      
      <div className="form-group">
        <label>Visualization Type</label>
        <select name="chart_type" value={config.chart_type} onChange={handleTypeChange}>
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
      </div>

      <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />
      
      <h3 style={{ fontSize: '13px', marginBottom: '10px', color: '#666' }}>Specific Configuration</h3>
      {(config.chart_type === 'bar' || config.chart_type === 'line') && (
        <BarLineConfigurator columns={columns} config={config} setConfig={setConfig} />
      )}
      {config.chart_type === 'pie' && (
        <PieConfigurator columns={columns} config={config} setConfig={setConfig} />
      )}

      <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />

      <h3 style={{ fontSize: '13px', marginBottom: '10px', color: '#666' }}>Common Configuration</h3>
      <CommonConfigurator config={config} setConfig={setConfig} />
    </div>
  );
}
