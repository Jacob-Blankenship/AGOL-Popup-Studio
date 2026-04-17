import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, EyeOff, Eye, Link } from 'lucide-react';

function SortableField({ id, alias, updateAlias, urlButtonText, updateUrlButtonText, isHidden, isUrlToken, toggleHidden, toggleUrl }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '10px 14px',
    margin: '8px 0',
    background: '#ffffff',
    border: '1px solid var(--panel-border)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: isHidden ? 'var(--text-secondary)' : 'var(--text-primary)',
    opacity: isHidden ? 0.6 : 1,
    zIndex: 1
  };

  return (
    <div ref={setNodeRef} style={style}>
      <button {...attributes} {...listeners} className="btn-icon" style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GripVertical size={16} />
      </button>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>{id}</span>
        <input 
            type="text" 
            value={alias || id} 
            onChange={(e) => updateAlias(id, e.target.value)} 
            style={{ 
              padding: '2px 0', 
              fontSize: '14px', 
              background: 'transparent', 
              border: 'none', 
              color: 'inherit', 
              outline: 'none',
              fontFamily: 'inherit',
              borderBottom: '1px dashed var(--panel-border)',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderBottom = '1px solid var(--accent)'}
            onBlur={(e) => e.target.style.borderBottom = '1px dashed var(--panel-border)'}
        />
      </div>
      
      {isUrlToken && (
        <input 
          type="text" 
          value={urlButtonText || 'View'} 
          onChange={(e) => updateUrlButtonText(id, e.target.value)} 
          placeholder="Button Text"
          style={{ width: '80px', fontSize: '12px', padding: '6px 8px', background: '#f8fafc', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', borderRadius: '4px', outline: 'none' }}
        />
      )}
      
      <button 
        onClick={() => toggleUrl(id)} 
        className="btn-icon" 
        style={{ color: isUrlToken ? 'var(--accent)' : 'inherit', background: isUrlToken ? 'var(--accent-light)' : 'transparent' }}
        title="Mark as URL Field (Button)"
      >
        <Link size={16} />
      </button>
      
      <button 
        onClick={() => toggleHidden(id)} 
        className="btn-icon"
        title="Toggle Visibility"
      >
        {isHidden ? <EyeOff size={16} color="var(--danger)" /> : <Eye size={16} color="var(--success)" />}
      </button>
    </div>
  );
}

export default function FieldConfigurator({ updateMode, fieldOrder, setFieldOrder, fieldAliases, setFieldAliases, hideFields, setHideFields, urlFieldHints, setUrlFieldHints, urlButtonTexts, setUrlButtonTexts, bulkButtonText, setBulkButtonText }) {
  const [newField, setNewField] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFieldOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleHidden = (id) => {
    if (hideFields.includes(id)) {
      setHideFields(hideFields.filter(f => f !== id));
    } else {
      setHideFields([...hideFields, id]);
    }
  };

  const toggleUrl = (id) => {
    if (urlFieldHints.includes(id)) {
      setUrlFieldHints(urlFieldHints.filter(f => f !== id));
    } else {
      setUrlFieldHints([...urlFieldHints, id]);
    }
  };

  const handleAddField = () => {
    if (newField && !fieldOrder.includes(newField)) {
        const lf = newField.toLowerCase();
        setFieldOrder([...fieldOrder, lf]);
        
        // Auto format alias
        const formattedAlias = lf.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setFieldAliases({...fieldAliases, [lf]: formattedAlias});
        
        setNewField('');
    }
  };

  const updateAlias = (id, newAlias) => {
    setFieldAliases({ ...fieldAliases, [id]: newAlias });
  };

  const updateUrlButtonText = (id, newText) => {
    setUrlButtonTexts({ ...urlButtonTexts, [id]: newText });
  };

  if (updateMode === 'bulk') {
    return (
      <div className="panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Bulk Configuration</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Define comma-separated lists of substrings. Any field name containing these strings will be globally hidden or treated as a URL link across all layers.
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Globally Hidden Fields (e.g. objectid, shape)</label>
            <textarea 
              rows={3} 
              value={hideFields.join(', ')} 
              onChange={e => setHideFields(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>URL Field Hints (e.g. url, link, website)</label>
            <textarea 
              rows={3} 
              value={urlFieldHints.join(', ')} 
              onChange={e => setUrlFieldHints(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Global Link Button Text</label>
            <input 
              type="text" 
              value={bulkButtonText} 
              onChange={e => setBulkButtonText(e.target.value)} 
              placeholder="e.g. View Link"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Field Configuration</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Drag to reorder master list. Hide/unhide fields. Mark URL fields to generate buttons.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input 
          type="text" 
          value={newField} 
          onChange={(e) => setNewField(e.target.value)} 
          placeholder="Add sample field name..." 
          onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
        />
        <button className="btn btn-outline" onClick={handleAddField}>Add</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fieldOrder} strategy={verticalListSortingStrategy}>
          {fieldOrder.map(id => (
            <SortableField 
              key={id} id={id} 
              alias={fieldAliases[id] || id}
              updateAlias={updateAlias}
              urlButtonText={urlButtonTexts ? urlButtonTexts[id] : ''}
              updateUrlButtonText={updateUrlButtonText}
              isHidden={hideFields.includes(id)} 
              isUrlToken={urlFieldHints.includes(id)}
              toggleHidden={toggleHidden} 
              toggleUrl={toggleUrl} 
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
