import React, { useState } from 'react';
import './EditableTable.css';

const EditableTable = () => {
  // Исходные данные (30 объектов по 30 строк каждый)
  const initialData = Array.from({ length: 30 }, (_, rowIndex) => {
    const obj = {};
    for (let i = 1; i <= 30; i++) {
      obj[`column${i}`] = `Строка ${rowIndex + 1}, Колонка ${i}`;
    }
    return obj;
  });


  const ColumnName=[
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
    'Местро проживания, регистрации',
    'Срок окончания регистрации',
    'Номер, дата приказа о зачислении',
    'Номер, дата приказа об отчислении',
    'Договор, дополнительное соглошение',
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
    'ДРаспределение клинических ординаторов',

  ]
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');

  // Генерация заголовков колонок
  const columns = Array.from({ length: 30 }, (_, i) => `column${i + 1}`);

  // Поиск данных
  const filteredData = data.filter(row => {
    if (!searchTerm.trim()) return true;
    
    if (searchColumn === 'all') {
      // Ищем во всех колонках
      return Object.values(row).some(value => 
        value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Ищем в конкретной колонке
      return row[searchColumn].toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  // Обработчик клика по строке для редактирования
  const handleRowClick = (rowIndex, row) => {
    setSelectedRow({
      index: rowIndex,
      originalIndex: data.indexOf(row)
    });

    // Преобразуем данные строки для редактирования
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

  // Обработчик изменения значения в модальном окне
  const handleModalChange = (colIndex, newValue) => {
    const newRowData = [...rowData];
    newRowData[colIndex] = {
      ...newRowData[colIndex],
      value: newValue
    };
    setRowData(newRowData);
  };

  // Сохранение изменений строки
  const handleSave = () => {
    const newData = [...data];
    const rowIndex = selectedRow.originalIndex;
    
    // Обновляем все значения в строке
    rowData.forEach(item => {
      newData[rowIndex][item.columnName] = item.value;
    });
    
    setData(newData);
    setIsModalOpen(false);
    setSelectedRow(null);
    setRowData([]);
  };

  // Отмена редактирования
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
    setRowData([]);
  };

  // Сброс поиска
  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
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
              Сбросить поиск
            </button>
            <button 
                        
                        className="create-row-button"
                        title="Редактировать эту строку"
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
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="editable-table">
            <thead>
              <tr>
                <th className="row-header">#</th>
                {columns.map((col, index) => (
                  <th key={col} className="column-header">
                    {ColumnName[index + 1]}
                  </th>
                ))}
                <th className="action-header">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => {
                const originalIndex = data.indexOf(row);
                return (
                  <tr key={`row-${originalIndex}`} className="table-row">
                    <td className="row-header">{originalIndex + 1}</td>
                    {columns.map((column) => (
                      <td key={`cell-${originalIndex}-${column}`}>
                        <span className="cell-value">
                          {searchTerm && row[column].toLowerCase().includes(searchTerm.toLowerCase()) && 
                           (searchColumn === 'all' || searchColumn === column) ? (
                            <mark>{row[column]}</mark>
                          ) : (
                            row[column]
                          )}
                        </span>
                      </td>
                    ))}
                    <td className="action-cell">
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
        
        {filteredData.length === 0 && searchTerm && (
          <div className="no-results">
            <p>По запросу "{searchTerm}" ничего не найдено</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Редактирование строки {selectedRow.index + 1}</h2>
              <button onClick={handleCancel} className="close-button">&times;</button>
            </div>
            
            <div className="modal-content">
              <div className="row-editor">
                <div className="editor-info">
                  <p>Редактируете строку <strong>#{selectedRow.index + 1}</strong></p>
                </div>
                
                <div className="columns-editor">
                  {rowData.map((item, index) => (
                    <div key={item.id} className="column-editor-item">
                      <div className="column-label">
                        <span className="column-number">{ColumnName[item.columnNumber]}:</span>
                      </div>
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleModalChange(index, e.target.value)}
                        className="modal-input"
                        placeholder="Введите значение..."
                      />
                    </div>
                  ))}
                </div>
                
                <div className="modal-actions">
                  <button onClick={handleCancel} className="cancel-button">
                    Отмена
                  </button>
                  <button onClick={handleSave} className="save-button">
                    Сохранить изменения в строке
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