import React, { useState, useEffect } from 'react';
import ColorPicker from './components/ColorPicker';
import FieldConfigurator from './components/FieldConfigurator';
import LivePreview from './components/LivePreview';
import { generatePythonScript } from './utils/scriptGenerator';
import { Code, Download, Database, Moon, Sun } from 'lucide-react';

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
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [fieldOrder, setFieldOrder] = useState(DEFAULT_ORDER);
  const [fieldAliases, setFieldAliases] = useState({});
  const [hideFields, setHideFields] = useState(['objectid', 'shape__area']);
  const [urlFieldHints, setUrlFieldHints] = useState(['source_url', 'data_download']);
  const [urlButtonTexts, setUrlButtonTexts] = useState({});
  const [bulkButtonText, setBulkButtonText] = useState('View Link');
  const [popupHeader, setPopupHeader] = useState('{nickname}');
  const [popupAlign, setPopupAlign] = useState('center');
  const [popupFontFamily, setPopupFontFamily] = useState('Microsoft YaHei, sans-serif');
  
  const [updateMode, setUpdateMode] = useState('single');
  const [targetLayerTitle, setTargetLayerTitle] = useState('');
  
  const [portalConfig, setPortalConfig] = useState({
    portalUrl: '',
    username: '',
    webmapId: ''
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
      
      let fieldsData = [];
      if (data.fields) {
         fieldsData = data.fields;
      } else if (data.layers && data.layers[0] && data.layers[0].fields) {
         fieldsData = data.layers[0].fields;
      }
      
      if (fieldsData.length > 0) {
        // Completely replace the existing list
        const newFields = fieldsData.map(f => f.name.toLowerCase());
        setFieldOrder(newFields);
        
        // Setup initial aliases
        const newAliases = {};
        fieldsData.forEach(f => {
          const lowerName = f.name.toLowerCase();
          if (f.alias && f.alias !== f.name && f.alias !== '') {
            newAliases[lowerName] = f.alias;
          } else {
            newAliases[lowerName] = lowerName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
        });
        setFieldAliases(newAliases);
        
        // Auto-hide system fields
        const systemFieldsToHide = newFields.filter(f => SYSTEM_FIELDS_TO_HIDE.includes(f));
        setHideFields(systemFieldsToHide);
        
        alert(`Successfully imported ${fieldsData.length} fields!`);
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
    const script = generatePythonScript({ portalConfig, updateMode, targetLayerTitle, colors, hideFields, urlFieldHints, urlButtonTexts, bulkButtonText, fieldOrder, fieldAliases, popupHeader, popupAlign, popupFontFamily });
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
    const script = generatePythonScript({ portalConfig, updateMode, targetLayerTitle, colors, hideFields, urlFieldHints, urlButtonTexts, bulkButtonText, fieldOrder, fieldAliases, popupHeader, popupAlign, popupFontFamily });
    navigator.clipboard.writeText(script);
    alert('Copied to clipboard!');
  };

  return (
    <div className="app-container">
      {/* Sidebar Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '4px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            AGOL Popup Studio
          </h1>
          <button 
            className="btn-icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Mode Selector */}
        <div className="panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Execution Mode</h3>
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

        <div className="panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>AGOL Config</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AGOL URL</label>
              <input 
                type="text" 
                placeholder="https://your-agol.maps.arcgis.com/" 
                value={portalConfig.portalUrl} 
                onChange={e => setPortalConfig({...portalConfig, portalUrl: e.target.value})} 
              />
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Username</label>
              <input 
                type="text" 
                placeholder="Enter Username" 
                value={portalConfig.username} 
                onChange={e => setPortalConfig({...portalConfig, username: e.target.value})} 
              />
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Web Map Item ID</label>
              <input 
                type="text" 
                placeholder="Enter 32-character Web Map ID" 
                value={portalConfig.webmapId} 
                onChange={e => setPortalConfig({...portalConfig, webmapId: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Import Schema</h3>
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

        <div className="panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Popup Settings</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Header Title (Use {"{field_name}"} for attributes)</label>
              <input 
                type="text" 
                placeholder="{nickname}" 
                value={popupHeader} 
                onChange={e => setPopupHeader(e.target.value)} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '4px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Header Alignment</label>
                <select 
                  value={popupAlign} 
                  onChange={e => setPopupAlign(e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div style={{ display: 'grid', gap: '4px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Font Architecture</label>
                <select 
                  value={popupFontFamily} 
                  onChange={e => setPopupFontFamily(e.target.value)}
                >
                  <option value="Microsoft YaHei, sans-serif">Microsoft YaHei (Default Arc)</option>
                  <option value="Inter, system-ui, sans-serif">Inter (Modern Sans)</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Courier New', Courier, monospace">Courier New (Monospace)</option>
                </select>
              </div>
            </div>
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

        <div className="panel" style={{ padding: '24px', display: 'flex', gap: '12px', sticky: 'bottom' }}>
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
        popupAlign={popupAlign}
        popupFontFamily={popupFontFamily}
      />
    </div>
  );
}
