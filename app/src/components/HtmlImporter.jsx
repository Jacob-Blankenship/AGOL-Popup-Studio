import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { parseStudioHtml } from '../utils/htmlParser';

export default function HtmlImporter({ onImport }) {
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success'|'warn'|'error', message }

  const handleImport = () => {
    if (!html.trim()) {
      setStatus({ type: 'error', message: 'Please paste some HTML first.' });
      return;
    }
    try {
      const result = parseStudioHtml(html);

      if (result.fieldOrder.length === 0) {
        setStatus({ type: 'error', message: 'No fields found. Make sure you pasted the full popup HTML.' });
        return;
      }

      onImport(result);
      setHtml('');

      const count = result.fieldOrder.length;
      if (!result.hasMarker) {
        setStatus({
          type: 'warn',
          message: `⚠ No Studio marker — ${count} fields imported, colors defaulted to current template.`,
        });
      } else {
        setStatus({ type: 'success', message: `✓ Imported ${count} fields, colors, and settings.` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Parse failed. Ensure you pasted the raw popup HTML source.' });
      console.error(err);
    }
  };

  const statusColors = {
    success: 'var(--success)',
    warn: '#f59e0b',
    error: 'var(--danger)',
  };

  return (
    <div className="panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Import from Previous Run</h3>
        {html && (
          <button className="btn-icon" onClick={() => { setHtml(''); setStatus(null); }} title="Clear">
            <X size={14} />
          </button>
        )}
      </div>

      <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Paste the popup HTML from a previous Studio-generated script to instantly restore all fields, colors, and settings.
      </p>

      <textarea
        rows={5}
        value={html}
        onChange={e => { setHtml(e.target.value); setStatus(null); }}
        placeholder="Paste <!-- AGOL_POPUP_STUDIO --> HTML here..."
        style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', resize: 'vertical', lineHeight: 1.5 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
        <button
          className="btn btn-primary"
          onClick={handleImport}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Upload size={15} /> Import
        </button>

        {status && (
          <span style={{ fontSize: '13px', color: statusColors[status.type] }}>
            {status.message}
          </span>
        )}
      </div>
    </div>
  );
}
