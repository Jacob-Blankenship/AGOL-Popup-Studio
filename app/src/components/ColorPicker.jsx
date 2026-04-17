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
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Color Palette</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {Object.entries(colors).map(([key, value]) => {
          if (!COLOR_LABELS[key]) return null;
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input 
                type="color" 
                value={value} 
                onChange={(e) => handleChange(key, e.target.value)}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{COLOR_LABELS[key]}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
