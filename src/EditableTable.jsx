import React, { useState } from 'react';
import './EditableTable.css';

const EditableTable = () => {
  // Исходные данные (35 объектов по 35 строк каждый)
  const initialData = Array.from({ length: 35 }, (_, rowIndex) => {
    const obj = {};
    for (let i = 1; i <= 35; i++) {
      obj[`column${i}`] = `Строка ${rowIndex + 1}, Колонка ${i}`;
    }
    return obj;
  });

  const ColumnName = [
    '',
    'ФИО',
    'ФИО(EN)',
    'Год рождения',
    'Пол',
    'Страна',
    'Дата зачисления',
    'Дата отчисления',
    'Причина отчисления',
    'Социальный отпуск',
    'Срок нахождения в социальном отпуске',
    'Мобильный телефон',
    'ВУЗ',
    'Год окончания',
    'Кафедра',
    'Профиль специальности',
    'Специальность',
    'Форма подготовки',
    'Документ, удостоверяющий личность',
    'Идентификационный номер',
    'Место проживания, регистрации',
    'Срок окончания регистрации',
    'Номер, дата приказа о зачислении',
    'Номер, дата приказа об отчислении',
    'Договор, дополнительное соглашение',
    'Мед. справка',
    'Текущий контроль',
    'Логин',
    'Пароль',
    'Руководитель ординатора',
    'Дата сессии(циклов), начало, окончание',
    'Дата установки надбавки',
    'Дата окончания надбавки',
    'Наличие сертификата РИВШ',
    'Въезд по приглашению',
    'Распределение клинических ординаторов',
  ];

  const selectOptions = {
    gender: ['М', 'Ж'],
    dismissalReason: [
      'по окончанию срока подготовки',
      'за неуплату подготовки',
      'по собственному желанию',
      'отсутствие на занятиях',
      'иное'
    ],
    socialLeave: [
      'по беременности и родам',
      'по уходу за ребёнком',
      'мед показаниям',
      'служба в армии'
    ],
    university: [
      'БГМУ',
      'ВГМУ',
      'ГрГМУ',
      'ГомГМУ',
      'другое'
    ],
    preparationForm: [
      'заочная',
      'очная',
      'платно',
      'за счёт бюджета'
    ],
    identityDocument: [
      'паспорт',
      'вид на жительство',
      'паспорт ИГ',
      'иное'
    ],
    residence: [
      'общежитие',
      'квартира'
    ],
    medicalCertificate: ['есть', 'нет'],
    rivshCertificate: ['да', 'нет'],
    entryByInvitation: ['да', 'нет']
  };

  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [newRowData, setNewRowData] = useState({});
  const [otherUniversity, setOtherUniversity] = useState('');
  const [otherDocument, setOtherDocument] = useState('');
  const [selectedPreparationForm, setSelectedPreparationForm] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending', // 'ascending' или 'descending'
  });

  // Генерация заголовков колонок
  const columns = Array.from({ length: 35 }, (_, i) => `column${i + 1}`);

  // Инициализация данных для создания новой записи
  const initCreateRow = () => {
    const initialRowData = {};
    columns.forEach((col, index) => {
      const columnNumber = parseInt(col.replace('column', ''));
      const fieldName = ColumnName[columnNumber];
      
      switch(fieldName) {
        case 'Пол':
          initialRowData[col] = 'М';
          break;
        case 'Причина отчисления':
          initialRowData[col] = 'по окончанию срока подготовки';
          break;
        case 'Социальный отпуск':
          initialRowData[col] = '';
          break;
        case 'ВУЗ':
          initialRowData[col] = 'БГМУ';
          break;
        case 'Форма подготовки':
          initialRowData[col] = JSON.stringify(['очная']);
          break;
        case 'Документ, удостоверяющий личность':
          initialRowData[col] = 'паспорт';
          break;
        case 'Место проживания, регистрации':
          initialRowData[col] = 'общежитие';
          break;
        case 'Мед. справка':
          initialRowData[col] = 'есть';
          break;
        case 'Наличие сертификата РИВШ':
          initialRowData[col] = 'нет';
          break;
        case 'Въезд по приглашению':
          initialRowData[col] = 'нет';
          break;
        default:
          initialRowData[col] = '';
      }
    });
    
    setNewRowData(initialRowData);
    setOtherUniversity('');
    setOtherDocument('');
    setSelectedPreparationForm(['очная']);
    setIsModalOpenCreate(true);
  };

  const handleSort = (columnKey) => {
    let direction = 'ascending';
    
    // Если уже сортируем по этой колонке, меняем направление
    if (sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key: columnKey, direction });
  };

  const getSortedData = (dataToSort) => {
    if (!sortConfig.key) return dataToSort;
    
    return [...dataToSort].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (aStr < bStr) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredData = data.filter(row => {
    if (!searchTerm.trim()) return true;
    
    if (searchColumn === 'all') {
      return Object.values(row).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return row[searchColumn].toString().toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const sortedFilteredData = getSortedData(filteredData);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️'; 
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  // Обработчик клика по строке для редактирования
  const handleRowClick = (rowIndex, row) => {
    setSelectedRow({
      index: rowIndex,
      originalIndex: data.indexOf(row)
    });

    const rowValues = Object.entries(row).map(([columnName, value], colIndex) => ({
      id: colIndex,
      columnName: columnName,
      value: value,
      columnNumber: parseInt(columnName.replace('column', ''))
    }));
    
    setRowData(rowValues);
    setIsModalOpen(true);
  };

  const handleDeleteRow = (rowIndex, row) => {
    if (window.confirm(`Вы уверены, что хотите удалить строку ${rowIndex + 1}?`)) {
      const originalIndex = data.indexOf(row);
      const newData = [...data];
      newData.splice(originalIndex, 1);
      setData(newData);
    }
  };

  // Обработчик изменения чекбоксов формы подготовки
  const handlePreparationFormChange = (option) => {
    const newSelection = [...selectedPreparationForm];
    if (newSelection.includes(option)) {
      const index = newSelection.indexOf(option);
      newSelection.splice(index, 1);
    } else {
      newSelection.push(option);
    }
    setSelectedPreparationForm(newSelection);
  };

  // Обработчик изменения значения в модальном окне создания
  const handleCreateModalChange = (column, value) => {
    setNewRowData({
      ...newRowData,
      [column]: value
    });
  };

  const handleSaveNewRow = () => {
    const processedData = { ...newRowData };
    
    if (processedData['column12'] === 'другое' && otherUniversity) {
      processedData['column12'] = otherUniversity;
    }
    
    if (processedData['column18'] === 'иное' && otherDocument) {
      processedData['column18'] = otherDocument;
    }
    
    processedData['column17'] = JSON.stringify(selectedPreparationForm);
    
    const newRow = { ...processedData };
    const newData = [...data, newRow];
    setData(newData);
    setIsModalOpenCreate(false);
    setNewRowData({});
    setOtherUniversity('');
    setOtherDocument('');
    setSelectedPreparationForm([]);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsModalOpenCreate(false);
    setSelectedRow(null);
    setRowData([]);
    setNewRowData({});
    setOtherUniversity('');
    setOtherDocument('');
    setSelectedPreparationForm([]);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
    setSortConfig({ key: null, direction: 'ascending' });
  };

  const renderCreateField = (columnName, columnNumber) => {
    const fieldName = ColumnName[columnNumber];
    const columnKey = `column${columnNumber}`;
    const value = newRowData[columnKey] || '';

    switch(fieldName) {
      case 'Пол':
        return (
          <select
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.gender.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'Причина отчисления':
        return (
          <div className="university-select-container">
          <select
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.dismissalReason.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {value === 'иное' && (
              <input
                type="text"
                value={otherUniversity}
                onChange={(e) => setOtherUniversity(e.target.value)}
                className="other-input"
                placeholder="Введите причину отчисления"
              />
            )}
          </div>
        );
      
      case 'Социальный отпуск':
        return (
          <select
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-select"
          >
            <option value="">Не выбрано</option>
            {selectOptions.socialLeave.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'ВУЗ':
        return (
          <div className="university-select-container">
            <select
              value={value}
              onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
              className="modal-select"
            >
              {selectOptions.university.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {value === 'другое' && (
              <input
                type="text"
                value={otherUniversity}
                onChange={(e) => setOtherUniversity(e.target.value)}
                className="other-input"
                placeholder="Введите название ВУЗа"
              />
            )}
          </div>
        );
      
      case 'Форма подготовки':
        return (
          <div className="checkbox-group">
            {selectOptions.preparationForm.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedPreparationForm.includes(option)}
                  onChange={() => handlePreparationFormChange(option)}
                  className="modal-checkbox"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'Документ, удостоверяющий личность':
        return (
          <div className="document-select-container">
            <select
              value={value}
              onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
              className="modal-select"
            >
              {selectOptions.identityDocument.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {value === 'иное' && (
              <input
                type="text"
                value={otherDocument}
                onChange={(e) => setOtherDocument(e.target.value)}
                className="other-input"
                placeholder="Введите название документа"
              />
            )}
          </div>
        );
      
      case 'Место проживания, регистрации':
        return (
          <select
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.residence.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'Мед. справка':
        return (
          <select
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.medicalCertificate.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'Наличие сертификата РИВШ':
        return (
          <select
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.rivshCertificate.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'Въезд по приглашению':
        return (
          <select
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.entryByInvitation.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'Год рождения':
      case 'Год окончания':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-input"
            placeholder="Введите год"
          />
        );
      
      case 'Дата зачисления':
      case 'Дата отчисления':
      case 'Срок окончания регистрации':
      case 'Дата сессии(циклов), начало, окончание':
      case 'Дата установки надбавки':
      case 'Дата окончания надбавки':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-input"
          />
        );
      
      case 'Мобильный телефон':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-input"
            placeholder="+375XXXXXXXXX"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCreateModalChange(columnKey, e.target.value)}
            className="modal-input"
            placeholder="Введите значение..."
          />
        );
    }
  };

  return (
    <div className="table-page">
      <div className="table-container">
        <div className="search-panel">
          <div className="search-input-group">
            <div className="search-label">
              🔍 Поиск по таблице:
            </div>
            <input
              type="text"
              placeholder="Введите текст для поиска..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={searchColumn}
              onChange={(e) => setSearchColumn(e.target.value)}
              className="column-select"
            >
              <option value="all">Все колонки</option>
              {columns.map((col, index) => (
                <option key={col} value={col}>
                  {ColumnName[index + 1]}
                </option>
              ))}
            </select>
            <button 
              onClick={handleResetSearch} 
              className="reset-search-button"
            >
              Сброс поиска и сортировки
            </button>
            <button 
              onClick={initCreateRow}
              className="create-row-button"
              title="Создать новую запись"
            >
              📋 Создать
            </button>
          </div>
          <div className="search-info">
            {searchTerm && (
              <p>
                Найдено строк: {filteredData.length} из {data.length}
                {searchColumn !== 'all' && ` (поиск в колонке ${parseInt(searchColumn.replace('column', ''))})`}
              </p>
            )}
            {sortConfig.key && (
              <p className="sort-info">
                Сортировка по: <strong>{ColumnName[parseInt(sortConfig.key.replace('column', ''))]}</strong> 
                ({sortConfig.direction === 'ascending' ? 'по возрастанию' : 'по убыванию'})
              </p>
            )}
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="editable-table">
            <thead>
              <tr>
                <th className="row-header sticky-top-left">
                  <div className="id-header">ID</div>
                </th>
                
                {columns.map((col, index) => (
                  <th 
                    key={col} 
                    className="column-header sticky-top sortable-header"
                    onClick={() => handleSort(col)}
                    title={`Сортировать по ${ColumnName[index + 1]}`}
                  >
                    <div className="header-content">
                      <span className="header-text">{ColumnName[index + 1]}</span>
                      <span className="sort-icon">
                        {getSortIcon(col)}
                      </span>
                    </div>
                  </th>
                ))}
                
                <th className="action-header sticky-top-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredData.map((row, rowIndex) => {
                const originalIndex = data.indexOf(row);
                return (
                  <tr key={`row-${originalIndex}`} className="table-row">
                    <td className="row-header sticky-left">
                      <div className="id-cell">{originalIndex + 1}</div>
                    </td>
                    
                    {columns.map((column) => (
                      <td key={`cell-${originalIndex}-${column}`}>
                        <span className="cell-value">
                          {searchTerm && row[column].toString().toLowerCase().includes(searchTerm.toLowerCase()) && 
                           (searchColumn === 'all' || searchColumn === column) ? (
                            <mark>{row[column]}</mark>
                          ) : (
                            row[column]
                          )}
                        </span>
                      </td>
                    ))}
                    
                    <td className="action-cell sticky-right">
                      <button 
                        onClick={() => handleRowClick(originalIndex, row)}
                        className="edit-row-button"
                        title="Редактировать эту строку"
                      >
                        ✏️ Редактировать
                      </button>
                      <button 
                        onClick={() => handleDeleteRow(originalIndex, row)}
                        className="delete-row-button"
                        title="Удалить эту строку"
                      >
                        🗑️ Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {sortedFilteredData.length === 0 && searchTerm && (
          <div className="no-results">
            <p>По запросу "{searchTerm}" ничего не найдено</p>
          </div>
        )}
      </div>

      {isModalOpenCreate && (
        <div className="modal-overlay">
          <div className="modal create-modal">
            <div className="modal-header">
              <h2>Создание нового ординатора</h2>
              <button onClick={handleCancel} className="close-button">&times;</button>
            </div>
            
            <div className="modal-content">
              <div className="row-editor">
                <div className="editor-info">
                  <p>Заполните данные нового ординатора</p>
                </div>
                
                <div className="columns-editor">
                  {columns.map((column, index) => {
                    const columnNumber = parseInt(column.replace('column', ''));
                    const fieldName = ColumnName[columnNumber];
                    
                    return (
                      <div key={column} className="column-editor-item">
                        <div className="column-label">
                          <span className="column-number">{fieldName}:</span>
                        </div>
                        {renderCreateField(column, columnNumber)}
                      </div>
                    );
                  })}
                </div>
                
                <div className="modal-actions">
                  <button onClick={handleCancel} className="cancel-button">
                    Отмена
                  </button>
                  <button onClick={handleSaveNewRow} className="save-button">
                    Создать ординатора
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableTable;