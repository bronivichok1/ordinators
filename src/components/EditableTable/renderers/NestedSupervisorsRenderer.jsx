import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatDateToDisplay, isValidDate } from '../utils/dateUtils';

const NestedSupervisorsRenderer = ({ rowId, value, data, setData, userData }) => {
  const [editingSupervisors, setEditingSupervisors] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalSupervisors, setOriginalSupervisors] = useState([]);
  const [dateErrors, setDateErrors] = useState({});

  const canEdit = userData?.role === 'admin' || userData?.role === 'dispatcher';

  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      const newValue = Array.isArray(parsed) ? parsed : [];
      const sorted = sortSupervisors(newValue);
      setOriginalSupervisors(sorted);
      setEditingSupervisors(JSON.parse(JSON.stringify(sorted)));
      setHasChanges(false);
    } catch {
      setOriginalSupervisors([]);
      setEditingSupervisors([]);
      setHasChanges(false);
    }
  }, [value]);

  const updateSupervisor = (idx, field, val) => {
    const updated = [...editingSupervisors];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], [field]: val };
      setEditingSupervisors(updated);
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

  const addSupervisor = () => {
    const newSupervisor = { supervisorName: '', position: '', rank: '', startDate: '', endDate: '' };
    const updated = [...editingSupervisors, newSupervisor];
    setEditingSupervisors(updated);
    setHasChanges(true);
  };

  const removeSupervisor = async (idx) => {
    const updated = editingSupervisors.filter((_, i) => i !== idx);
    setEditingSupervisors(updated);
    setHasChanges(updated.length > 0);
    
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const updatedData = [...data];
      const toSave = sortSupervisors(updated);
      updatedData[rowIndex].column33 = JSON.stringify(toSave);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          supervisors: toSave.map(sup => ({
            supervisorName: sup.supervisorName || '',
            position: sup.position || '',
            rank: sup.rank || '',
            startDate: sup.startDate || null,
            endDate: sup.endDate || null
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
        setOriginalSupervisors(toSave);
        setEditingSupervisors(JSON.parse(JSON.stringify(toSave)));
        setHasChanges(false);
        alert('Руководитель успешно удален');
      } catch (error) {
        console.error('Remove error:', error);
        alert('Ошибка при удалении: ' + error.message);
      }
    }
  };

  const saveChanges = async () => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const sorted = sortSupervisors(editingSupervisors);
      const updatedData = [...data];
      updatedData[rowIndex].column33 = JSON.stringify(sorted);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          supervisors: sorted.map(sup => ({
            supervisorName: sup.supervisorName || '',
            position: sup.position || '',
            rank: sup.rank || '',
            startDate: sup.startDate || null,
            endDate: sup.endDate || null
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
        setOriginalSupervisors(sorted);
        setEditingSupervisors(JSON.parse(JSON.stringify(sorted)));
        setHasChanges(false);
        alert('Изменения успешно сохранены');
      } catch (error) {
        console.error('Save error:', error);
        alert('Ошибка при сохранении: ' + error.message);
      }
    }
  };

  const sortSupervisors = (supervisors) => {
    return [...supervisors].sort((a, b) => {
      const dateA = a?.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b?.startDate ? new Date(b.startDate) : new Date(0);
      return dateB - dateA;
    });
  };

  const displaySupervisors = isExpanded ? editingSupervisors : [editingSupervisors[0]].filter(l => l);

  if (editingSupervisors.length === 0) {
    return (
      <div className="nested-cell">
        {canEdit && (
          <button onClick={addSupervisor} className="nested-add-btn">
            <span>Добавить руководителя</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="nested-cell">
      {displaySupervisors.map((sup, idx) => {
        const originalIdx = editingSupervisors.findIndex(l => l === sup);
        return (
          <div key={idx} className={!isExpanded && idx === 0 ? "last-item-row" : "nested-item-row"}>
            <div className="nested-fields-row">
              <input
                type="text"
                className="nested-date-term"
                placeholder="ФИО руководителя"
                value={sup?.supervisorName || ''}
                onChange={(e) => updateSupervisor(originalIdx, 'supervisorName', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className="nested-date-term"
                placeholder="Должность"
                value={sup?.position || ''}
                onChange={(e) => updateSupervisor(originalIdx, 'position', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className="nested-date-term"
                placeholder="Звание"
                value={sup?.rank || ''}
                onChange={(e) => updateSupervisor(originalIdx, 'rank', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-startDate`] ? 'date-error' : ''}`}
                placeholder="Дата начала"
                value={sup?.startDate ? formatDateToDisplay(sup.startDate) : ''}
                onChange={(e) => updateSupervisor(originalIdx, 'startDate', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-endDate`] ? 'date-error' : ''}`}
                placeholder="Дата окончания"
                value={sup?.endDate ? formatDateToDisplay(sup.endDate) : ''}
                onChange={(e) => updateSupervisor(originalIdx, 'endDate', e.target.value)}
                readOnly={!canEdit}
              />
              {canEdit && (
                <button onClick={() => removeSupervisor(originalIdx)} className="nested-remove-btn">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      <div className="nested-actions">
        {editingSupervisors.length > 1 && (
          <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "▲ Свернуть" : `▼ Развернуть (${editingSupervisors.length - 1})`}
          </button>
        )}
        
        {canEdit && (editingSupervisors.length <= 1 || isExpanded) && (
          <button onClick={addSupervisor} className="nested-add-btn">
            <span>Добавить руководителя</span>
          </button>
        )}
        
        {canEdit && hasChanges && (
          <button 
            onClick={saveChanges} 
            className="nested-save-btn"
            disabled={Object.values(dateErrors).some(error => error === true)}
          >
            Сохранить
          </button>
        )}
      </div>
    </div>
  );
};

export default NestedSupervisorsRenderer;