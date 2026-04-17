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

export default function ColorPicker({ colors, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...colors, [key]: value });
  };

  return (
    <div className="panel" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Popup Theming</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {Object.entries(colors).map(([key, value]) => {
          if (!COLOR_LABELS[key]) return null;
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', cursor: 'pointer', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
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
