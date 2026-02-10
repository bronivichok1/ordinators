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

const EditableTable = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;
  const BASE_API_URL = `${API_URL}`;

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
    'Дата начала соц. отпуска',
    'Дата окончания соц. отпуска',
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
      
      row.column1 = ordinator.fio || '';
      row.column2 = ordinator.fioEn || '';
      row.column3 = ordinator.birthYear ? new Date(ordinator.birthYear).toISOString().split('T')[0] : '';
      row.column4 = ordinator.gender || 'М';
      row.column5 = ordinator.country || '';
      row.column6 = ordinator.enrollmentDate ? new Date(ordinator.enrollmentDate).toISOString().split('T')[0] : '';
      row.column7 = ordinator.dismissalDate ? new Date(ordinator.dismissalDate).toISOString().split('T')[0] : '';
      row.column8 = ordinator.dismissalReason || '';
      row.column9 = ordinator.socialLeave || '';
      
      if (ordinator.socialLeaveDuration) {
        const [startDate, endDate] = ordinator.socialLeaveDuration.split(' - ');
        row.column10 = startDate || '';
        row.column11 = endDate || '';
      } else {
        row.column10 = '';
        row.column11 = '';
      }
      
      row.column12 = ordinator.mobilePhone || '';
      row.column19 = ordinator.identityDocument || 'паспорт';
      row.column20 = ordinator.documentNumber || '';
      row.column21 = ordinator.identNumber || '';
      row.column22 = ordinator.residenceAddress || 'общежитие';
      row.column23 = ordinator.livingAddress || '';
      row.column24 = ordinator.registrationExpiry ? new Date(ordinator.registrationExpiry).toISOString().split('T')[0] : '';
      
      if (ordinator.enrollmentOrder) {
        const [orderNum, orderDate] = ordinator.enrollmentOrder.split(' от ');
        row.column25 = orderNum || '';
        row.column26 = orderDate || '';
      } else {
        row.column25 = '';
        row.column26 = '';
      }
      
      if (ordinator.dismissalOrder) {
        const [orderNum, orderDate] = ordinator.dismissalOrder.split(' от ');
        row.column27 = orderNum || '';
        row.column28 = orderDate || '';
      } else {
        row.column27 = '';
        row.column28 = '';
      }
      
      row.column29 = ordinator.contractInfo || '';
      row.column30 = ordinator.medicalCertificate || 'есть';
      
      if (ordinator.currentControl) {
        if (typeof ordinator.currentControl === 'object' && ordinator.currentControl.scores) {
          row.column31 = ordinator.currentControl.scores || '';
        } else {
          row.column31 = String(ordinator.currentControl) || '';
        }
      } else {
        row.column31 = '';
      }
      
      row.column32 = ordinator.login || '';
      row.column33 = '••••••••';
      row.column34 = ordinator.supervisorId ? String(ordinator.supervisorId) : '';
      row.column35 = ordinator.sessionDates || '';
      row.column36 = ordinator.allowanceStartDate ? new Date(ordinator.allowanceStartDate).toISOString().split('T')[0] : '';
      row.column37 = ordinator.allowanceEndDate ? new Date(ordinator.allowanceEndDate).toISOString().split('T')[0] : '';
      row.column38 = ordinator.rivshCertificate || 'нет';
      row.column39 = ordinator.entryByInvitation || 'нет';
      row.column40 = ordinator.distributionInfo || '';
      
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
      
      if (ordinator.money) {
        row.column36 = ordinator.money.allowanceStartDate ? new Date(ordinator.money.allowanceStartDate).toISOString().split('T')[0] : '';
        row.column37 = ordinator.money.allowanceEndDate ? new Date(ordinator.money.allowanceEndDate).toISOString().split('T')[0] : '';
      }
      
      if (ordinator.session) {
        const startDate = ordinator.session.sessionStart ? new Date(ordinator.session.sessionStart).toISOString().split('T')[0] : '';
        const endDate = ordinator.session.sessionEnd ? new Date(ordinator.session.sessionEnd).toISOString().split('T')[0] : '';
        if (startDate && endDate) {
          row.column35 = `${startDate} - ${endDate}`;
        } else if (startDate) {
          row.column35 = startDate;
        } else {
          row.column35 = '';
        }
      }
      
      return {
        ...row,
        id: ordinator.id,
        originalData: ordinator
      };
    });
  };

  const transformTableDataToApi = (tableData, mode = 'create') => {
    let sessionStart = tableData.column35 || '';
    let sessionEnd = '';
    
    if (sessionStart && sessionStart.includes('-')) {
      const dates = sessionStart.split('-').map(d => d.trim());
      sessionStart = dates[0];
      sessionEnd = dates[1] || dates[0];
    }

    const socialLeaveStart = tableData.column10 || '';
    const socialLeaveEnd = tableData.column11 || '';
    const socialLeaveDuration = socialLeaveStart && socialLeaveEnd ? 
      `${socialLeaveStart} - ${socialLeaveEnd}` : '';

    const enrollmentOrderNum = tableData.column25 || '';
    const enrollmentOrderDate = tableData.column26 || '';
    const enrollmentOrder = enrollmentOrderNum && enrollmentOrderDate ? 
      `${enrollmentOrderNum} от ${enrollmentOrderDate}` : '';

    const dismissalOrderNum = tableData.column27 || '';
    const dismissalOrderDate = tableData.column28 || '';
    const dismissalOrder = dismissalOrderNum && dismissalOrderDate ? 
      `${dismissalOrderNum} от ${dismissalOrderDate}` : '';

    const apiData = {
      fio: tableData.column1 || '',
      fioEn: tableData.column2 || '',
      birthYear: tableData.column3 || new Date().toISOString(),
      gender: tableData.column4 || 'М',
      country: tableData.column5 || 'Беларусь',
      enrollmentDate: tableData.column6 || new Date().toISOString(),
      dismissalDate: tableData.column7 || null,
      dismissalReason: tableData.column8 || '',
      socialLeave: tableData.column9 || '',
      socialLeaveDuration: socialLeaveDuration,
      mobilePhone: tableData.column12 || '',
      identityDocument: tableData.column19 || 'паспорт',
      documentNumber: tableData.column20 || '',
      identNumber: tableData.column21 || '',
      residenceAddress: tableData.column22 || 'общежитие',
      livingAddress: tableData.column23 || '',
      registrationExpiry: tableData.column24 || null,
      enrollmentOrder: enrollmentOrder,
      dismissalOrder: dismissalOrder,
      contractInfo: tableData.column29 || '',
      medicalCertificate: tableData.column30 || 'есть',
      login: tableData.column32 || '',
      supervisorId: tableData.column34 ? parseInt(tableData.column34) : null,
      rivshCertificate: tableData.column38 || 'нет',
      entryByInvitation: tableData.column39 || 'нет',
      distributionInfo: tableData.column40 || '',
      universityName: tableData.column13 || 'БГМУ',
      graduationYear: tableData.column14 || '',
      department: tableData.column15 || '',
      specialtyProfile: tableData.column16 || '',
      specialty: tableData.column17 || '',
      preparationForm: JSON.stringify(modalState.selectedPreparationForm),
    };

    if (tableData.column31) {
      apiData.currentControl = {
        scores: tableData.column31
      };
    }

    if (tableData.column36 || tableData.column37) {
      apiData.money = {
        allowanceStartDate: tableData.column36 || null,
        allowanceEndDate: tableData.column37 || null
      };
    }

    if (sessionStart) {
      apiData.session = {
        sessionStart: sessionStart,
        sessionEnd: sessionEnd || sessionStart
      };
    }

    if (tableData.column13 === 'другое' && modalState.otherUniversity) {
      apiData.universityName = modalState.otherUniversity;
    }

    if (tableData.column19 === 'иное' && modalState.otherDocument) {
      apiData.identityDocument = modalState.otherDocument;
    }

    if (tableData.column8 === 'иное' && modalState.otherUniversity) {
      apiData.dismissalReason = modalState.otherUniversity;
    }

    if (mode === 'create') {
      apiData.password = tableData.column33 || 'defaultPassword123';
    }

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
    }
  }, [navigate]);

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

  const goToAdminPanel = () => {
    navigate('/');
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

  const filteredData = data.filter(row => {
    if (!searchTerm.trim()) return true;
    
    if (searchColumn === 'all') {
      return Object.entries(row).some(([key, value]) => 
        key !== 'id' && 
        key !== 'originalData' && 
        String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return String(row[searchColumn] || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const sortedFilteredData = getSortedData(filteredData);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️'; 
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const renderModalField = (columnName, columnNumber, isEditMode = false, currentValue = '') => {
    const fieldName = ColumnName[columnNumber];
    const columnKey = `column${columnNumber}`;
    const value = isEditMode ? currentValue : (newRowData[columnKey] || '');

    const handleChange = (newValue) => {
      handleModalChange(columnKey, newValue);
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

      case 'Дата сессии(циклов), начало, окончание':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            placeholder="YYYY-MM-DD - YYYY-MM-DD"
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
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-textarea"
            placeholder="Введите данные текущего контроля"
            rows="3"
          />
        );

      case 'Распределение клинических ординаторов':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-textarea"
            placeholder="Введите информацию о распределении"
            rows="3"
          />
        );
      
      case 'Адрес проживания':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-textarea"
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
            <button 
              onClick={fetchOrdinators}
              className="refresh-button"
              title="Обновить данные"
            >
              🔄 Обновить
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
                      </td>
                    </tr>
                  );
                })
              )}
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