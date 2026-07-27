import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { Plus, Trash2 } from 'lucide-react';
import { formatDateToDisplay, isValidDate } from '../utils/dateUtils';

const NestedSocialLeaveRenderer = ({ rowId, value, data, setData, userData }) => {
  const [editingLeaves, setEditingLeaves] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalLeaves, setOriginalLeaves] = useState([]);
  const [socialLeaveOptions, setSocialLeaveOptions] = useState([]);
  const [dateErrors, setDateErrors] = useState({});

  const canEdit = userData?.role === 'admin' || userData?.role === 'dispatcher';

  useEffect(() => {
    loadSocialLeaveOptions();
  }, []);

  const loadSocialLeaveOptions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/options`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSocialLeaveOptions(data.socialLeave || [
        'по беременности и родам',
        'по уходу за ребёнком',
        'мед показаниям',
        'служба в армии'
      ]);
    } catch (error) {
      console.error('Error loading social leave options:', error);
      setSocialLeaveOptions([
        'по беременности и родам',
        'по уходу за ребёнком',
        'мед показаниям',
        'служба в армии'
      ]);
    }
  };

  const addCustomSocialLeaveOption = async (value) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/options/socialLeave/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      if (response.ok) {
        await loadSocialLeaveOptions();
      }
    } catch (error) {
      console.error('Error adding custom social leave option:', error);
    }
  };

  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      const newValue = Array.isArray(parsed) ? parsed : [];
      const sorted = sortLeaves(newValue);
      setOriginalLeaves(sorted);
      setEditingLeaves(JSON.parse(JSON.stringify(sorted)));
      setHasChanges(false);
    } catch {
      setOriginalLeaves([]);
      setEditingLeaves([]);
      setHasChanges(false);
    }
  }, [value]);

  const updateLeave = (idx, field, val) => {
    const updated = [...editingLeaves];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], [field]: val };
      setEditingLeaves(updated);
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

  const addLeave = () => {
    const newLeave = { startDate: '', endDate: '', reason: '' };
    const updated = [...editingLeaves, newLeave];
    setEditingLeaves(updated);
    setHasChanges(true);
  };

  const removeLeave = async (idx) => {
    const updated = editingLeaves.filter((_, i) => i !== idx);
    setEditingLeaves(updated);
    setHasChanges(updated.length > 0);
    
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const updatedData = [...data];
      const toSave = sortLeaves(updated);
      updatedData[rowIndex].column9 = JSON.stringify(toSave);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          socialLeaves: toSave.map(leave => ({
            startDate: leave.startDate || null,
            endDate: leave.endDate || null,
            reason: leave.reason || ''
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
        setOriginalLeaves(toSave);
        setEditingLeaves(JSON.parse(JSON.stringify(toSave)));
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
      const sorted = sortLeaves(editingLeaves);
      const updatedData = [...data];
      updatedData[rowIndex].column9 = JSON.stringify(sorted);
      setData(updatedData);
      
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          socialLeaves: sorted.map(leave => ({
            startDate: leave.startDate || null,
            endDate: leave.endDate || null,
            reason: leave.reason || ''
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
        setOriginalLeaves(sorted);
        setEditingLeaves(JSON.parse(JSON.stringify(sorted)));
        setHasChanges(false);
        alert('Изменения успешно сохранены');
      } catch (error) {
        console.error('Save error:', error);
        alert('Ошибка при сохранении: ' + error.message);
      }
    }
  };

  const sortLeaves = (leaves) => {
    return [...leaves].sort((a, b) => {
      const dateA = a?.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b?.startDate ? new Date(b.startDate) : new Date(0);
      return dateB - dateA;
    });
  };

  const displayLeaves = isExpanded ? editingLeaves : [editingLeaves[0]].filter(l => l);

  if (editingLeaves.length === 0) {
    return (
      <div className="nested-cell">
        {canEdit && (
          <button onClick={addLeave} className="nested-add-btn">
            <span>Добавить</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="nested-cell">
      {displayLeaves.map((leave, idx) => {
        const originalIdx = editingLeaves.findIndex(l => l === leave);
        const options = socialLeaveOptions.map(option => ({ value: option, label: option }));
        return (
          <div key={idx} className={!isExpanded && idx === 0 ? "last-item-row" : "nested-item-row"}>
            <div className="nested-fields-row">
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-startDate`] ? 'date-error' : ''}`}
                placeholder="Дата начала"
                value={leave?.startDate ? formatDateToDisplay(leave.startDate) : ''}
                onChange={(e) => updateLeave(originalIdx, 'startDate', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-endDate`] ? 'date-error' : ''}`}
                placeholder="Дата окончания"
                value={leave?.endDate ? formatDateToDisplay(leave.endDate) : ''}
                onChange={(e) => updateLeave(originalIdx, 'endDate', e.target.value)}
                readOnly={!canEdit}
              />
              {canEdit ? (
                <div className="nested-select-wrapper">
                  <CreatableSelect
                    options={options}
                    value={leave?.reason ? { value: leave.reason, label: leave.reason } : null}
                    onChange={(option) => {
                      if (option) {
                        updateLeave(originalIdx, 'reason', option.value);
                      } else {
                        updateLeave(originalIdx, 'reason', '');
                      }
                    }}
                    isClearable
                    placeholder="Причина"
                    noOptionsMessage={() => "Нет вариантов, введите свою причину"}
                    formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
                    onCreateOption={(inputValue) => {
                      addCustomSocialLeaveOption(inputValue);
                      updateLeave(originalIdx, 'reason', inputValue);
                    }}
                    className="react-select-nested"
                    classNamePrefix="react-select-nested"
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  />
                </div>
              ) : (
                <div className="nested-select-wrapper readonly-value">{leave?.reason || '—'}</div>
              )}
              {canEdit && (
                <button onClick={() => removeLeave(originalIdx)} className="nested-remove-btn">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      <div className="nested-actions">
        {editingLeaves.length > 1 && (
          <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "▲ Свернуть" : `▼ Развернуть (${editingLeaves.length - 1})`}
          </button>
        )}
        
        {canEdit && (editingLeaves.length <= 1 || isExpanded) && (
          <button onClick={addLeave} className="nested-add-btn">
            <span>Добавить</span>
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

export default NestedSocialLeaveRenderer;