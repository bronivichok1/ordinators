import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatDateToDisplay, isValidDate } from '../utils/dateUtils';

const AllowanceRenderer = ({ rowId, value, data, setData, userData }) => {
  const [editingAllowances, setEditingAllowances] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalAllowances, setOriginalAllowances] = useState([]);
  const [dateErrors, setDateErrors] = useState({});

  const canEdit = userData?.role === 'admin' || userData?.role === 'dispatcher';

  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      const newValue = Array.isArray(parsed) ? parsed : [];
      const sorted = sortAllowances(newValue);
      setOriginalAllowances(sorted);
      setEditingAllowances(JSON.parse(JSON.stringify(sorted)));
      setHasChanges(false);
    } catch {
      setOriginalAllowances([]);
      setEditingAllowances([]);
      setHasChanges(false);
    }
  }, [value]);

  const updateAllowance = (idx, field, val) => {
    const updated = [...editingAllowances];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], [field]: val };
      setEditingAllowances(updated);
      setHasChanges(true);
    }
    if (field === 'startDate' || field === 'endDate') {
      if (val && !isValidDate(val)) {
        setDateErrors(prev => ({ ...prev, [`${idx}-${field}`]: true }));
      } else {
        setDateErrors(prev => ({ ...prev, [`${idx}-${field}`]: false }));
      }
    }
  };

  const addAllowance = () => {
    const newAllowance = { orderNumber: '', startDate: '', endDate: '' };
    const updated = [...editingAllowances, newAllowance];
    setEditingAllowances(updated);
    setHasChanges(true);
  };

  const removeAllowance = async (idx) => {
    const updated = editingAllowances.filter((_, i) => i !== idx);
    setEditingAllowances(updated);
    setHasChanges(updated.length > 0);
    
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const updatedData = [...data];
      const toSave = sortAllowances(updated);
      updatedData[rowIndex].column36 = JSON.stringify(toSave);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          allowances: toSave.map(item => ({
            orderNumber: item.orderNumber || '',
            startDate: item.startDate || null,
            endDate: item.endDate || null
          }))
        };
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/ordinators/${rowId}`, {
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
        setOriginalAllowances(toSave);
        setEditingAllowances(JSON.parse(JSON.stringify(toSave)));
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
      const sorted = sortAllowances(editingAllowances);
      const updatedData = [...data];
      updatedData[rowIndex].column36 = JSON.stringify(sorted);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          allowances: sorted.map(item => ({
            orderNumber: item.orderNumber || '',
            startDate: item.startDate || null,
            endDate: item.endDate || null
          }))
        };
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/ordinators/${rowId}`, {
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
        setOriginalAllowances(sorted);
        setEditingAllowances(JSON.parse(JSON.stringify(sorted)));
        setHasChanges(false);
        alert('Изменения успешно сохранены');
      } catch (error) {
        console.error('Save error:', error);
        alert('Ошибка при сохранении: ' + error.message);
      }
    }
  };

  const sortAllowances = (allowances) => {
    return [...allowances].sort((a, b) => {
      const dateA = a?.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b?.startDate ? new Date(b.startDate) : new Date(0);
      return dateB - dateA;
    });
  };

  const displayAllowances = isExpanded ? editingAllowances : [editingAllowances[0]].filter(l => l);

  if (editingAllowances.length === 0) {
    return (
      <div className="nested-cell">
        {canEdit && (
          <button onClick={addAllowance} className="nested-add-btn">
            <span>Добавить</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="nested-cell">
      {displayAllowances.map((item, idx) => {
        const originalIdx = editingAllowances.findIndex(l => l === item);
        return (
          <div key={idx} className={!isExpanded && idx === 0 ? "last-item-row" : "nested-item-row"}>
            <div className="nested-fields-row">
              <input
                type="text"
                className="nested-date-term"
                placeholder="Номер приказа"
                value={item?.orderNumber || ''}
                onChange={(e) => updateAllowance(originalIdx, 'orderNumber', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-startDate`] ? 'date-error' : ''}`}
                placeholder="Дата начала"
                value={item?.startDate ? formatDateToDisplay(item.startDate) : ''}
                onChange={(e) => updateAllowance(originalIdx, 'startDate', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-endDate`] ? 'date-error' : ''}`}
                placeholder="Дата окончания"
                value={item?.endDate ? formatDateToDisplay(item.endDate) : ''}
                onChange={(e) => updateAllowance(originalIdx, 'endDate', e.target.value)}
                readOnly={!canEdit}
              />
              {canEdit && (
                <button onClick={() => removeAllowance(originalIdx)} className="nested-remove-btn">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      <div className="nested-actions">
        {editingAllowances.length > 1 && (
          <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "▲ Свернуть" : `▼ Развернуть (${editingAllowances.length - 1})`}
          </button>
        )}
        
        {canEdit && (editingAllowances.length <= 1 || isExpanded) && (
          <button onClick={addAllowance} className="nested-add-btn">
            <span>Добавить</span>
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

export default AllowanceRenderer;