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

import {
  getOrdinators,
  createOrdinator,
  updateOrdinator,
  deleteOrdinator,
} from './api/ordinators.api';

import {
  mapOrdinatorDtoToTableRow,
  mapTableRowToOrdinatorDto,
} from './mappers/ordinator.mapper';

const EditableTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]); 
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null); 
  const [modalRow, setModalRow] = useState(null);   
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [otherUniversity, setOtherUniversity] = useState('');
  const [otherDocument, setOtherDocument] = useState('');
  const [selectedEducationForm, setSelectedEducationForm] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');

 const columns = [
  'id',
  'fullNameRu',
  'fullNameEn',
  'birthDate',
  'gender',
  'country',
  'mobile',
  'email',
  'dateEnrollment',
  'numberEnrollment',
  'dateExpulsion',
  'numberExpulsion',
  'reasonExpulsion',
  'vacationCause',
  'vacationDuration',
  'universityName',
  'graduationYear',
  'department',
  'profile',
  'speciality',
  'educationForm',
  'docType',
  'pasnumber',
  'livingPlace',
  'registrationDeadline',
  'agreement',
  'medicalcertificate',
  'rivshcertificate',
  'invite',
  'controlDate',
  'controlResult',
  'teacher',
  'sessionStart',
  'sessionEnd',
  'moneyStart',
  'moneyEnd',
  'distribution'
];

