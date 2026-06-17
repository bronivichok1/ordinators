import React from 'react';
import CreatableSelect from 'react-select/creatable';
import { Trash2, Plus } from 'lucide-react';
import { COLUMN_NAMES, EXTENSION_TERMS } from '../utils/constants';
import { formatDateToDisplay, isValidDate, formatPreparationForm } from '../utils/dateUtils';

const CreateModal = ({
  modalState,
  newRowData,
  dateErrors,
  setDateErrors,
  selectOptions,
  selectData,
  addCustomOption,
  handleModalChange,
  handleSave,
  handleCancel,
  userData,
  columns,
}) => {
  const renderModalField = (columnName, columnNumber, isEditMode = false, currentValue = '') => {
    const fieldName = COLUMN_NAMES[columnNumber];
    const columnKey = `column${columnNumber}`;
    let value = isEditMode ? currentValue : (newRowData[columnKey] || '');
    
    if (columnNumber === 16 && !isEditMode && modalState.mode === 'create') {
      value = JSON.stringify(modalState.selectedPreparationForm);
    }
    
    let isReadOnly = userData?.role === 'supervisor';

    if (userData?.role === 'passportist' && modalState.mode === 'edit') {
      const allowedFieldsForPassportist = [
        'Срок окончания регистрации',
        'Документ, удостоверяющий личность',
        'Идентификационный номер',
        'Номер документа'
      ];
      const currentFieldName = COLUMN_NAMES[columnNumber];
      isReadOnly = !allowedFieldsForPassportist.includes(currentFieldName);
    }

    const handleChange = (newValue) => {
      if (isReadOnly) return;
      handleModalChange(columnKey, newValue);
    };

    if (isReadOnly) {
      let displayValue = value;
      
      if (columnNumber === 16) {
        displayValue = formatPreparationForm(value);
        return <div className="readonly-field">{displayValue}</div>;
      }
      
      if (columnNumber === 9) {
        try {
          const leaves = JSON.parse(value || '[]');
          if (Array.isArray(leaves) && leaves.length > 0) {
            return (
              <div className="readonly-nested-container">
                {leaves.map((leave, idx) => (
                  <div key={idx} className="readonly-nested-item">
                    <div className="readonly-nested-line">
                      <strong>Дата начала:</strong> {formatDateToDisplay(leave.startDate) || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Дата окончания:</strong> {formatDateToDisplay(leave.endDate) || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Причина:</strong> {leave.reason || '—'}
                    </div>
                    {idx < leaves.length - 1 && <hr className="nested-separator" />}
                  </div>
                ))}
              </div>
            );
          }
          return <div className="readonly-field">Нет записей</div>;
        } catch {
          return <div className="readonly-field">—</div>;
        }
      }
      
      if (columnNumber === 33) {
        try {
          const supervisors = JSON.parse(value || '[]');
          if (Array.isArray(supervisors) && supervisors.length > 0) {
            return (
              <div className="readonly-nested-container">
                {supervisors.map((sup, idx) => (
                  <div key={idx} className="readonly-nested-item">
                    <div className="readonly-nested-line">
                      <strong>Руководитель:</strong> {sup.supervisorName || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Должность:</strong> {sup.position || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Звание:</strong> {sup.rank || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Дата начала:</strong> {formatDateToDisplay(sup.startDate) || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Дата окончания:</strong> {formatDateToDisplay(sup.endDate) || '—'}
                    </div>
                    {idx < supervisors.length - 1 && <hr className="nested-separator" />}
                  </div>
                ))}
              </div>
            );
          }
          return <div className="readonly-field">Нет записей</div>;
        } catch {
          return <div className="readonly-field">—</div>;
        }
      }
      
      if (columnNumber === 27) {
        try {
          const extensions = JSON.parse(value || '[]');
          if (Array.isArray(extensions) && extensions.length > 0) {
            return (
              <div className="readonly-nested-container">
                {extensions.map((ext, idx) => (
                  <div key={idx} className="readonly-nested-item">
                    <div className="readonly-nested-line">
                      <strong>Номер приказа:</strong> {ext.orderNumber || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Дата приказа:</strong> {formatDateToDisplay(ext.orderDate) || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Срок продления:</strong> {ext.extensionTerm || '—'}
                    </div>
                    {idx < extensions.length - 1 && <hr className="nested-separator" />}
                  </div>
                ))}
              </div>
            );
          }
          return <div className="readonly-field">Нет записей</div>;
        } catch {
          return <div className="readonly-field">—</div>;
        }
      }
      
      if (columnNumber === 36) {
        try {
          const allowances = JSON.parse(value || '[]');
          if (Array.isArray(allowances) && allowances.length > 0) {
            return (
              <div className="readonly-nested-container">
                {allowances.map((allow, idx) => (
                  <div key={idx} className="readonly-nested-item">
                    <div className="readonly-nested-line">
                      <strong>Номер приказа:</strong> {allow.orderNumber || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Дата начала:</strong> {formatDateToDisplay(allow.startDate) || '—'}
                    </div>
                    <div className="readonly-nested-line">
                      <strong>Дата окончания:</strong> {formatDateToDisplay(allow.endDate) || '—'}
                    </div>
                    {idx < allowances.length - 1 && <hr className="nested-separator" />}
                  </div>
                ))}
              </div>
            );
          }
          return <div className="readonly-field">Нет записей</div>;
        } catch {
          return <div className="readonly-field">—</div>;
        }
      }
      
      return <div className="readonly-field">{displayValue}</div>;
    }

    const getModalOptions = (field) => {
      switch(field) {
        case 'Пол':
          return selectData.gender.map(option => ({ value: option, label: option }));
        case 'Страна':
          return selectData.countries.map(option => ({ value: option, label: option }));
        case 'Кафедра':
          return selectData.departments.map(option => ({ value: option, label: option }));
        case 'Специальность':
          return selectData.specialties.map(option => ({ value: option, label: option }));
        case 'Профиль специальности':
          return selectData.specialtyProfiles.map(option => ({ value: option, label: option }));
        case 'Причина отчисления':
          return selectData.dismissalReason.map(option => ({ value: option, label: option }));
        case 'ВУЗ':
          return selectData.university.map(option => ({ value: option, label: option }));
        case 'Форма подготовки':
          return selectData.preparationForm.map(option => ({ value: option, label: option }));
        case 'Документ, удостоверяющий личность':
          return selectData.identityDocument.map(option => ({ value: option, label: option }));
        case 'Место проживания, регистрации':
          return selectData.residence.map(option => ({ value: option, label: option }));
        case 'Медицинская справка':
          return selectData.medicalCertificate.map(option => ({ value: option, label: option }));
        case 'Наличие сертификата РИВШ':
          return selectData.rivshCertificate.map(option => ({ value: option, label: option }));
        case 'Въезд по приглашению':
          return selectData.entryByInvitation.map(option => ({ value: option, label: option }));
        default:
          return [];
      }
    };

    const selectFields = [
      'Пол', 'Страна', 'Кафедра', 'Профиль специальности','Специальность', 'Причина отчисления',
      'ВУЗ', 'Документ, удостоверяющий личность',
      'Место проживания, регистрации', 'Медицинская справка',
      'Наличие сертификата РИВШ', 'Въезд по приглашению'
    ];

    if (selectFields.includes(fieldName)) {
      const options = getModalOptions(fieldName);
      return (
        <CreatableSelect
          options={options}
          value={value ? { value: value, label: value } : null}
          onChange={handleChange}
          isClearable
          placeholder="Выберите..."
          noOptionsMessage={() => "Нет вариантов, введите свой"}
          formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      );
    }

    switch(fieldName) {
      case 'Год окончания':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const year = e.target.value.replace(/\D/g, '').slice(0, 4);
              handleChange(year);
            }}
            className="modal-input"
            maxLength="4"
            placeholder="ГГГГ"
          />
        );
      case 'Форма подготовки':
        let parsedPrepForm = [];
        try {
          if (typeof value === 'string') {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              parsedPrepForm = parsed;
            } else {
              parsedPrepForm = [value];
            }
          } else if (Array.isArray(value)) {
            parsedPrepForm = value;
          } else if (value) {
            parsedPrepForm = [value];
          }
        } catch (e) {
          parsedPrepForm = value ? [value] : [];
        }
        
        return (
          <div className="checkbox-group">
            {selectOptions.preparationForm.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={parsedPrepForm.includes(option)}
                  onChange={() => {
                    let newSelection;
                    if (parsedPrepForm.includes(option)) {
                      newSelection = parsedPrepForm.filter(item => item !== option);
                    } else {
                      newSelection = [...parsedPrepForm, option];
                    }
                    
                    setModalState(prev => ({
                      ...prev,
                      selectedPreparationForm: newSelection
                    }));
                    
                    const stringValue = JSON.stringify(newSelection);
                    if (modalState.mode === 'create') {
                      setNewRowData(prev => ({
                        ...prev,
                        column16: stringValue
                      }));
                    } else {
                      const updatedRowData = [...modalState.rowData];
                      const itemIndex = updatedRowData.findIndex(item => item.columnName === 'column16');
                      if (itemIndex !== -1) {
                        updatedRowData[itemIndex].value = stringValue;
                        setModalState(prev => ({
                          ...prev,
                          rowData: updatedRowData
                        }));
                      }
                    }
                  }}
                  className="modal-checkbox"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'Социальный отпуск':
        const socialLeaves = (() => {
          try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();
        
        const socialLeaveOptionsForModal = selectOptions.socialLeave || [];
        
        return (
          <div className="modal-nested-container">
            <div className="modal-nested-header">
              <div className="nested-header-start">Дата начала</div>
              <div className="nested-header-end">Дата окончания</div>
              <div className="nested-header-reason">Причина</div>
              <div className="nested-header-actions"></div>
            </div>
            {socialLeaves.map((leave, idx) => {
              const startErrorKey = `social-start-${idx}`;
              const endErrorKey = `social-end-${idx}`;
              return (
                <div key={idx} className="modal-nested-item">
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateToDisplay(leave.startDate) || ''}
                      onChange={(e) => {
                        const newLeaves = [...socialLeaves];
                        newLeaves[idx] = { ...newLeaves[idx], startDate: e.target.value };
                        handleChange(JSON.stringify(newLeaves));
                        if (e.target.value && !isValidDate(e.target.value)) {
                          setDateErrors(prev => ({ ...prev, [startErrorKey]: true }));
                        } else {
                          setDateErrors(prev => ({ ...prev, [startErrorKey]: false }));
                        }
                      }}
                      className={`modal-nested-input date-input ${dateErrors[startErrorKey] ? 'date-error' : ''}`}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateToDisplay(leave.endDate) || ''}
                      onChange={(e) => {
                        const newLeaves = [...socialLeaves];
                        newLeaves[idx] = { ...newLeaves[idx], endDate: e.target.value };
                        handleChange(JSON.stringify(newLeaves));
                        if (e.target.value && !isValidDate(e.target.value)) {
                          setDateErrors(prev => ({ ...prev, [endErrorKey]: true }));
                        } else {
                          setDateErrors(prev => ({ ...prev, [endErrorKey]: false }));
                        }
                      }}
                      className={`modal-nested-input date-input ${dateErrors[endErrorKey] ? 'date-error' : ''}`}
                    />
                  </div>
                  <div className="modal-nested-select-wrapper">
                    <CreatableSelect
                      options={socialLeaveOptionsForModal.map(opt => ({ value: opt, label: opt }))}
                      value={leave.reason ? { value: leave.reason, label: leave.reason } : null}
                      onChange={(option) => {
                        const newLeaves = [...socialLeaves];
                        newLeaves[idx] = { ...newLeaves[idx], reason: option ? option.value : '' };
                        handleChange(JSON.stringify(newLeaves));
                      }}
                      isClearable
                      placeholder="Выберите или введите причину"
                      noOptionsMessage={() => "Нет вариантов, введите свою причину"}
                      formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
                      onCreateOption={(inputValue) => {
                        const newLeaves = [...socialLeaves];
                        newLeaves[idx] = { ...newLeaves[idx], reason: inputValue };
                        handleChange(JSON.stringify(newLeaves));
                        addCustomOption('socialLeave', inputValue);
                      }}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newLeaves = socialLeaves.filter((_, i) => i !== idx);
                      handleChange(JSON.stringify(newLeaves));
                      setDateErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[startErrorKey];
                        delete newErrors[endErrorKey];
                        return newErrors;
                      });
                    }}
                    className="modal-nested-remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => {
                const newLeaves = [...socialLeaves, { startDate: '', endDate: '', reason: '' }];
                handleChange(JSON.stringify(newLeaves));
              }}
              className="modal-nested-add"
            >
              <Plus size={14} /> Добавить период отпуска
            </button>
          </div>
        );

      case 'Руководители':
        const supervisors = (() => {
          try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();
        
        return (
          <div className="modal-nested-container">
            <div className="modal-nested-header">
              <div className="nested-header-supervisor">Руководитель</div>
              <div className="nested-header-position">Должность</div>
              <div className="nested-header-rank">Звания</div>
              <div className="nested-header-start">Дата начала</div>
              <div className="nested-header-end">Дата окончания</div>
              <div className="nested-header-actions"></div>
            </div>
            {supervisors.map((sup, idx) => {
              const startErrorKey = `supervisor-start-${idx}`;
              const endErrorKey = `supervisor-end-${idx}`;
              return (
                <div key={idx} className="modal-nested-item">
                  <input
                    type="text"
                    placeholder="ФИО руководителя"
                    value={sup.supervisorName || ''}
                    onChange={(e) => {
                      const newSupervisors = [...supervisors];
                      newSupervisors[idx] = { ...newSupervisors[idx], supervisorName: e.target.value };
                      handleChange(JSON.stringify(newSupervisors));
                    }}
                    className="modal-nested-input supervisor-input"
                  />
                  <input
                    type="text"
                    placeholder="Должность"
                    value={sup.position || ''}
                    onChange={(e) => {
                      const newSupervisors = [...supervisors];
                      newSupervisors[idx] = { ...newSupervisors[idx], position: e.target.value };
                      handleChange(JSON.stringify(newSupervisors));
                    }}
                    className="modal-nested-input position-input"
                  />
                  <input
                    type="text"
                    placeholder="Звания"
                    value={sup.rank || ''}
                    onChange={(e) => {
                      const newSupervisors = [...supervisors];
                      newSupervisors[idx] = { ...newSupervisors[idx], rank: e.target.value };
                      handleChange(JSON.stringify(newSupervisors));
                    }}
                    className="modal-nested-input rank-input"
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateToDisplay(sup.startDate)}
                      onChange={(e) => {
                        const newSupervisors = [...supervisors];
                        newSupervisors[idx] = { ...newSupervisors[idx], startDate: e.target.value };
                        handleChange(JSON.stringify(newSupervisors));
                        if (e.target.value && !isValidDate(e.target.value)) {
                          setDateErrors(prev => ({ ...prev, [startErrorKey]: true }));
                        } else {
                          setDateErrors(prev => ({ ...prev, [startErrorKey]: false }));
                        }
                      }}
                      className={`modal-nested-input date-input ${dateErrors[startErrorKey] ? 'date-error' : ''}`}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateToDisplay(sup.endDate)}
                      onChange={(e) => {
                        const newSupervisors = [...supervisors];
                        newSupervisors[idx] = { ...newSupervisors[idx], endDate: e.target.value };
                        handleChange(JSON.stringify(newSupervisors));
                        if (e.target.value && !isValidDate(e.target.value)) {
                          setDateErrors(prev => ({ ...prev, [endErrorKey]: true }));
                        } else {
                          setDateErrors(prev => ({ ...prev, [endErrorKey]: false }));
                        }
                      }}
                      className={`modal-nested-input date-input ${dateErrors[endErrorKey] ? 'date-error' : ''}`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newSupervisors = supervisors.filter((_, i) => i !== idx);
                      handleChange(JSON.stringify(newSupervisors));
                      setDateErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[startErrorKey];
                        delete newErrors[endErrorKey];
                        return newErrors;
                      });
                    }}
                    className="modal-nested-remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => {
                const newSupervisors = [...supervisors, { supervisorName: '', position: '', rank: '', startDate: '', endDate: '' }];
                handleChange(JSON.stringify(newSupervisors));
              }}
              className="modal-nested-add"
            >
              <Plus size={14} /> Добавить руководителя
            </button>
          </div>
        );

      case 'Номер приказа о продлении':
        const extensionsList = (() => {
          try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        const addExtension = () => {
          const newExtensions = [...extensionsList, {
            orderNumber: '',
            orderDate: '',
            extensionTerm: '1 год'
          }];
          handleChange(JSON.stringify(newExtensions));
        };

        const updateExtension = (idx, field, val) => {
          const newExtensions = [...extensionsList];
          newExtensions[idx] = { ...newExtensions[idx], [field]: val };
          handleChange(JSON.stringify(newExtensions));
        };

        const removeExtension = (idx) => {
          const newExtensions = extensionsList.filter((_, i) => i !== idx);
          handleChange(JSON.stringify(newExtensions));
          setDateErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`extension-date-${idx}`];
            return newErrors;
          });
        };

        return (
          <div className="modal-nested-container">
            <div className="modal-nested-header">
              <div className="nested-header-order">Номер приказа</div>
              <div className="nested-header-date">Дата приказа</div>
              <div className="nested-header-term">Срок продления</div>
              <div className="nested-header-actions"></div>
            </div>
            {extensionsList.map((ext, idx) => {
              const dateErrorKey = `extension-date-${idx}`;
              return (
                <div key={idx} className="modal-nested-item">
                  <input
                    type="text"
                    placeholder="Номер приказа"
                    value={ext.orderNumber || ''}
                    onChange={(e) => updateExtension(idx, 'orderNumber', e.target.value)}
                    className="modal-nested-input"
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateToDisplay(ext.orderDate)}
                      onChange={(e) => {
                        updateExtension(idx, 'orderDate', e.target.value);
                        if (e.target.value && !isValidDate(e.target.value)) {
                          setDateErrors(prev => ({ ...prev, [dateErrorKey]: true }));
                        } else {
                          setDateErrors(prev => ({ ...prev, [dateErrorKey]: false }));
                        }
                      }}
                      className={`modal-nested-input ${dateErrors[dateErrorKey] ? 'date-error' : ''}`}
                    />
                  </div>
                  <select
                    value={ext.extensionTerm || '1 год'}
                    onChange={(e) => updateExtension(idx, 'extensionTerm', e.target.value)}
                    className="modal-nested-input"
                  >
                    {EXTENSION_TERMS.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeExtension(idx)}
                    className="modal-nested-remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={addExtension}
              className="modal-nested-add"
            >
              <Plus size={14} /> Добавить продление
            </button>
          </div>
        );

      case 'Надбавка':
        const allowancesList = (() => {
          try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        const addAllowanceModal = () => {
          const newAllowances = [...allowancesList, { orderNumber: '', startDate: '', endDate: '' }];
          handleChange(JSON.stringify(newAllowances));
        };

        const updateAllowanceModal = (idx, field, val) => {
          const newAllowances = [...allowancesList];
          newAllowances[idx] = { ...newAllowances[idx], [field]: val };
          handleChange(JSON.stringify(newAllowances));
        };

        const removeAllowanceModal = (idx) => {
          const newAllowances = allowancesList.filter((_, i) => i !== idx);
          handleChange(JSON.stringify(newAllowances));
          setDateErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`allowance-start-${idx}`];
            delete newErrors[`allowance-end-${idx}`];
            return newErrors;
          });
        };

        return (
          <div className="modal-nested-container">
            <div className="modal-nested-header">
              <div className="nested-header-order">Номер приказа</div>
              <div className="nested-header-start">Дата начала</div>
              <div className="nested-header-end">Дата окончания</div>
              <div className="nested-header-actions"></div>
            </div>
            {allowancesList.map((item, idx) => {
              const startErrorKey = `allowance-start-${idx}`;
              const endErrorKey = `allowance-end-${idx}`;
              return (
                <div key={idx} className="modal-nested-item">
                  <input
                    type="text"
                    placeholder="Номер приказа"
                    value={item.orderNumber || ''}
                    onChange={(e) => updateAllowanceModal(idx, 'orderNumber', e.target.value)}
                    className="modal-nested-input"
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateToDisplay(item.startDate)}
                      onChange={(e) => {
                        updateAllowanceModal(idx, 'startDate', e.target.value);
                        if (e.target.value && !isValidDate(e.target.value)) {
                          setDateErrors(prev => ({ ...prev, [startErrorKey]: true }));
                        } else {
                          setDateErrors(prev => ({ ...prev, [startErrorKey]: false }));
                        }
                      }}
                      className={`modal-nested-input date-input ${dateErrors[startErrorKey] ? 'date-error' : ''}`}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateToDisplay(item.endDate)}
                      onChange={(e) => {
                        updateAllowanceModal(idx, 'endDate', e.target.value);
                        if (e.target.value && !isValidDate(e.target.value)) {
                          setDateErrors(prev => ({ ...prev, [endErrorKey]: true }));
                        } else {
                          setDateErrors(prev => ({ ...prev, [endErrorKey]: false }));
                        }
                      }}
                      className={`modal-nested-input date-input ${dateErrors[endErrorKey] ? 'date-error' : ''}`}
                    />
                  </div>
                  <button
                    onClick={() => removeAllowanceModal(idx)}
                    className="modal-nested-remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={addAllowanceModal}
              className="modal-nested-add"
            >
              <Plus size={14} /> Добавить надбавку
            </button>
          </div>
        );

      case 'Год рождения':
        let yearOnly = value;
        if (value && typeof value === 'string' && value.includes('-')) {
          yearOnly = value.split('-')[0];
        } else if (value && typeof value === 'string' && value.includes('.')) {
          yearOnly = value.split('.')[2];
        }
        return (
          <input
            type="text"
            value={yearOnly || ''}
            onChange={(e) => {
              const year = e.target.value.replace(/\D/g, '').slice(0, 4);
              const fullDate = year ? `${year}-01-01` : '';
              handleChange(fullDate);
            }}
            className="modal-input"
            maxLength="4"
            placeholder="ГГГГ"
          />
        );

      case 'Дата зачисления':
      case 'Дата отчисления':
      case 'Дата приказа о зачислении':
      case 'Дата приказа об отчислении':
      case 'Срок окончания регистрации':
      case 'Дата начала сессии(циклов)':
      case 'Дата окончания сессии(циклов)':
        const displayDate = formatDateToDisplay(value);
        const isDateInvalid = displayDate && !isValidDate(displayDate);
        return (
          <>
            <input
              type="text"
              value={displayDate}
              onChange={(e) => {
                const newValue = e.target.value;
                handleChange(newValue);
                if (newValue && !isValidDate(newValue)) {
                  setDateErrors(prev => ({ ...prev, [columnKey]: true }));
                } else {
                  setDateErrors(prev => ({ ...prev, [columnKey]: false }));
                }
              }}
              className={`modal-input ${isDateInvalid ? 'date-error' : ''}`}
              placeholder="ДД.ММ.ГГГГ"
            />
            {isDateInvalid && (
              <span className="date-error-message">Неверный формат даты. Используйте ДД.ММ.ГГГГ</span>
            )}
          </>
        );

      case 'Мобильный телефон':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="+375XXXXXXXXX"
          />
        );

      case 'Пароль':
        return (
          <input
            type="password"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder={modalState.mode === 'edit' ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'}
            autoComplete="off"
          />
        );

      case 'Текущий контроль':
        const displayCurrentControlDate = formatDateToDisplay(value);
        return (
          <input
            type="text"
            value={displayCurrentControlDate}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="ДД.ММ.ГГГГ"
          />
        );

      case 'Распределение клинических ординаторов':
      case 'Адрес проживания':
        return (
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
          />
        );
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal create-modal">
        <div className="modal-header">
          <h2>
            {modalState.mode === 'create' 
              ? 'Создание нового ординатора' 
              : `Редактирование ординатора ID: ${modalState.selectedRow?.id || modalState.selectedRow?.index + 1}`}
          </h2>
          <button onClick={handleCancel} className="close-button">&times;</button>
        </div>
        
        <div className="modal-content">
          <div className="row-editor">
            <div className="columns-editor">
              {columns.map((column, index) => {
                const columnNumber = parseInt(column.replace('column', ''));
                const fieldName = COLUMN_NAMES[columnNumber];
                
                if (!fieldName || fieldName === '') return null;
                
                if (fieldName === 'Дата установки надбавки' || fieldName === 'Дата окончания надбавки') return null;
                
                const currentValue = modalState.mode === 'edit'
                  ? modalState.rowData.find(item => item.columnName === column)?.value || ''
                  : '';
                
                return (
                  <div key={column} className="column-editor-item">
                    <div className="column-label">
                      <span className="column-number">{fieldName}:</span>
                    </div>
                    {renderModalField(
                      column, 
                      columnNumber, 
                      modalState.mode === 'edit', 
                      currentValue
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => handleSave()}
                className="save-button"
                disabled={Object.values(dateErrors).some(error => error === true)}
              >
                {modalState.mode === 'create' ? 'Создать ординатора' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateModal;