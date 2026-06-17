import React, { useState, useEffect, useRef } from 'react';
import CreatableSelect from 'react-select/creatable';
import { COLUMN_NAMES } from '../utils/constants';
import { isValidDate, formatDateToDisplay } from '../utils/dateUtils';

const InlineCellEditor = ({ 
  editingCell, 
  editValue, 
  setEditValue, 
  onSave, 
  onCancel,
  selectData,
  addCustomOption,
  selectOptions
}) => {
  const { fieldType, columnNumber } = editingCell;
  const fieldName = COLUMN_NAMES[columnNumber];
  const [localValue, setLocalValue] = useState(editValue);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(() => {
    if (columnNumber === 16 && editValue) {
      try {
        const parsed = JSON.parse(editValue);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        if (typeof editValue === 'string' && editValue.includes(',')) {
          return editValue.split(',').map(s => s.trim());
        }
        return editValue ? [editValue] : [];
      }
    }
    return [];
  });

  const selectRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setLocalValue(editValue);
  }, [editValue]);

  useEffect(() => {
    setTimeout(() => {
      if (selectRef.current) {
        selectRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  const handleSave = () => {
    onSave(localValue);
  };

  const handleKeyDown = (e) => {
    if (menuIsOpen) {
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  const handleMenuOpen = () => {
    setMenuIsOpen(true);
  };

  const handleMenuClose = () => {
    setMenuIsOpen(false);
  };

  const getOptions = () => {
    switch(fieldType) {
      case 'creatable-department':
        return selectData?.departments?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-gender':
        return selectData?.gender?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-country':
        return selectData?.countries?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-specialty':
        return selectData?.specialties?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-specialty-profile':
        return selectData?.specialtyProfiles?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-dismissal':
        return selectData?.dismissalReason?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-university':
        return selectData?.university?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-preparation':
        return selectData?.preparationForm?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-document':
        return selectData?.identityDocument?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-residence':
        return selectData?.residence?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-medical':
        return selectData?.medicalCertificate?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-rivsh':
        return selectData?.rivshCertificate?.map(option => ({ value: option, label: option })) || [];
      case 'creatable-entry':
        return selectData?.entryByInvitation?.map(option => ({ value: option, label: option })) || [];
      default:
        return [];
    }
  };

  const getOptionField = () => {
    switch(fieldType) {
      case 'creatable-gender': return 'gender';
      case 'creatable-country': return 'country';
      case 'creatable-department': return 'departments';
      case 'creatable-dismissal': return 'dismissalReason';
      case 'creatable-university': return 'university';
      case 'creatable-preparation': return 'preparationForm';
      case 'creatable-document': return 'identityDocument';
      case 'creatable-residence': return 'residence';
      case 'creatable-medical': return 'medicalCertificate';
      case 'creatable-rivsh': return 'rivshCertificate';
      case 'creatable-entry': return 'entryByInvitation';
      case 'creatable-specialty': return 'specialties';
      case 'creatable-specialty-profile': return 'specialtyProfiles';
      default: return null;
    }
  };

  const renderEditor = () => {
    if (columnNumber === 16) {
      return (
        <div 
          className="inline-checkbox-group" 
          onKeyDown={handleKeyDown}
          tabIndex={0}
          ref={inputRef}
        >
          {selectOptions?.preparationForm?.map(option => (
            <label key={option} className="inline-checkbox-label">
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={(e) => {
                  let newOptions;
                  if (e.target.checked) {
                    newOptions = [...selectedOptions, option];
                  } else {
                    newOptions = selectedOptions.filter(o => o !== option);
                  }
                  setSelectedOptions(newOptions);
                  setLocalValue(JSON.stringify(newOptions));
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (fieldType && fieldType.startsWith('creatable-')) {
      const options = getOptions();
      const optionField = getOptionField();

      return (
        <div className="inline-creatable-wrapper">
          <CreatableSelect
            ref={selectRef}
            options={options}
            value={localValue ? { value: localValue, label: localValue } : null}
            onChange={(option) => {
              if (option) {
                setLocalValue(option.value);
              } else {
                setLocalValue('');
              }
            }}
            onKeyDown={handleKeyDown}
            onMenuOpen={handleMenuOpen}
            onMenuClose={handleMenuClose}
            isClearable
            placeholder="Выберите..."
            noOptionsMessage={() => "Нет вариантов, введите свой"}
            formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
            menuPortalTarget={document.body}
            onCreateOption={(inputValue) => {
              if (optionField) {
                addCustomOption(optionField, inputValue);
              }
              setLocalValue(inputValue);
            }}
            styles={{
              menuPortal: base => ({ ...base, zIndex: 9999 }),
              container: base => ({ ...base, width: '100%' })
            }}
            className="react-select-inline"
            classNamePrefix="react-select"
            autoFocus
            openMenuOnFocus
          />
        </div>
      );
    }

    switch(fieldType) {
      case 'date':
        if (columnNumber === 3) {
          let yearDisplay = localValue;
          if (localValue && typeof localValue === 'string') {
            if (localValue.includes('-')) {
              yearDisplay = localValue.split('-')[0];
            } else if (localValue.includes('.')) {
              yearDisplay = localValue.split('.')[2];
            }
          }
          return (
            <input
              ref={inputRef}
              type="text"
              value={yearDisplay}
              onChange={(e) => {
                const year = e.target.value.replace(/\D/g, '').slice(0, 4);
                const fullDate = year ? `${year}-01-01` : '';
                setLocalValue(fullDate);
              }}
              onKeyDown={handleKeyDown}
              className="inline-input"
              placeholder="ГГГГ"
              maxLength="4"
            />
          );
        }
        const displayDate = (() => {
          if (!localValue) return '';
          if (/^\d{2}\.\d{2}\.\d{4}$/.test(localValue)) return localValue;
          if (/^\d{4}-\d{2}-\d{2}$/.test(localValue)) {
            const [year, month, day] = localValue.split('-');
            return `${day}.${month}.${year}`;
          }
          return localValue;
        })();
        const isDateInvalid = localValue && !isValidDate(displayDate);
        return (
          <>
            <input
              ref={inputRef}
              type="text"
              value={displayDate}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`inline-input ${isDateInvalid ? 'date-error' : ''}`}
              placeholder="ДД.ММ.ГГГГ"
            />
            {isDateInvalid && (
              <span className="date-error-message-inline"> Неверный формат даты. Используйте ДД.ММ.ГГГГ</span>
            )}
          </>
        );
      case 'tel':
        return (
          <input
            ref={inputRef}
            type="tel"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="inline-input"
            placeholder="+375XXXXXXXXX"
          />
        );
      case 'password':
        return (
          <input
            ref={inputRef}
            type="password"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="inline-input"
            placeholder="Введите пароль"
            autoComplete="off"
          />
        );
      case 'text':
        return (
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="inline-input"
            placeholder="Введите текст..."
          />
        );
      default:
        return (
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="inline-input"
            placeholder="Введите значение..."
          />
        );
    }
  };

  return (
    <td className="editing-cell">
      <div className="inline-editor-container" ref={containerRef}>
        {renderEditor()}
      </div>
    </td>
  );
};

export default InlineCellEditor;