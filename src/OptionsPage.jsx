import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  RefreshCw,
  Check,
  X,
  Settings,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import CheckAccess from './components/CheckAccess';
import './OptionsPage.css';

const OptionsPage = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  
  const [editingField, setEditingField] = useState(null);
  const [newItemValue, setNewItemValue] = useState('');
  const [editingItem, setEditingItem] = useState({ field: null, index: null, value: '' });

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    const token = localStorage.getItem('auth_token');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    if (!['admin', 'dispatcher'].includes(userData.role)) {
      navigate('/unauthorized');
      return;
    }
  }, [navigate]);

  const fieldLabels = {
    gender: 'Пол',
    dismissalReason: 'Причина отчисления',
    socialLeave: 'Социальный отпуск',
    university: 'ВУЗ',
    preparationForm: 'Форма подготовки',
    identityDocument: 'Документ, удостоверяющий личность',
    residence: 'Место проживания',
    medicalCertificate: 'Медицинская справка',
    rivshCertificate: 'Сертификат РИВШ',
    entryByInvitation: 'Въезд по приглашению',
    country: 'Страна',
    departments: 'Кафедры',
    specialtyProfiles: 'Профили специальности'
  };

  const fieldOrder = [
    'gender',
    'dismissalReason',
    'socialLeave',
    'university',
    'preparationForm',
    'identityDocument',
    'residence',
    'medicalCertificate',
    'rivshCertificate',
    'entryByInvitation',
    'country',
    'departments',
    'specialtyProfiles'
  ];

  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const config = {
      method,
      headers,
      credentials: 'include',
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        navigate('/');
        throw new Error('Не авторизован');
      }
      
      if (response.status === 403) {
        navigate('/unauthorized');
        throw new Error('Доступ запрещен');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/options');
      setOptions(data);
    } catch (error) {
      console.error('Error loading options:', error);
      setError('Не удалось загрузить данные. Проверьте соединение с сервером.');
    } finally {
      setLoading(false);
    }
  };

  const saveAllOptions = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiRequest('/options', 'POST', options);
      setSuccessMessage('Все изменения успешно сохранены');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving options:', error);
      setError('Ошибка при сохранении: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addOption = async (field) => {
    if (!newItemValue.trim()) return;

    try {
      setError(null);
      const response = await apiRequest(`/options/${field}/add`, 'POST', { 
        value: newItemValue.trim() 
      });
      
      setOptions(response.data);
      setNewItemValue('');
      setEditingField(null);
      setSuccessMessage(`Значение "${newItemValue}" добавлено в ${fieldLabels[field]}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding option:', error);
      setError('Ошибка при добавлении: ' + error.message);
    }
  };

  const deleteOption = async (field, value) => {
    if (!window.confirm(`Удалить значение "${value}" из списка "${fieldLabels[field]}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await apiRequest(`/options/${field}/${encodeURIComponent(value)}`, 'DELETE');
      
      setOptions(response.data);
      setSuccessMessage(`Значение "${value}" удалено`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting option:', error);
      setError('Ошибка при удалении: ' + error.message);
    }
  };

  const updateOption = async (field, oldValue, newValue) => {
    if (!newValue.trim() || newValue === oldValue) {
      setEditingItem({ field: null, index: null, value: '' });
      return;
    }

    try {
      setError(null);
      
      await apiRequest(`/options/${field}/${encodeURIComponent(oldValue)}`, 'DELETE');
      const response = await apiRequest(`/options/${field}/add`, 'POST', { 
        value: newValue.trim() 
      });
      
      setOptions(response.data);
      setEditingItem({ field: null, index: null, value: '' });
      setSuccessMessage(`Значение изменено с "${oldValue}" на "${newValue}"`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating option:', error);
      setError('Ошибка при обновлении: ' + error.message);
    }
  };

  const resetToDefault = async () => {
    if (!window.confirm('Сбросить все настройки к значениям по умолчанию? Все пользовательские изменения будут потеряны.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await apiRequest('/options/reset', 'POST');
      
      setOptions(response.data);
      setSuccessMessage('Настройки сброшены к значениям по умолчанию');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error resetting options:', error);
      setError('Ошибка при сбросе: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const startEditingItem = (field, index, value) => {
    setEditingItem({ field, index, value });
  };

  const handleDragStart = (field, index) => {
    setDraggedItem({ field, index });
  };

  const handleDragOver = (e, field, targetIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.field !== field || draggedItem.index === targetIndex) {
      return;
    }

    const newOptions = { ...options };
    const items = [...newOptions[field]];
    const [movedItem] = items.splice(draggedItem.index, 1);
    items.splice(targetIndex, 0, movedItem);
    newOptions[field] = items;

    setDraggedItem({ ...draggedItem, index: targetIndex });
    setOptions(newOptions);
  };

  const handleDragEnd = async () => {
    if (!draggedItem) return;

    try {
      setSaving(true);
      await apiRequest('/options', 'POST', options);
      setSuccessMessage('Порядок элементов сохранен');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error saving reordered options:', error);
      setError('Ошибка при сохранении порядка');
      await loadOptions();
    } finally {
      setSaving(false);
      setDraggedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="options-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <CheckAccess allowedRoles={['admin', 'dispatcher']}>
      <div className="options-page">
        <header className="options-header">
          <div className="header-left">
            <button 
              onClick={() => navigate('/main')} 
              className="back-button"
              disabled={saving}
            >
              <ArrowLeft size={20} />
              <span>Назад к таблице</span>
            </button>
          </div>
          
          <div className="header-center">
            <h6>
              <Settings size={28} />
              Редактор выпадающих списков
            </h6>
          </div>
          
          <div className="header-right">
            <button 
              onClick={resetToDefault} 
              className="reset-button" 
              disabled={saving}
            >
              <RefreshCw size={20} />
              <span>Сбросить</span>
            </button>
            <button 
              onClick={saveAllOptions} 
              className="save-button-option" 
              disabled={saving}
            >
              <Save size={20} />
              <span>{saving ? 'Сохранение...' : 'Сохранить все'}</span>
            </button>
          </div>
        </header>

        {successMessage && (
          <div className="global-success-message">
            <Check size={18} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="global-error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="options-grid">
          {fieldOrder.map((field) => (
            <div key={field} className="option-card">
              <div className="card-header">
                <h3>{fieldLabels[field]}</h3>
                <button
                  onClick={() => setEditingField(field)}
                  className="add-button"
                  disabled={saving}
                >
                  <Plus size={18} />
                </button>
              </div>

              {editingField === field && (
                <div className="add-item-form">
                  <input
                    type="text"
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    placeholder="Введите новое значение..."
                    className="add-input"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && addOption(field)}
                    disabled={saving}
                  />
                  <button
                    onClick={() => addOption(field)}
                    className="confirm-add-button"
                    disabled={!newItemValue.trim() || saving}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null);
                      setNewItemValue('');
                    }}
                    className="cancel-add-button"
                    disabled={saving}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="items-list">
                {options && options[field] && options[field].length > 0 ? (
                  options[field].map((item, index) => (
                    <div
                      key={`${field}-${index}`}
                      className={`item-row ${draggedItem?.field === field && draggedItem?.index === index ? 'dragging' : ''}`}
                      draggable={!saving && editingItem.field === null}
                      onDragStart={() => handleDragStart(field, index)}
                      onDragOver={(e) => handleDragOver(e, field, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="drag-handle">
                        <GripVertical size={16} />
                      </div>
                      <span className="item-number">{index + 1}.</span>
                      
                      {editingItem.field === field && editingItem.index === index ? (
                        <div className="edit-item-form">
                          <input
                            type="text"
                            defaultValue={item}
                            className="edit-input"
                            autoFocus
                            onBlur={(e) => updateOption(field, item, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateOption(field, item, e.target.value);
                              }
                            }}
                            disabled={saving}
                          />
                        </div>
                      ) : (
                        <>
                          <span 
                            className="item-value"
                            onClick={() => !saving && startEditingItem(field, index, item)}
                          >
                            {item}
                          </span>
                          <button
                            onClick={() => deleteOption(field, item)}
                            className="delete-button-option"
                            disabled={saving}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-message">
                    Нет элементов. Нажмите + чтобы добавить.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="info-panel">
          <h4>📋 Информация</h4>
          <ul>
            <li>
              <GripVertical size={14} />
              <span>Перетаскивайте элементы за иконку с точками чтобы изменить порядок</span>
            </li>
            <li>Кликните на значение чтобы отредактировать его</li>
            <li>Используйте кнопку + чтобы добавить новое значение</li>
            <li>Все изменения сохраняются на сервере и видны всем пользователям</li>
            <li>Кнопка "Сбросить" вернет все значения к исходным</li>
          </ul>
        </div>
      </div>
    </CheckAccess>
  );
};

export default OptionsPage;