import React from 'react';

const MOCK_DATA = {
  project_name: 'Dewberry Project Alpha',
  created_date: '04/16/2026',
  source_url: 'https://example.com/report',
  status: 'Active',
  objectid: 9942,
  contract_number: 'C-204-11',
  data_download: 'https://example.com/download'
};

export default function LivePreview({ updateMode, colors, fieldOrder, hideFields, urlFieldHints, popupHeader = '{nickname}', fieldAliases = {}, urlButtonTexts = {}, bulkButtonText = 'View' }) {
  // Only use fields that are not hidden. We will show placeholders if MOCK_DATA misses them.
  const visibleFields = fieldOrder.filter(f => !hideFields.includes(f));

  // Determine what to show in the header
  const displayHeader = popupHeader.replace(/\\{([^}]+)\\}/g, (match, key) => {
    const k = key.toLowerCase();
    return MOCK_DATA[k] !== undefined ? MOCK_DATA[k] : `[Sample ${key}]`;
  });

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--panel-border)' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Live Simulation</h3>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Real-time preview of the resulting ArcGIS map popup.
        </p>
      </div>

      <div className="preview-map-bg" style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
        
        {/* Mock ArcGIS Window Bubble */}
        <div className="animate-fade-in" style={{
          width: '100%',
          maxWidth: '360px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          fontFamily: 'Microsoft YaHei, sans-serif'
        }}>
          {/* Default Title that Python script injects */}
          <div style={{
            background: colors.header_bg,
            color: colors.header_text,
            padding: '6px 10px',
            fontSize: '18px',
            fontWeight: 700,
            textTransform: 'uppercase',
            border: `2px solid ${colors.header_border}`,
            borderBottom: `2px solid ${colors.header_border}`,
            borderRadius: '8px 8px 0 0',
            textAlign: 'center'
          }}>
            {displayHeader}
          </div>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: `2px solid ${colors.table_outline}`,
            borderTop: 'none'
          }}>
            <tbody>
              {visibleFields.map((field) => {
                const isUrl = urlFieldHints.includes(field);
                const aliasTitle = fieldAliases[field] || field.replace(/_/g, ' ');
                return (
                  <tr key={field}>
                    <td style={{
                      padding: '6px 8px',
                      width: '40%',
                      background: colors.row_label_bg,
                      borderBottom: `1px solid ${colors.table_border}`,
                      fontWeight: 600,
                      color: colors.row_label_text,
                      fontSize: '14px'
                    }}>
                      {aliasTitle}
                    </td>
                    <td style={{
                      padding: '6px 8px',
                      background: colors.row_value_bg,
                      borderBottom: `1px solid ${colors.table_border}`,
                      color: colors.row_value_text,
                      fontSize: '14px'
                    }}>
                      {isUrl ? (
                        <a href={MOCK_DATA[field] || '#'} target="_blank" rel="noreferrer" style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          background: colors.button_bg,
                          color: colors.button_text,
                          textDecoration: 'none',
                          borderRadius: colors.button_radius,
                          boxShadow: colors.button_shadow
                        }}>{updateMode === 'bulk' ? bulkButtonText : (urlButtonTexts[field] || 'View')}</a>
                      ) : (
                        MOCK_DATA[field] !== undefined ? MOCK_DATA[field] : `[Sample ${field}]`
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleFields.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    All fields are hidden or no data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
