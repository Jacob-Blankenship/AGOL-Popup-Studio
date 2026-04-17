import React, { useState } from 'react';
import ColorPicker from './components/ColorPicker';
import FieldConfigurator from './components/FieldConfigurator';
import LivePreview from './components/LivePreview';
import { generatePythonScript } from './utils/scriptGenerator';
import { Code, Download, Database } from 'lucide-react';

const DEFAULT_COLORS = {
  header_bg: '#0A4757',
  header_text: '#ffffff',
  header_border: '#ffffff',
  row_label_bg: '#00303C',
  row_label_text: '#ffffff',
  row_value_bg: '#0A4757',
  row_value_text: '#ffffff',
  table_border: '#ffffff',
  table_outline: '#ffffff',
  button_bg: '#00303C',
  button_text: '#ffffff',
  button_radius: '6px',
  button_shadow: '0 2px 4px rgba(0,0,0,0.15)'
};

const DEFAULT_ORDER = [
  'project_name',
  'contract_number',
  'status',
  'created_date',
  'source_url',
  'data_download',
  'objectid',
  'shape__area'
];

const SYSTEM_FIELDS_TO_HIDE = [
  "objectid",
  "globalid",
  "shape__area",
  "shape__length",
  "created_user",
  "creator",
  "last_edited_user",
  "last_edited_date"
];

