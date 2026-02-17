import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import './EditableTable.css';
import { 
  LogOut, 
  User, 
  Shield, 
  Menu,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, TextRun, Paragraph } from 'docx';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;
  const BASE_API_URL = `${API_URL}`;
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [exportData, setExportData] = useState([]); 
  const [selectedRowForExport, setSelectedRowForExport] = useState(null);

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
    'Дата начала социального отпуска',
    'Дата окончания социального отпуска',
    'Мобильный телефон',
    'ВУЗ',
    'Год окончания',
    'Кафедра',
    'Профиль специальности',
    'Специальность',
    'Форма подготовки',
    'Документ, удостоверяющий личность',
    'Номер документа',
    'Идентификационный номер',
    'Место проживания, регистрации',
    'Адрес проживания',
    'Срок окончания регистрации',
    'Номер приказа о зачислении',
    'Дата приказа о зачислении',
    'Номер приказа об отчислении',
    'Дата приказа об отчислении',
    'Договор, дополнительное соглашение',
    'Медицинская справка',
    'Текущий контроль',
    'Логин',
    'Пароль',
    'Руководитель ординатора',
    'Дата начала сессии(циклов)',
    'Дата окончания сессии(циклов)',
    'Дата установки надбавки',
    'Дата окончания надбавки',
    'Наличие сертификата РИВШ',
    'Въезд по приглашению',
    'Распределение клинических ординаторов',
  ];
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
    medicalCertificate: ['есть', 'нет'],
    rivshCertificate: ['да', 'нет'],
    entryByInvitation: ['да', 'нет'],
    country: [
      'Беларусь',
      'Россия',
      'Украина',
      'Казахстан',
      'Азербайджан',
      'Армения',
      'Грузия',
      'Молдова',
      'Таджикистан',
      'Туркменистан',
      'Узбекистан',
      'Литва',
      'Латвия',
      'Эстония',
      'Польша',
      'Другая'
    ]
  };

  const [selectData, setSelectData] = useState({
    departments: [],
    specialtyProfiles: [],
    countries: selectOptions.country
  });

  const [data, setData] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create',
    selectedRow: null,
    rowData: [],
    otherUniversity: '',
    otherDocument: '',
    otherCountry: '',
    selectedPreparationForm: ['очная']
  });
  
  const [newRowData, setNewRowData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
    medicalcertificate: ['есть', 'нет'],
    rivshcertificate: ['да', 'нет'],
    invite: ['да', 'нет']
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });

  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const config = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        navigate('/');
        throw new Error('Не авторизован');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка ${response.status}`);
      }

      if (method === 'DELETE') {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const transformApiDataToTable = (apiData) => {
    return apiData.map((ordinator) => {
      const row = {};
      
      // Основные поля
      row.column1 = ordinator.fio || '';
      row.column2 = ordinator.fioEn || '';
      row.column3 = ordinator.birthYear || '';
      row.column4 = ordinator.gender || 'М';
      row.column5 = ordinator.country || '';
      row.column6 = ordinator.enrollmentDate || '';
      row.column7 = ordinator.dismissalDate || '';
      row.column8 = ordinator.dismissalReason || '';
      row.column9 = ordinator.socialLeave || '';
      
      // Социальный отпуск (отдельные поля)
      row.column10 = ordinator.socialLeaveStart || '';
      row.column11 = ordinator.socialLeaveEnd || '';
      
      row.column12 = ordinator.mobilePhone || '';
      
      // Университет (из связанной сущности)
      if (ordinator.university) {
        row.column13 = ordinator.university.name || 'БГМУ';
        row.column14 = ordinator.university.graduationYear || '';
        row.column15 = ordinator.university.department || '';
        row.column16 = ordinator.university.specialtyProfile || '';
        row.column17 = ordinator.university.specialty || '';
        row.column18 = ordinator.university.preparationForm || JSON.stringify(['очная']);
      } else {
        row.column13 = 'БГМУ';
        row.column14 = '';
        row.column15 = '';
        row.column16 = '';
        row.column17 = '';
        row.column18 = JSON.stringify(['очная']);
      }
      
      // Документы
      row.column19 = ordinator.identityDocument || 'паспорт';
      row.column20 = ordinator.documentNumber || '';
      row.column21 = ''; // Идентификационный номер (нет в сущности)
      row.column22 = ordinator.residenceAddress || 'общежитие';
      row.column23 = ordinator.livingAddress || ''; 
      row.column24 = ordinator.registrationExpiry || '';
      
      row.column25 = ordinator.enrollmentOrderNumber || '';
      row.column26 = ordinator.enrollmentOrderDate || '';
      row.column27 = ordinator.dismissalOrderNumber || '';
      row.column28 = ordinator.dismissalOrderDate || '';
      
      row.column29 = ordinator.contractInfo || '';
      row.column30 = ordinator.medicalCertificate || 'есть';
      
      // берем строку из объекта
      if (ordinator.currentControl) {
        // Если это объект, берем его поле scores
        if (typeof ordinator.currentControl === 'object') {
          row.column31 = ordinator.currentControl.scores || '';
        } else {
          row.column31 = String(ordinator.currentControl) || '';
        }
      } else {
        row.column31 = '';
      }
      
      row.column32 = ordinator.login || '';
      row.column33 = ordinator.password; 
      row.column34 = ordinator.supervisorId ? String(ordinator.supervisorId) : '';
      
      // Сессии 
      if (ordinator.session) {
        row.column35 = ordinator.session.sessionStart || '';
        row.column36 = ordinator.session.sessionEnd || '';
      } else {
        row.column35 = '';
        row.column36 = '';
      }
      
      // Надбавки 
      if (ordinator.money) {
        row.column37 = ordinator.money.allowanceStartDate || '';
        row.column38 = ordinator.money.allowanceEndDate || '';
      } else {
        row.column37 = '';
        row.column38 = '';
      }
      
      row.column39 = ordinator.rivshCertificate || 'нет';
      row.column40 = ordinator.entryByInvitation || 'нет';
      row.column41 = ordinator.distributionInfo || '';
      
      return {
        ...row,
        id: ordinator.id,
        originalData: ordinator
      };
    });
  };

  const transformTableDataToApi = (tableData, mode = 'create') => {
    const apiData = {
      fio: tableData.column1 || '',
      fioEn: tableData.column2 || '',
      birthYear: tableData.column3 || null,
      gender: tableData.column4 || 'М',
      country: tableData.column5 || 'Беларусь',
      enrollmentDate: tableData.column6 || null,
      dismissalDate: tableData.column7 || null,
      dismissalReason: tableData.column8 || '',
      socialLeave: tableData.column9 || '',
      socialLeaveStart: tableData.column10 || null,
      socialLeaveEnd: tableData.column11 || null,
      mobilePhone: tableData.column12 || '',
      
      universityName: tableData.column13 || 'БГМУ',
      graduationYear: tableData.column14 || '',
      department: tableData.column15 || '',
      specialtyProfile: tableData.column16 || '',
      specialty: tableData.column17 || '',
      preparationForm: JSON.stringify(modalState.selectedPreparationForm),
      
      identityDocument: tableData.column19 || 'паспорт',
      documentNumber: tableData.column20 || '',
      identNumber: tableData.column21 || '',
      residenceAddress: tableData.column22 || 'общежитие',
      livingAddress: tableData.column23 || '',
      registrationExpiry: tableData.column24 || null,
      
      enrollmentOrderNumber: tableData.column25 || '',
      enrollmentOrderDate: tableData.column26 || null,
      dismissalOrderNumber: tableData.column27 || '',
      dismissalOrderDate: tableData.column28 || null,
      
      contractInfo: tableData.column29 || '',
      medicalCertificate: tableData.column30 || 'есть',
      
      scores: tableData.column31 || '',
      
      login: tableData.column32 || '',
      password: tableData.column33 || '',
      supervisorId: tableData.column34 ? parseInt(tableData.column34) : null,
      
      sessionStart: tableData.column35 || null,
      sessionEnd: tableData.column36 || null,
      
      allowanceStartDate: tableData.column37 || null,
      allowanceEndDate: tableData.column38 || null,
      
      rivshCertificate: tableData.column39 || 'нет',
      entryByInvitation: tableData.column40 || 'нет',
      distributionInfo: tableData.column41 || ''
    };

  
    if (tableData.column13 === 'другое' && modalState.otherUniversity) {
      apiData.universityName = modalState.otherUniversity;
    }
  
    if (tableData.column19 === 'иное' && modalState.otherDocument) {
      apiData.identityDocument = modalState.otherDocument;
    }
  
    if (tableData.column8 === 'иное' && modalState.otherUniversity) {
      apiData.dismissalReason = modalState.otherUniversity;
    }
  
    Object.keys(apiData).forEach(key => apiData[key] === undefined && delete apiData[key]);
  
    return apiData;
  };

  const loadSelectData = async () => {
    try {
      const mockDepartments = [
        'Терапевтическая кафедра',
        'Хирургическая кафедра',
        'Педиатрическая кафедра',
        'Стоматологическая кафедра',
        'Неврологическая кафедра',
        'Офтальмологическая кафедра',
        'Отоларингологическая кафедра'
      ];
      
      const mockSpecialtyProfiles = [
        'Терапия',
        'Хирургия',
        'Педиатрия',
        'Стоматология',
        'Неврология',
        'Офтальмология',
        'Отоларингология',
        'Кардиология',
        'Гастроэнтерология',
        'Эндокринология'
      ];
      
      setSelectData(prev => ({
        ...prev,
        departments: mockDepartments,
        specialtyProfiles: mockSpecialtyProfiles
      }));
    } catch (error) {
      console.error('Error loading select data:', error);
    }
  };

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
      fetchOrdinators();
      loadSelectData();
    } catch (error) {
      console.error('Ошибка парсинга user_data:', error);
      navigate('/');
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

  const fetchOrdinators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/ordinators');
      const transformedData = transformApiDataToTable(response);
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching ordinators:', error);
      setError('Не удалось загрузить данные. Проверьте соединение с сервером.');
    } finally {
      setLoading(false);
    }
  };

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

  const initCreateRow = () => {
    if (!canCreateRow()) {
      alert('У вас нет прав для создания новой записи');
      return;
    }
    
    const initialRowData = {};
    for (let i = 1; i <= 40; i++) {
      const columnKey = `column${i}`;
      const fieldName = ColumnName[i];
      
      switch(fieldName) {
        case 'Пол':
          initialRowData[columnKey] = 'М';
          break;
        case 'Причина отчисления':
          initialRowData[columnKey] = 'по окончанию срока подготовки';
          break;
        case 'Социальный отпуск':
          initialRowData[columnKey] = '';
          break;
        case 'ВУЗ':
          initialRowData[columnKey] = 'БГМУ';
          break;
        case 'Форма подготовки':
          initialRowData[columnKey] = JSON.stringify(['очная']);
          break;
        case 'Документ, удостоверяющий личность':
          initialRowData[columnKey] = 'паспорт';
          break;
        case 'Место проживания, регистрации':
          initialRowData[columnKey] = 'общежитие';
          break;
        case 'Мед. справка':
          initialRowData[columnKey] = 'есть';
          break;
        case 'Наличие сертификата РИВШ':
          initialRowData[columnKey] = 'нет';
          break;
        case 'Въезд по приглашению':
          initialRowData[columnKey] = 'нет';
          break;
        case 'Страна':
          initialRowData[columnKey] = 'Беларусь';
          break;
        default:
          initialRowData[columnKey] = '';
      }
    }
    
    setNewRowData(initialRowData);
    setModalState({
      isOpen: true,
      mode: 'create',
      selectedRow: null,
      rowData: [],
      otherUniversity: '',
      otherDocument: '',
      otherCountry: '',
      selectedPreparationForm: ['очная']
    });
  };

  const handleRowClick = async (rowIndex, row) => {
    if (!canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }
    
    try {
      const response = await apiRequest(`/ordinators/${row.id}`);
      const ordinator = response;
      
      const rowValues = [];
      for (let i = 1; i <= 40; i++) {
        const columnKey = `column${i}`;
        const value = row[columnKey] || '';
        rowValues.push({
          id: i,
          columnName: columnKey,
          value: value,
          columnNumber: i
        });
      }
      
      let otherUni = '';
      let otherDoc = '';
      let prepForm = ['очная'];
      
      if (row['column13'] && !selectOptions.university.includes(row['column13'])) {
        otherUni = row['column13'];
      }
      if (row['column19'] && !selectOptions.identityDocument.includes(row['column19'])) {
        otherDoc = row['column19'];
      }
      
      try {
        if (row['column18']) {
          prepForm = JSON.parse(row['column18']);
        }
      } catch (e) {
        console.error('Ошибка парсинга данных:', e);
      }
      
      setModalState({
        isOpen: true,
        mode: 'edit',
        selectedRow: {
          index: rowIndex,
          id: row.id,
          originalIndex: data.indexOf(row)
        },
        rowData: rowValues,
        otherUniversity: otherUni,
        otherDocument: otherDoc,
        otherCountry: '',
        selectedPreparationForm: prepForm
      });
      
      setNewRowData({ ...row });
    } catch (error) {
      console.error('Error fetching ordinator details:', error);
      alert('Не удалось загрузить данные для редактирования');
    }
  };

  const handleDeleteRow = async (rowIndex, row) => {
    if (!canDeleteRow()) {
      alert('У вас нет прав для удаления записей');
      return;
    }
    
    if (window.confirm(`Вы уверены, что хотите удалить запись "${row.column1}"?`)) {
      try {
        await apiRequest(`/ordinators/${row.id}`, 'DELETE');
        await fetchOrdinators();
        alert('Запись успешно удалена');
      } catch (error) {
        console.error('Error deleting ordinator:', error);
        alert('Не удалось удалить запись');
      }
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
    const valueToSet = value && typeof value === 'object' && value.value !== undefined 
      ? value.value 
      : value;

    if (modalState.mode === 'create') {
      setNewRowData({
        ...newRowData,
        [column]: valueToSet
      });
    } else {
      const updatedRowData = [...modalState.rowData];
      const itemIndex = updatedRowData.findIndex(item => item.columnName === column);
      
      if (itemIndex !== -1) {
        updatedRowData[itemIndex].value = valueToSet;
        setModalState(prev => ({
          ...prev,
          rowData: updatedRowData
        }));
        
        setNewRowData({
          ...newRowData,
          [column]: valueToSet
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      let apiData;
      
      if (modalState.mode === 'create') {
        apiData = transformTableDataToApi(newRowData, 'create');
        await apiRequest('/ordinators', 'POST', apiData);
        alert('Ординатор успешно создан');
      } else {
        const rowDataObj = {};
        modalState.rowData.forEach(item => {
          rowDataObj[item.columnName] = item.value;
        });
        
        apiData = transformTableDataToApi(rowDataObj, 'update');
        await apiRequest(`/ordinators/${modalState.selectedRow.id}`, 'PATCH', apiData);
        alert('Данные успешно обновлены');
      }
      
      await fetchOrdinators();
      handleCancel();
    } catch (error) {
      console.error('Error saving ordinator:', error);
      alert(`Ошибка сохранения: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleCancel = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      selectedRow: null,
      rowData: [],
      otherUniversity: '',
      otherDocument: '',
      otherCountry: '',
      selectedPreparationForm: ['очная']
    });
    setNewRowData({});
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
    setSortConfig({ key: null, direction: 'ascending' });
  };

 // чтобы экспорт соответствовал тому, что видит пользователь
