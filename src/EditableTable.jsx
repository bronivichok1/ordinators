import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditableTable.css';
import { 
  LogOut, 
  User, 
  Shield, 
  Menu,
  X
} from 'lucide-react';

const EditableTable = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create',
    selectedRow: null,
    rowData: [],
    otherUniversity: '',
    otherDocument: '',
    selectedPreparationForm: ['очная']
  });
  const [newRowData, setNewRowData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });

  // Генерация заголовков колонок
  const columns = Array.from({ length: 35 }, (_, i) => `column${i + 1}`);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user_data');
    
    if (!token || !userDataStr) {
      navigate('/');
      return;
    }
    
    try {
      const user = JSON.parse(userDataStr);
      
      const allowedRoles = ['admin', 'dispatcher', 'passportist', 'supervisor'];
      if (!allowedRoles.includes(user.role)) {
        navigate('/');
        return;
      }
      
      setUserData(user);
    } catch (error) {
      console.error('Ошибка парсинга user_data:', error);
      navigate('/');
    }
  }, [navigate]);

  const canEditTable = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher', 'passportist'].includes(userData.role);
  };
  
  const canCreateRow = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };
  
  const canEditRow = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher', 'passportist'].includes(userData.role);
  };
  
  const canDeleteRow = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };
  
  const canViewTable = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher', 'passportist', 'supervisor'].includes(userData.role);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  const goToAdminPanel = () => {
    navigate('/');
  };

  const initCreateRow = () => {
    if (!canCreateRow()) {
      alert('У вас нет прав для создания новой записи');
      return;
    }
    
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
    setModalState({
      isOpen: true,
      mode: 'create',
      selectedRow: null,
      rowData: [],
      otherUniversity: '',
      otherDocument: '',
      selectedPreparationForm: ['очная']
    });
  };

  const handleRowClick = (rowIndex, row) => {
    console.log('Клик по строке:', rowIndex, row);
    
    if (!canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }
    
    const rowValues = Object.entries(row).map(([columnName, value], colIndex) => ({
      id: colIndex,
      columnName: columnName,
      value: value,
      columnNumber: parseInt(columnName.replace('column', ''))
    }));
    
    // Извлекаем значения для полей "другое"
    let otherUni = '';
    let otherDoc = '';
    let prepForm = ['очная'];
    
    try {
      if (row['column12'] && !selectOptions.university.includes(row['column12'])) {
        otherUni = row['column12'];
      }
      if (row['column18'] && !selectOptions.identityDocument.includes(row['column18'])) {
        otherDoc = row['column18'];
      }
      if (row['column17']) {
        prepForm = JSON.parse(row['column17']);
      }
    } catch (e) {
      console.error('Ошибка парсинга данных:', e);
    }
    
    setModalState({
      isOpen: true,
      mode: 'edit',
      selectedRow: {
        index: rowIndex,
        originalIndex: data.indexOf(row)
      },
      rowData: rowValues,
      otherUniversity: otherUni,
      otherDocument: otherDoc,
      selectedPreparationForm: prepForm
    });
    
    setNewRowData({ ...row });
  };

  const handleDeleteRow = (rowIndex, row) => {
    if (!canDeleteRow()) {
      alert('У вас нет прав для удаления записей');
      return;
    }
    
    if (window.confirm(`Вы уверены, что хотите удалить строку ${rowIndex + 1}?`)) {
      const originalIndex = data.indexOf(row);
      const newData = [...data];
      newData.splice(originalIndex, 1);
      setData(newData);
    }
  };

  const handlePreparationFormChange = (option) => {
    const newSelection = [...modalState.selectedPreparationForm];
    if (newSelection.includes(option)) {
      const index = newSelection.indexOf(option);
      newSelection.splice(index, 1);
    } else {
      newSelection.push(option);
    }
    
    setModalState(prev => ({
      ...prev,
      selectedPreparationForm: newSelection
    }));
  };

  const handleModalChange = (column, value) => {
    if (modalState.mode === 'create') {
      setNewRowData({
        ...newRowData,
        [column]: value
      });
    } else {
      const updatedRowData = [...modalState.rowData];
      const itemIndex = updatedRowData.findIndex(item => item.columnName === column);
      
      if (itemIndex !== -1) {
        updatedRowData[itemIndex].value = value;
        setModalState(prev => ({
          ...prev,
          rowData: updatedRowData
        }));
        
        setNewRowData({
          ...newRowData,
          [column]: value
        });
      }
    }
  };

  const handleSave = () => {
    if (modalState.mode === 'create') {
      // Сохранение новой строки
      const processedData = { ...newRowData };
      
      if (processedData['column12'] === 'другое' && modalState.otherUniversity) {
        processedData['column12'] = modalState.otherUniversity;
      }
      
      if (processedData['column18'] === 'иное' && modalState.otherDocument) {
        processedData['column18'] = modalState.otherDocument;
      }
      
      processedData['column17'] = JSON.stringify(modalState.selectedPreparationForm);
      
      const newRow = { ...processedData };
      const newData = [...data, newRow];
      setData(newData);
    } else {

      const updatedData = [...data];
      const updatedRow = {};
      
      modalState.rowData.forEach(item => {
        updatedRow[item.columnName] = item.value;
      });
      
      if (updatedRow['column12'] === 'другое' && modalState.otherUniversity) {
        updatedRow['column12'] = modalState.otherUniversity;
      }
      
      if (updatedRow['column18'] === 'иное' && modalState.otherDocument) {
        updatedRow['column18'] = modalState.otherDocument;
      }
      
      updatedRow['column17'] = JSON.stringify(modalState.selectedPreparationForm);
      
      updatedData[modalState.selectedRow.originalIndex] = updatedRow;
      setData(updatedData);
    }
    
    handleCancel();
  };

  const handleCancel = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      selectedRow: null,
      rowData: [],
      otherUniversity: '',
      otherDocument: '',
      selectedPreparationForm: ['очная']
    });
    setNewRowData({});
  };

  const handleSort = (columnKey) => {
    let direction = 'ascending';
    
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

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
    setSortConfig({ key: null, direction: 'ascending' });
  };

  const renderModalField = (columnName, columnNumber, isEditMode = false, currentValue = '') => {
    const fieldName = ColumnName[columnNumber];
    const columnKey = `column${columnNumber}`;
    const value = isEditMode ? currentValue : (newRowData[columnKey] || '');

    const handleChange = (newValue) => {
      if (isEditMode) {
        handleModalChange(columnKey, newValue);
      } else {
        setNewRowData({
          ...newRowData,
          [columnKey]: newValue
        });
      }
    };

    switch(fieldName) {
      case 'Пол':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
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
              onChange={(e) => handleChange(e.target.value)}
              className="modal-select"
            >
              {selectOptions.dismissalReason.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {value === 'иное' && (
              <input
                type="text"
                value={modalState.otherUniversity}
                onChange={(e) => setModalState(prev => ({ ...prev, otherUniversity: e.target.value }))}
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
            onChange={(e) => handleChange(e.target.value)}
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
              onChange={(e) => handleChange(e.target.value)}
              className="modal-select"
            >
              {selectOptions.university.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {value === 'другое' && (
              <input
                type="text"
                value={modalState.otherUniversity}
                onChange={(e) => setModalState(prev => ({ ...prev, otherUniversity: e.target.value }))}
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
                  checked={modalState.selectedPreparationForm.includes(option)}
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
              onChange={(e) => handleChange(e.target.value)}
              className="modal-select"
            >
              {selectOptions.identityDocument.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {value === 'иное' && (
              <input
                type="text"
                value={modalState.otherDocument}
                onChange={(e) => setModalState(prev => ({ ...prev, otherDocument: e.target.value }))}
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
            onChange={(e) => handleChange(e.target.value)}
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
            onChange={(e) => handleChange(e.target.value)}
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
            onChange={(e) => handleChange(e.target.value)}
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
            onChange={(e) => handleChange(e.target.value)}
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
            onChange={(e) => handleChange(e.target.value)}
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
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
          />
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
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="Введите значение..."
          />
        );
    }
  };

  if (!userData) {
    return (
      <div className="table-page">
        <div className="loading-users">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="table-page">
      <header className="user-header">
        <div className="header-left">
          <div 
            className="user-profile-button" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <div className="user-name">{userData.fio || userData.login}</div>
              <div className="user-role">
                <span className={`role-badge role-${userData.role}`}>
                  {userData.role === 'admin' ? 'Администратор' : 
                  userData.role === 'dispatcher' ? 'Диспетчер' :
                  userData.role === 'passportist' ? 'Паспортист' :
                  userData.role === 'supervisor' ? 'Руководитель' : 'Пользователь'}
                </span>
              </div>
            </div>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="menu-section">
                  <div className="menu-header">Управление</div>
                  <div className="menu-item" onClick={() => setShowUserMenu(false)}>
                    <User size={16} />
                    <span>Мой профиль</span>
                  </div>
                  {userData.role === 'admin' && (
                    <div className="menu-item" onClick={goToAdminPanel}>
                      <Shield size={16} />
                      <span>Панель администратора</span>
                    </div>
                  )}
                </div>
                <div className="menu-divider"></div>
                <div className="menu-section">
                  <div className="menu-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Выйти из системы</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="header-center">
          <div className="app-title">
            <h1>Система управления ординаторами</h1>
            <p>Таблица данных клинических ординаторов</p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions">
            {(userData.role === 'admin'||userData.role === 'dispatcher') && (
              <button className="admin-panel-button" onClick={goToAdminPanel}>
                <Shield size={18} />
                <span>Админ-панель</span>
              </button>
            )}
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Выйти</span>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-user-info">
              <div className="user-avatar">
                <User size={24} />
              </div>
              <div className="user-details">
                <div className="user-name">{userData.fio || userData.login}</div>
                <div className="user-role">
                  <span className={`role-badge role-${userData.role}`}>
                    <span className={`role-badge role-${userData.role}`}>
                      {userData.role === 'admin' ? 'Администратор' : 
                      userData.role === 'dispatcher' ? 'Диспетчер' :
                      userData.role === 'passportist' ? 'Паспортист' :
                      userData.role === 'supervisor' ? 'Руководитель' : 'Пользователь'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mobile-menu-items">
              <div className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                <User size={20} />
                <span>Мой профиль</span>
              </div>
              
              {userData.role === 'admin' && (
                <div className="mobile-menu-item" onClick={goToAdminPanel}>
                  <Shield size={20} />
                  <span>Панель администратора</span>
                </div>
              )}
              
              <div className="menu-divider"></div>
              
              <div className="mobile-menu-item logout-item" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Выйти из системы</span>
              </div>
            </div>
          </div>
        )}
      </header>

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
            {canCreateRow() && (
              <button 
                onClick={initCreateRow}
                className="create-row-button"
                title="Создать новую запись"
              >
                📋 Создать
              </button>
            )}
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
                      {canEditRow() && (
                        <button 
                          onClick={() => handleRowClick(originalIndex, row)}
                          className="edit-row-button"
                          title="Редактировать эту строку"
                        >
                          ✏️ Редактировать
                        </button>
                      )}
                      {canDeleteRow() && (
                        <button 
                          onClick={() => handleDeleteRow(originalIndex, row)}
                          className="delete-row-button"
                          title="Удалить эту строку"
                        >
                          🗑️ Удалить
                        </button>
                      )}
                      {!canEditRow() && !canDeleteRow() && (
                        <div className="no-actions">Только просмотр</div>
                      )}
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

      {/* Универсальное модальное окно */}
      {modalState.isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {modalState.mode === 'create' 
                  ? 'Создание нового ординатора' 
                  : `Редактирование ординатора #${modalState.selectedRow?.index + 1}`}
              </h2>
              <button onClick={handleCancel} className="close-button">&times;</button>
            </div>
            
            <div className="modal-content">
              <div className="row-editor">
                <div className="editor-info">
                  <p>
                    {modalState.mode === 'create' 
                      ? 'Заполните данные нового ординатора' 
                      : 'Редактирование данных ординатора'}
                  </p>
                  {modalState.mode === 'edit' && (
                    <p className="editor-note">ID строки: {modalState.selectedRow?.index + 1}</p>
                  )}
                </div>
                
                <div className="columns-editor">
                  {columns.map((column, index) => {
                    const columnNumber = parseInt(column.replace('column', ''));
                    const fieldName = ColumnName[columnNumber];
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
                  <button onClick={handleSave} className="save-button">
                    {modalState.mode === 'create' ? 'Создать ординатора' : 'Сохранить изменения'}
                  </button>
                  <button onClick={handleCancel} className="cancel-button-modal">
                    Отмена
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