import React from 'react';

const COLOR_LABELS = {
  header_bg: 'Header Background',
  header_text: 'Header Text',
  header_border: 'Header Border',
  row_label_bg: 'Row Label Background',
  row_label_text: 'Row Label Text',
  row_value_bg: 'Row Value Background',
  row_value_text: 'Row Value Text',
  table_border: 'Table Border',
  table_outline: 'Table Outline',
  button_bg: 'Button Background',
  button_text: 'Button Text'
};

export const POPUP_TEMPLATES = {
  originalTeal: {
    name: 'Dark Teal (Original)',
    colors: {
      header_bg: '#0A4757', header_text: '#ffffff', header_border: '#ffffff',
      row_label_bg: '#00303C', row_label_text: '#ffffff',
      row_value_bg: '#0A4757', row_value_text: '#ffffff',
      table_border: '#ffffff', table_outline: '#ffffff',
      button_bg: '#00303C', button_text: '#ffffff',
      button_radius: '6px', button_shadow: '0 2px 4px rgba(0,0,0,0.15)'
    }
  },
  cleanSlate: {
    name: 'Clean Slate',
    colors: {
      header_bg: '#0f172a', header_text: '#ffffff', header_border: '#334155',
      row_label_bg: '#f8fafc', row_label_text: '#475569',
      row_value_bg: '#ffffff', row_value_text: '#0f172a',
      table_border: '#e2e8f0', table_outline: '#cbd5e1',
      button_bg: '#0284c7', button_text: '#ffffff',
      button_radius: '4px', button_shadow: '0 1px 2px rgba(0,0,0,0.05)'
    }
  },
  simpleWhite: {
    name: 'Simple White',
    colors: {
      header_bg: '#ffffff', header_text: '#111827', header_border: '#d1d5db',
      row_label_bg: '#f9fafb', row_label_text: '#374151',
      row_value_bg: '#ffffff', row_value_text: '#111827',
      table_border: '#d1d5db', table_outline: '#9ca3af',
      button_bg: '#111827', button_text: '#ffffff',
      button_radius: '4px', button_shadow: 'none'
    }
  }
};

export default function ColorPicker({ colors, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...colors, [key]: value });
  };

  return (
    <div className="panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Popup Theming</h3>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Presets</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(POPUP_TEMPLATES).map(([key, tpl]) => (
            <button 
              key={key} 
              className="btn btn-outline" 
              onClick={() => onChange(tpl.colors)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Custom Override</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {Object.entries(colors).map(([key, value]) => {
          if (!COLOR_LABELS[key]) return null;
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', cursor: 'pointer', background: 'var(--input-bg)', padding: '8px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
              <input 
                type="color" 
                value={value} 
                onChange={(e) => handleChange(key, e.target.value)}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{COLOR_LABELS[key]}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
