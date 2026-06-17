import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatDateToDisplay, isValidDate } from '../utils/dateUtils';
import { EXTENSION_TERMS } from '../utils/constants';

const ExtensionsRenderer = ({ rowId, value, data, setData, userData }) => {
  const [editingExtensions, setEditingExtensions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalExtensions, setOriginalExtensions] = useState([]);
  const [dateErrors, setDateErrors] = useState({});

  const canEdit = userData?.role === 'admin' || userData?.role === 'dispatcher';

  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      const newValue = Array.isArray(parsed) ? parsed : [];
      const sorted = sortExtensions(newValue);
      setOriginalExtensions(sorted);
      setEditingExtensions(JSON.parse(JSON.stringify(sorted)));
      setHasChanges(false);
    } catch {
      setOriginalExtensions([]);
      setEditingExtensions([]);
      setHasChanges(false);
    }
  }, [value]);

  const updateExtension = (idx, field, val) => {
    const updated = [...editingExtensions];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], [field]: val };
      setEditingExtensions(updated);
      setHasChanges(true);
    }
    if (field === 'orderDate') {
      if (val && !isValidDate(val)) {
        setDateErrors(prev => ({ ...prev, [`${idx}-${field}`]: true }));
      } else {
        setDateErrors(prev => ({ ...prev, [`${idx}-${field}`]: false }));
      }
    }
  };

  const addExtension = () => {
    const newExtension = { orderNumber: '', orderDate: '', extensionTerm: '1 год' };
    const updated = [...editingExtensions, newExtension];
    setEditingExtensions(updated);
    setHasChanges(true);
  };

  const removeExtension = async (idx) => {
    const updated = editingExtensions.filter((_, i) => i !== idx);
    setEditingExtensions(updated);
    setHasChanges(updated.length > 0);
    
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const updatedData = [...data];
      const toSave = sortExtensions(updated);
      updatedData[rowIndex].column27 = JSON.stringify(toSave);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          extensions: toSave.map(ext => ({
            orderNumber: ext.orderNumber || '',
            orderDate: ext.orderDate || null,
            extensionTerm: ext.extensionTerm || '1 год'
          }))
        };
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/ordinators/${rowId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/';
          return;
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка при удалении');
        }
        setOriginalExtensions(toSave);
        setEditingExtensions(JSON.parse(JSON.stringify(toSave)));
        setHasChanges(false);
        alert('Запись успешно удалена');
      } catch (error) {
        console.error('Remove error:', error);
        alert('Ошибка при удалении: ' + error.message);
      }
    }
  };

  const saveChanges = async () => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const sorted = sortExtensions(editingExtensions);
      const updatedData = [...data];
      updatedData[rowIndex].column27 = JSON.stringify(sorted);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          extensions: sorted.map(ext => ({
            orderNumber: ext.orderNumber || '',
            orderDate: ext.orderDate || null,
            extensionTerm: ext.extensionTerm || '1 год'
          }))
        };
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/ordinators/${rowId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/';
          return;
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка сохранения');
        }
        setOriginalExtensions(sorted);
        setEditingExtensions(JSON.parse(JSON.stringify(sorted)));
        setHasChanges(false);
        alert('Изменения успешно сохранены');
      } catch (error) {
        console.error('Save error:', error);
        alert('Ошибка при сохранении: ' + error.message);
      }
    }
  };

  const sortExtensions = (extensions) => {
    return [...extensions].sort((a, b) => {
      const dateA = a?.orderDate ? new Date(a.orderDate) : new Date(0);
      const dateB = b?.orderDate ? new Date(b.orderDate) : new Date(0);
      return dateB - dateA;
    });
  };

  const displayExtensions = isExpanded ? editingExtensions : [editingExtensions[0]].filter(l => l);

  if (editingExtensions.length === 0) {
    return (
      <div className="nested-cell">
        {canEdit && (
          <button onClick={addExtension} className="nested-add-btn">
            <Plus size={14} />
            <span>Добавить продление</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="nested-cell">
      {displayExtensions.map((ext, idx) => {
        const originalIdx = editingExtensions.findIndex(l => l === ext);
        return (
          <div key={idx} className={!isExpanded && idx === 0 ? "last-item-row" : "nested-item-row"}>
            <div className="nested-fields-row">
              <input
                type="text"
                className="nested-date-term"
                placeholder="Номер приказа"
                value={ext?.orderNumber || ''}
                onChange={(e) => updateExtension(originalIdx, 'orderNumber', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-orderDate`] ? 'date-error' : ''}`}
                placeholder="Дата приказа"
                value={ext?.orderDate ? formatDateToDisplay(ext.orderDate) : ''}
                onChange={(e) => updateExtension(originalIdx, 'orderDate', e.target.value)}
                readOnly={!canEdit}
              />
              <select
                className="nested-term-select"
                value={ext?.extensionTerm || '1 год'}
                onChange={(e) => updateExtension(originalIdx, 'extensionTerm', e.target.value)}
                disabled={!canEdit}
              >
                {EXTENSION_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
              {canEdit && (
                <button onClick={() => removeExtension(originalIdx)} className="nested-remove-btn">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      <div className="nested-actions">
        {editingExtensions.length > 1 && (
          <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "▲ Свернуть" : `▼ Развернуть (${editingExtensions.length - 1})`}
          </button>
        )}
        
        {canEdit && (editingExtensions.length <= 1 || isExpanded) && (
          <button onClick={addExtension} className="nested-add-btn">
            <Plus size={14} />
            <span>Добавить продление</span>
          </button>
        )}

        {canEdit && hasChanges && (
          <button onClick={saveChanges} className="nested-save-btn">
            Сохранить
          </button>
        )}
      </div>
    </div>
  );
};

export default ExtensionsRenderer;