export default function App() {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [fieldOrder, setFieldOrder] = useState(DEFAULT_ORDER);
  const [fieldAliases, setFieldAliases] = useState({});
  const [hideFields, setHideFields] = useState(['objectid', 'shape__area']);
  const [urlFieldHints, setUrlFieldHints] = useState(['source_url', 'data_download']);
  const [urlButtonTexts, setUrlButtonTexts] = useState({});
  const [bulkButtonText, setBulkButtonText] = useState('View Link');
  const [popupHeader, setPopupHeader] = useState('{nickname}');
  
  const [updateMode, setUpdateMode] = useState('single');
  const [targetLayerTitle, setTargetLayerTitle] = useState('');
  
  const [portalConfig, setPortalConfig] = useState({
    portalUrl: 'https://soa-dnr.maps.arcgis.com/',
    username: 'Dewberry_temp',
    password: 'Password_here',
    webmapId: 'd8435a9e295b44fe81f4d6a8f6e45ff8'
  });

  const [schemaUrl, setSchemaUrl] = useState('');
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);

  const handleFetchSchema = async () => {
    if (!schemaUrl) return;
    setIsFetchingSchema(true);
    try {
      const url = new URL(schemaUrl);
      if (!url.searchParams.has('f')) url.searchParams.set('f', 'json');
      
      const res = await fetch(url.toString());
      const data = await res.json();
      
      let fields = [];
      if (data.fields) {
         fields = data.fields.map(f => f.name);
      } else if (data.layers && data.layers[0] && data.layers[0].fields) {
         fields = data.layers[0].fields.map(f => f.name);
      }
      
      if (fields.length > 0) {
        // Completely replace the existing list
        const newFields = fields.map(f => f.toLowerCase());
        setFieldOrder(newFields);
        
        // Setup initial aliases by replacing underscores with spaces and title casing
        const newAliases = {};
        newFields.forEach(f => {
          newAliases[f] = f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        });
        setFieldAliases(newAliases);
        
        // Auto-hide system fields
        const systemFieldsToHide = newFields.filter(f => SYSTEM_FIELDS_TO_HIDE.includes(f));
        setHideFields(systemFieldsToHide);
        
        alert(`Successfully imported ${fields.length} fields!`);
        setSchemaUrl('');
      } else {
        alert('No fields found at this URL. Make sure it points to a layer or service endpoint.');
      }
    } catch (err) {
      alert('Failed to fetch schema. Ensure the URL is public and correct.');
      console.error(err);
    } finally {
      setIsFetchingSchema(false);
    }
  };

  const handleDownload = () => {
    const script = generatePythonScript({ portalConfig, updateMode, targetLayerTitle, colors, hideFields, urlFieldHints, urlButtonTexts, bulkButtonText, fieldOrder, fieldAliases, popupHeader });
    const blob = new Blob([script], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Update_Popups.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const script = generatePythonScript({ portalConfig, updateMode, targetLayerTitle, colors, hideFields, urlFieldHints, urlButtonTexts, bulkButtonText, fieldOrder, fieldAliases, popupHeader });
    navigator.clipboard.writeText(script);
    alert('Copied to clipboard!');
  };

  return (
    <div className="app-container">
      {/* Sidebar Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '4px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, var(--accent), #e0f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AGOL Popup Designer
          </h1>
        </div>

        {/* Mode Selector */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Execution Mode</h3>
          <div style={{ display: 'flex', gap: '20px', marginBottom: updateMode === 'single' ? '16px' : '0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
              <input type="radio" value="single" checked={updateMode === 'single'} onChange={(e) => setUpdateMode(e.target.value)} />
              Single Layer Update
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
              <input type="radio" value="bulk" checked={updateMode === 'bulk'} onChange={(e) => setUpdateMode(e.target.value)} />
              Bulk Map Update
            </label>
          </div>
          
          {updateMode === 'single' && (
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Target Layer Title</label>
              <input 
                type="text" 
                placeholder="e.g. Tax Parcels" 
                value={targetLayerTitle} 
                onChange={e => setTargetLayerTitle(e.target.value)} 
              />
              <span style={{ fontSize: '11px', color: 'var(--accent)' }}>Note: This must be the EXACT same title as it appears in the Web Map contents.</span>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Portal Config</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Portal URL" 
              value={portalConfig.portalUrl} 
              onChange={e => setPortalConfig({...portalConfig, portalUrl: e.target.value})} 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Username" 
                value={portalConfig.username} 
                onChange={e => setPortalConfig({...portalConfig, username: e.target.value})} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={portalConfig.password} 
                onChange={e => setPortalConfig({...portalConfig, password: e.target.value})} 
              />
            </div>
            <input 
              type="text" 
              placeholder="Web Map ID" 
              value={portalConfig.webmapId} 
              onChange={e => setPortalConfig({...portalConfig, webmapId: e.target.value})} 
            />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Import Schema</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', marginTop: 0 }}>
            Pull fields straight from a Service URL to add them to your Master List.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="https://services.arcgis.com/.../0" 
              value={schemaUrl} 
              onChange={e => setSchemaUrl(e.target.value)} 
              style={{ flex: 1 }}
            />
            <button className="btn btn-outline" onClick={handleFetchSchema} disabled={isFetchingSchema}>
              <Database size={16} /> {isFetchingSchema ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Popup Settings</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Header Title (Use {"{field_name}"} for attributes or type plain text)</label>
            <input 
              type="text" 
              placeholder="{nickname}" 
              value={popupHeader} 
              onChange={e => setPopupHeader(e.target.value)} 
            />
          </div>
        </div>

        <ColorPicker colors={colors} onChange={setColors} />

        <FieldConfigurator 
          updateMode={updateMode}
          fieldOrder={fieldOrder} setFieldOrder={setFieldOrder}
          fieldAliases={fieldAliases} setFieldAliases={setFieldAliases}
          hideFields={hideFields} setHideFields={setHideFields}
          urlFieldHints={urlFieldHints} setUrlFieldHints={setUrlFieldHints}
          urlButtonTexts={urlButtonTexts} setUrlButtonTexts={setUrlButtonTexts}
          bulkButtonText={bulkButtonText} setBulkButtonText={setBulkButtonText}
        />

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px', sticky: 'bottom' }}>
          <button className="btn btn-primary" onClick={handleDownload} style={{ flex: 1 }}>
            <Download size={18} /> Download Python
          </button>
          <button className="btn btn-outline" onClick={handleCopy} title="Copy to Clipboard">
            <Code size={18} />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <LivePreview 
        updateMode={updateMode}
        colors={colors} 
        fieldOrder={fieldOrder} 
        fieldAliases={fieldAliases}
        hideFields={hideFields} 
        urlFieldHints={urlFieldHints} 
        urlButtonTexts={urlButtonTexts}
        bulkButtonText={bulkButtonText}
        popupHeader={popupHeader}
      />
    </div>
  );
}