const prepareDataForExport = () => {
  const rows = sortedFilteredData.length ? sortedFilteredData : data;

  return rows.map(row => {
    const result = {};

    for (let i = 1; i <= 41; i++) {
      const columnKey = `column${i}`;
      result[columnKey] = row[columnKey] || '';
    }

    return result;
  });
};

const convertRow = (row) => {
  const result = {};
  for (let i = 1; i <= 41; i++) {
    const key = `column${i}`;
    const label = ColumnName[i] || `Поле ${i}`;
    result[label] = row[key] || "";
  }
  return result;
};

const exportToExcel = (rows) => {
  try {
    if (!rows.length) {
      alert("Нет данных для экспорта");
      return;
    }

    const labeledRows = rows.map(convertRow);
    const worksheet = XLSX.utils.json_to_sheet(labeledRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ординаторы");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const filename =
      rows.length === 1
        ? `${rows[0].column1 || "ordinator"}.xlsx`
        : "ordinators.xlsx";
    saveAs(blob, filename);

  } catch (error) {
    console.error("Ошибка экспорта Excel:", error);
    alert("Не удалось экспортировать данные в Excel");
  }
};

const exportToWord = async (rows) => {
  try {
    if (!rows.length) {
      alert("Нет данных для экспорта");
      return;
    }

    const paragraphs = [];
    paragraphs.push(
      new Paragraph({
        text: rows.length === 1 
          ? "Анкета клинического ординатора"
          : "Список клинических ординаторов",
        heading: "Heading1",
        spacing: { after: 300 }
      })
    );

    rows.forEach((row, index) => {
      const data = convertRow(row);

      if (rows.length > 1) {
        paragraphs.push(
          new Paragraph({
            text: `${index + 1}. ${data["ФИО"] || ""}`,
            heading: "Heading2",
            spacing: { after: 200 }
          })
        );
      }

      Object.entries(data).forEach(([label, value]) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${label}: `, bold: true }),
              new TextRun(value || "")
            ],
            spacing: { after: 150 }
          })
        );
      });

      if (rows.length > 1) {
        paragraphs.push(
          new Paragraph({
            text: "──────────────────────────────────────────────",
            spacing: { before: 200, after: 300 }
          })
        );
      }
    });

    const doc = new Document({
      sections: [{ children: paragraphs }]
    });

    const blob = await Packer.toBlob(doc);

    const filename =
      rows.length === 1
        ? `${rows[0].column1 || "ordinator"}.docx`
        : "ordinators_full.docx";

    saveAs(blob, filename);

  } catch (error) {
    console.error("Ошибка экспорта Word:", error);
    alert("Не удалось создать документ");
  }
};

  const handleSort = (columnKey) => {
    let direction = 'ascending';
    
    if (sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key: columnKey, direction });
  };

  const getSortedData = (dataToSort) => {
    if (!sortConfig.key || !dataToSort.length) return dataToSort;
    
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
    
    if (searchColumn === 'all') {
      return Object.entries(row).some(([key, value]) => 
        key !== 'id' && 
        key !== 'originalData' && 
        String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return String(row[searchColumn] || '').toLowerCase().includes(searchTerm.toLowerCase());
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

  const renderModalField = (columnName, columnNumber, isEditMode = false, currentValue = '') => {
    const fieldName = ColumnName[columnNumber];
    const columnKey = `column${columnNumber}`;
    const value = isEditMode ? currentValue : (newRowData[columnKey] || '');

    const handleChange = (newValue) => {
      handleModalChange(columnKey, newValue);
    };
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
            onChange={(e) => handleChange(e.target.value)}
            onChange={(e) => onChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.universityName.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'Страна':
        const countryOptions = selectData.countries.map(country => ({
          value: country,
          label: country
        }));
        
        return (
          <CreatableSelect
            options={countryOptions}
            value={value ? { value: value, label: value } : null}
            onChange={handleChange}
            placeholder="Выберите или введите страну..."
            isClearable
            noOptionsMessage={() => "Нет вариантов, введите свой"}
            formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        );
      
      case 'Кафедра':
        const departmentOptions = selectData.departments.map(dept => ({
          value: dept,
          label: dept
        }));
        
        return (
          <CreatableSelect
            options={departmentOptions}
            value={value ? { value: value, label: value } : null}
            onChange={handleChange}
            placeholder="Выберите или введите кафедру..."
            isClearable
            noOptionsMessage={() => "Нет вариантов, введите свою"}
            formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        );
      
      case 'Профиль специальности':
        const specialtyOptions = selectData.specialtyProfiles.map(spec => ({
          value: spec,
          label: spec
        }));
        
        return (
          <CreatableSelect
            options={specialtyOptions}
            value={value ? { value: value, label: value } : null}
            onChange={handleChange}
            placeholder="Выберите или введите профиль..."
            isClearable
            noOptionsMessage={() => "Нет вариантов, введите свой"}
            formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        );
      
      case 'Причина отчисления':
        return (
          <div>
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
            onChange={(e) => handleChange(e.target.value)}
            onChange={(e) => onChange(columnKey, e.target.value)}
            className="modal-select"
          >
            {selectOptions.reasonExpulsion.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'ВУЗ':
        return (
          <div>
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
             {value === 'иное' && (
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
      
      case 'Год окончания':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="Например: 2024"
            maxLength="4"
          />
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
          <div>
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
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
          />
        );
      
      case 'Дата зачисления':
      case 'Дата отчисления':
      case 'Дата начала соц. отпуска':
      case 'Дата окончания соц. отпуска':
      case 'Дата приказа о зачислении':
      case 'Дата приказа об отчислении':
      case 'Срок окончания регистрации':
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

      case 'Дата начала сессии(циклов)':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="YYYY-MM-DD"
          />
        );
        case 'Дата окончания сессии(циклов)':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="YYYY-MM-DD"
          />
        );
      
      case 'Мобильный телефон':
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
            onChange={(e) => handleChange(e.target.value)}
            onChange={(e) => onChange(columnKey, e.target.value)}
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
          />
        );

      case 'Текущий контроль':
        return (
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="Введите данные текущего контроля"
            rows="3"
          />
        );

      case 'Распределение клинических ординаторов':
        return (
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="Введите информацию о распределении"
            rows="3"
          />
        );
      
      case 'Адрес проживания':
        return (
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="Введите полный адрес проживания"
            rows="2"
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

  if (loading) {
    return (
      <div className="table-page">
        <div className="loading-users">Загрузка данных с сервера...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-page">
        <div className="error-message">
          <p>Ошибка: {error}</p>
          <button onClick={fetchOrdinators} className="retry-button">
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  const columns = Array.from({ length: 40 }, (_, i) => `column${i + 1}`);

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
            <p className="data-info">Загружено записей: {data.length}</p>
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
                    {userData.role === 'admin' ? 'Администратор' : 
                    userData.role === 'dispatcher' ? 'Диспетчер' :
                    userData.role === 'passportist' ? 'Паспортист' :
                    userData.role === 'supervisor' ? 'Руководитель' : 'Пользователь'}
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
            {canCreateRow() && (
              <button 
                onClick={initCreateRow}
                className="create-row-button"
                title="Создать новую запись"
              >
                📋 Создать
              </button>
            )}
            <button 
              onClick={fetchOrdinators}
              className="refresh-button"
              title="Обновить данные"
              onClick={openCreateModal}
              className="create-row-button"
              title="Создать новую запись"
            >
              🔄 Обновить
            </button>
            <button 
              className="export-button"
              onClick={() => {
                setExportData(prepareDataForExport()); 
                setExportMenuVisible(true);
              }}
            >
              📤 Экспорт всех
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
              {sortedFilteredData.length === 0 ? (
                <tr>
                  <td colSpan={42} className="no-data">
                    {data.length === 0 ? 'Нет данных. Создайте первую запись.' : 'Нет результатов по вашему запросу.'}
                  </td>
                </tr>
              ) : (
                sortedFilteredData.map((row, rowIndex) => {
                  const originalIndex = data.indexOf(row);
                  return (
                    <tr key={`row-${row.id}`} className="table-row">
                      <td className="row-header sticky-left">
                        <div className="id-cell">{row.id || originalIndex + 1}</div>
                      </td>
                      
                      {columns.map((column) => (
                        <td key={`cell-${row.id}-${column}`}>
                          <span className="cell-value">
                            {searchTerm && String(row[column] || '').toLowerCase().includes(searchTerm.toLowerCase()) && 
                             (searchColumn === 'all' || searchColumn === column) ? (
                              <mark>{row[column]}</mark>
                            ) : (
                              row[column] || ''
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
                       <button 
                          className="export-row-button"
                          onClick={() => {
                            setExportData([row]);
                            setExportMenuVisible(true);
                          }}
                        >
                          📝 Экспорт
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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
        
        {sortedFilteredData.length === 0 && searchTerm && data.length > 0 && (
          <div className="no-results">
            <p>По запросу "{searchTerm}" ничего не найдено</p>
          </div>
        )}
      </div>

      {modalState.isOpen && (
        <div className="modal-overlay">
          <div className="modal create-modal">
            <div className="modal-header">
              <h2>
                {modalState.mode === 'create' 
                  ? 'Создание нового ординатора' 
                  : `Редактирование ординатора #${modalState.selectedRow?.id || modalState.selectedRow?.index + 1}`}
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
                    <p className="editor-note">ID: {modalState.selectedRow?.id}</p>
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
      )}

      {exportMenuVisible && (
        <div className="export-menu-overlay">
          <div className="export-menu">
            <h3>Экспортировать</h3>
            <button 
              className="export-option"
              onClick={() => {
                exportToWord(exportData);
                setExportMenuVisible(false);
              }}
            >
              📝 Word
            </button>
            <button 
              className="export-option"
              onClick={() => {
                exportToExcel(exportData);
                setExportMenuVisible(false);
              }}
            >
              📄 Excel
            </button>
            <button 
              className="cancel-button"
              onClick={() => setExportMenuVisible(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default EditableTable;