const ColumnName = {
  id: 'ID',
  fullNameRu: 'ФИО',
  fullNameEn: 'ФИО (EN)',
  birthDate: 'Дата рождения',
  gender: 'Пол',
  country: 'Страна',
  dateEnrollment: 'Дата зачисления',
  dateExpulsion: 'Дата отчисления',
  reasonExpulsion: 'Причина отчисления',
  vacationCause: 'Социальный отпуск',
  vacationDuration: 'Срок нахождения в социальном отпуске',
  mobile: 'Мобильный телефон',
  email: 'Aдрес электронной почты',
  universityName: 'ВУЗ',
  graduationYear: 'Год окончания',
  department: 'Кафедра',
  profile: 'Профиль специальности',
  speciality: 'Специальность',
  educationForm: 'Форма подготовки',
  docType: 'Документ, удостоверяющий личность',
  pasnumber: 'Идентификационный номер',
  livingPlace: 'Место проживания, регистрации',
  registrationDeadline: 'Срок окончания регистрации',
  numberEnrollment: 'Номер приказа о зачислении',
  numberExpulsion: 'Номер приказа об отчислении',
  agreement: 'Договор, дополнительное соглашение',
  medicalcertificate: 'Мед. справка',
  controlDate: 'Дата текущего контроля',
  controlResult: 'Текущий контроль',
  login: 'Логин',
  password: 'Пароль',
  teacher: 'Руководитель ординатора',
  sessionStart: 'Дата сессии (начало)',
  sessionEnd: 'Дата сессии (окончание)',
  moneyStart: 'Дата установки надбавки',
  moneyEnd: 'Дата окончания надбавки',
  rivshcertificate: 'Наличие сертификата РИВШ',
  invite: 'Въезд по приглашению',
  distribution: 'Распределение клинических ординаторов'
};

  const selectOptions = {
    gender: ['М', 'Ж'],
    reasonExpulsion: [
      'по окончанию срока подготовки',
      'за неуплату подготовки',
      'по собственному желанию',
      'отсутствие на занятиях',
      'иное'
    ],
    vacationCause: [
      'по беременности и родам',
      'по уходу за ребёнком',
      'мед показаниям',
      'служба в армии'
    ],
    universityName: [
      'БГМУ',
      'ВГМУ',
      'ГрГМУ',
      'ГомГМУ',
      'другое'
    ],
    educationForm: [
      'заочная',
      'очная',
      'платно',
      'за счёт бюджета'
    ],
    docType: [
      'паспорт',
      'вид на жительство',
      'паспорт ИГ',
      'иное'
    ],
    livingPlace: [
      'общежитие',
      'квартира'
    ],
    medicalcertificate: ['есть', 'нет'],
    rivshcertificate: ['да', 'нет'],
    invite: ['да', 'нет']
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });

  // Проверяем авторизацию при загрузке
 useEffect(() => {
  const token = localStorage.getItem('auth_token');
  const dataStr = localStorage.getItem('user_data');

  if (!token || !dataStr) {
    navigate('/');
    return;
  }

  let user;
  try {
    user = JSON.parse(dataStr);
    setUserData(user);
  } catch {
    navigate('/');
    return;
  }

  (async () => {
    setIsLoading(true);
    try {
      const realToken = localStorage.getItem('auth_token');
      const ordinators = await getOrdinators(realToken);
      const rows = ordinators.map(mapOrdinatorDtoToTableRow);
      setData(rows);
    } catch (e) {
      console.error('Ошибка загрузки ординаторов', e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  })();
}, [navigate]);


// Открыть модалку для создания
const openCreateModal = () => {
  const emptyRow = {};
  columns.forEach(col => { emptyRow[col] = ''; });
  emptyRow.gender = 'М';
  emptyRow.universityName = 'БГМУ';
  emptyRow.educationForm = JSON.stringify(['очная']);
  setModalRow(emptyRow);
  setModalMode('create');
  setModalRow(emptyRow);
  setModalMode('create');
};

// Открыть модалку для редактирования
const openEditModal = (row) => {
  setModalRow({ ...row });
  setModalMode('edit');
};

// Закрыть модалку
const closeModal = () => {
  setModalRow(null);
  setModalMode(null);
  setOtherUniversity('');
  setOtherDocument('');
  setSelectedEducationForm([]);
};

// Универсальный хендлер изменения полей модалки
const handleModalChange = (column, value) => {
  setModalRow(prev => ({ ...prev, [column]: value }));
};

// Выход из системы
const handleLogout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  navigate('/');
};

const goToAdminPanel = () => {
  navigate('/');
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

const filteredData = Array.isArray(data)
  ? data.filter(row => {
      if (!searchTerm.trim()) return true;

      if (searchColumn === 'all') {
        return Object.values(row).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        return row[searchColumn]
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
    })
  : [];

const sortedFilteredData = getSortedData(filteredData);

const getSortIcon = (columnKey) => {
  if (sortConfig.key !== columnKey) {
    return '↕️'; 
  }
  return sortConfig.direction === 'ascending' ? '↑' : '↓';
};

  // Открытие модалки при клике на строку (редактирование)
const handleRowClick = (rowIndex, row) => {
  // rowIndex здесь — индекс в sortedFilteredData; мы используем сам объект row
  openEditModal(row);
};
 
const handleDeleteRow = async (rowIndex, row) => {
  if (!window.confirm(`Вы уверены, что хотите удалить строку ${rowIndex + 1}?`)) return;

  try {
    const token = localStorage.getItem('auth_token');
    await deleteOrdinator(row.id, token);
    setData(prev => prev.filter(r => r.id !== row.id));
  } catch (e) {
    console.error('Ошибка удаления', e);
  }
};

const handleEducationFormChange = (option) => {
  const newSelection = [...selectedEducationForm];
  if (newSelection.includes(option)) {
    const index = newSelection.indexOf(option);
    newSelection.splice(index, 1);
  } else {
    newSelection.push(option);
  }
  setSelectedEducationForm(newSelection);
};

const handleSave = async () => {
  try {
    if (!modalRow) return;
    const processed = { ...modalRow };
    const dto = mapTableRowToOrdinatorDto(processed);
    const token = localStorage.getItem('auth_token');

    if (modalMode === 'create') {
      const created = await createOrdinator(dto, token);
      const createdRow = mapOrdinatorDtoToTableRow(created);
      setData(prev => [...prev, createdRow]);
    } else if (modalMode === 'edit') {
      const id = processed.id;
      const updated = await updateOrdinator(id, dto, token);
      const updatedRow = mapOrdinatorDtoToTableRow(updated);
      setData(prev => prev.map(r => (r.id === id ? updatedRow : r)));
    }

    closeModal();
  } catch (e) {
    console.error('Ошибка сохранения ординатора', e);
  }
};

const handleCancel = () => {
  setSelectedRow(null);
  setOtherUniversity('');
  setOtherDocument('');
  setSelectedEducationForm([]);
};

const handleResetSearch = () => {
  setSearchTerm('');
  setSearchColumn('all');
  setSortConfig({ key: null, direction: 'ascending' });
};

function formatCell(column, value) {
  if (column === 'medicalCertificate' ||
      column === 'rivshCertificate' ||
      column === 'invite') {
    return value ? 'Да' : 'Нет';
  }
  return value;
}

const renderCreateField = (columnKey, value, onChange) => {
  const label = ColumnName[columnKey];

  switch (label) {
    case 'Пол':
      return (
        <select
          value={value}
          onChange={(e) => onChange(columnKey, e.target.value)}
          className="modal-select"
        >
          {selectOptions.gender.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );

    case 'ВУЗ':
      return (
        <div className="university-select-container">
          <select
            value={value}
            onChange={(e) => onChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.universityName.map(option => (
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

    case 'Документ, удостоверяющий личность':
      return (
        <div className="document-select-container">
          <select
            value={value}
            onChange={(e) => onChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.docType.map(option => (
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

    case 'Форма подготовки':
      return (
        <div className="checkbox-group">
          {selectOptions.educationForm.map(option => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedEducationForm.includes(option)}
                onChange={() => {
                  handleEducationFormChange(option);

                  const updated = selectedEducationForm.includes(option)
                    ? selectedEducationForm.filter(o => o !== option)
                    : [...selectedEducationForm, option];

                  onChange(columnKey, JSON.stringify(updated));
                }}
                className="modal-checkbox"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    
    case 'Причина отчисления':
      return (
        <div className="university-select-container">
          <select 
            value={value}
            onChange={(e) => onChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.reasonExpulsion.map(option => (
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
          onChange={(e) => onChange(columnKey, e.target.value)}
          className="modal-select"
        >
          {selectOptions.vacationCause.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );

    case 'Мед. справка':
    case 'Наличие сертификата РИВШ':
    case 'Въезд по приглашению':
      return (
        <select
          value={value ? 'Y' : 'N'}
          onChange={(e) => onChange(columnKey, e.target.value === 'Y')}
          className="modal-select"
        >
          <option value="Y">Да</option>
          <option value="N">Нет</option>
        </select>
      );

    case 'Дата рождения':
    case 'Дата зачисления':
    case 'Дата отчисления':
    case 'Год окончания':
    case 'Срок окончания регистрации':
    case 'Дата сессии (начало)':
    case 'Дата сессии (окончание)':
    case 'Дата установки надбавки':
    case 'Дата окончания надбавки':
    case 'Дата текущего контроля':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(columnKey, e.target.value)}
          className="modal-input"
        />
      );
    
    case 'Мобильный телефон':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(columnKey, e.target.value)}
            className="modal-input"
            placeholder="+375XXXXXXXXX"
          />
        );
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(columnKey, e.target.value)}
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
                   userData.role === 'manager' ? 'Менеджер' : 'Пользователь'}
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
            {userData.role === 'admin' && (
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
                    {userData.role === 'admin' ? 'Администратор' : 
                     userData.role === 'manager' ? 'Менеджер' : 'Пользователь'}
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
              {columns.map((col) => (
                <option key={col} value={col}>
                  {ColumnName[col]}
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
              onClick={openCreateModal}
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
                {searchColumn !== 'all' && ` (поиск в колонке "${ColumnName[searchColumn]}")`}
              </p>
            )}
            {sortConfig.key && (
              <p className="sort-info">
                Сортировка по: <strong>{ColumnName[sortConfig.key]}</strong>
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
                
                {columns.map((col) => (
                  <th
                    key={col}
                    className="column-header sticky-top sortable-header"
                    onClick={() => handleSort(col)}
                    title={`Сортировать по ${ColumnName[col] || col}`}
                  >
                    <div className="header-content">
                      <span className="header-text">{ColumnName[col] || col}</span>
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
                  <tr key={`row-${row.id ?? originalIndex}`} className="table-row">
                    <td className="row-header sticky-left">
                      <div className="id-cell">{row.id}</div>
                    </td>
                    
                    {columns.map((column) => {
                      const cell = row[column] ?? '';
                      const match =
                        searchTerm &&
                        cell.toString().toLowerCase().includes(searchTerm.toLowerCase()) &&
                        (searchColumn === 'all' || searchColumn === column);

                      return (
                        <td key={`cell-${originalIndex}-${column}`}>
                          <span className="cell-value">
                            {match ? <mark>{formatCell(column, cell)}</mark> : formatCell(column, cell)}
                          </span>
                        </td>
                      );
                    })}
                    
                    <td className="action-cell sticky-right">
                      <button 
                        onClick={() => openEditModal(row)}
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

      {modalMode && modalRow && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h2>{modalMode === 'edit' ? 'Редактирование ординатора' : 'Создание нового ординатора'}</h2>
        <button onClick={closeModal} className="close-button">&times;</button>
      </div>

      <div className="modal-content">
        <div className="row-editor">
          <div className="editor-info">
            <p>{modalMode === 'edit' ? 'Измените данные ординатора' : 'Заполните данные нового ординатора'}</p>
          </div>

          <div className="columns-editor">
          {columns
            .filter((key) => key !== 'id') 
            .map((columnKey) => (
              <div key={columnKey} className="column-editor-item">
                <div className="column-label">
                  {ColumnName[columnKey]}
                </div>
                {renderCreateField(columnKey, modalRow[columnKey], handleModalChange)}
              </div>
          ))}
          </div>

          <div className="modal-actions">
            <button onClick={closeModal} className="cancel-button">Отмена</button>
            <button onClick={handleSave} className="save-button">
              {modalMode === 'edit' ? 'Сохранить изменения' : 'Создать ординатора'}
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