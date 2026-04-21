import React, { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('./USER_GUIDE.md')
        .then(res => res.text())
        .then(text => {
          if (text.includes('<!DOCTYPE html>')) {
            throw new Error('Received HTML instead of Markdown');
          }
          setMarkdown(text);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setMarkdown('### Error\nFailed to load user guide. Ensure `USER_GUIDE.md` exists in the public directory.');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        className="btn-icon"
        onClick={() => setIsOpen(true)}
        title="Help & User Guide"
        style={{ position: 'relative' }}
      >
        <HelpCircle size={20} />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* Modal */}
      <div className="animate-fade-in" style={{
        position: 'fixed',
        top: '5%',
        bottom: '5%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '800px',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--panel-border)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>User Guide</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Complete reference for AGOL Popup Studio
            </p>
          </div>
          <button className="btn-icon" onClick={() => setIsOpen(false)} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Markdown Area */}
        <div className="markdown-body" style={{
          overflowY: 'auto',
          padding: '24px',
          flex: 1,
          color: 'var(--text-primary)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading user guide...</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--panel-border)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          Full documentation is also available as a standalone <code style={{background: 'var(--input-bg)', padding: '2px 4px', borderRadius: '4px'}}>USER_GUIDE.md</code> file in the repository.
        </div>
      </div>
    </>
  );
}
