import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import './EditableTable.css';
import { 
  LogOut, 
  User, 
  Shield, 
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  Eye,
  X,
  FileSignature,
  Plus,
  Trash2,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CERTIFICATE_TYPES, generateMultipleCertificates } from './utils/certificateGenerator';

const ROWS_PER_PAGE = 10;

const EditableTable = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [showCertificatePanel, setShowCertificatePanel] = useState(false);
  
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(new Set());
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [exportFormats, setExportFormats] = useState({
    excel: true,
    word: false
  });

  const [selectedCertificateTypes, setSelectedCertificateTypes] = useState(new Set());
  const [generatingCertificates, setGeneratingCertificates] = useState(false);

  const [filters, setFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND');

  const [editingCell, setEditingCell] = useState({
    rowId: null,
    column: null,
    value: '',
    rowIndex: null,
    fieldType: null,
    columnNumber: null,
    subField: null,
    subIndex: null
  });
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState({});

  const [serverOptions, setServerOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

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
    'Номер приказа о продлении',
    'Договор, дополнительное соглашение',
    'Медицинская справка',
    'Текущий контроль',
    'Логин',
    'Пароль',
    'Руководители',
    'Дата начала сессии(циклов)',
    'Дата окончания сессии(циклов)',
    'Надбавка',
    'Наличие сертификата РИВШ',
    'Въезд по приглашению',
    'Распределение клинических ординаторов',
    '',
  ];

  const formatDateToDisplay = (dateString) => {
    if (!dateString) return '';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}.${month}.${year}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString.replace(/-/g, '.');
    return dateString;
  };

  const formatDateToAPI = (dateString) => {
    if (!dateString) return null;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('.');
      return `${year}-${month}-${day}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    return null;
  };

  const isValidDate = (dateString) => {
    if (!dateString) return true;
    const regex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!regex.test(dateString)) return false;
    const [day, month, year] = dateString.split('.');
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum > daysInMonth) return false;
    return true;
  };

  const formatYearFromDate = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString.split('-')[0];
    }
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
      return dateString.split('.')[2];
    }
    if (/^\d{4}$/.test(dateString)) {
      return dateString;
    }
    return dateString;
  };

  useEffect(() => {
    const allColumns = new Set();
    const initialVisible = new Set();
    for (let i = 1; i <= 40; i++) {
        allColumns.add(i);
        initialVisible.add(i);
    }
    setSelectedColumns(allColumns);
    setVisibleColumns(initialVisible);
  }, []);

  const [selectOptions, setSelectOptions] = useState({
    gender: [],
    dismissalReason: [],
    university: [],
    preparationForm: [],
    identityDocument: [],
    residence: [],
    medicalCertificate: [],
    rivshCertificate: [],
    entryByInvitation: [],
    country: [],
    supervisors: [],
    socialLeave: []
  });

  const [selectData, setSelectData] = useState({
    departments: [],
    specialtyProfiles: [],
    countries: [],
    gender: [],
    dismissalReason: [],
    university: [],
    preparationForm: [],
    identityDocument: [],
    residence: [],
    medicalCertificate: [],
    rivshCertificate: [],
    entryByInvitation: [],
    supervisors: [],
    socialLeave: []
  });

  const [data, setData] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create',
    selectedRow: null,
    rowData: [],
    otherUniversity: '',
    otherDocument: '',
    otherDismissalReason: '',
    otherCountry: '',
    selectedPreparationForm: ['']
  });
  
  const [newRowData, setNewRowData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });
  const [dateErrors, setDateErrors] = useState({});

  const getFieldType = (columnNumber) => {
    const fieldName = ColumnName[columnNumber];
    
    switch(fieldName) {
      case 'Пол':
        return 'creatable-gender';
      case 'Страна':
        return 'creatable-country';
      case 'Кафедра':
        return 'creatable-department';
      case 'Специальность':
        return 'creatable-specialty';
      case 'Профиль специальности':
        return 'creatable-specialty-profile';
      case 'Причина отчисления':
        return 'creatable-dismissal';
      case 'ВУЗ':
        return 'creatable-university';
      case 'Форма подготовки':
        return 'creatable-preparation';
      case 'Документ, удостоверяющий личность':
        return 'creatable-document';
      case 'Место проживания, регистрации':
        return 'creatable-residence';
      case 'Медицинская справка':
        return 'creatable-medical';
      case 'Наличие сертификата РИВШ':
        return 'creatable-rivsh';
      case 'Въезд по приглашению':
        return 'creatable-entry';
      case 'Социальный отпуск':
        return 'nested-social-leave';
      case 'Руководители':
        return 'nested-supervisors';
      case 'Год рождения':
        return 'date';
      case 'Дата зачисления':
      case 'Дата отчисления':
      case 'Дата приказа о зачислении':
      case 'Дата приказа об отчислении':
      case 'Срок окончания регистрации':
      case 'Дата начала сессии(циклов)':
      case 'Дата окончания сессии(циклов)':
        return 'date';
      case 'Мобильный телефон':
        return 'tel';
      case 'Пароль':
        return 'password';
      case 'Текущий контроль':
        return 'date';
      case 'Распределение клинических ординаторов':
      case 'Адрес проживания':
        return 'text';
      default:
        return 'text';
    }
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        id: Date.now(),
        column: 'column1',
        operator: 'contains',
        value: '',
        type: 'text'
      }
    ]);
  };

  const removeFilter = (filterId) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId, field, value) => {
    setFilters(filters.map(filter => {
      if (filter.id === filterId) {
        const updatedFilter = { ...filter, [field]: value };
        
        if (field === 'column') {
          const columnNumber = parseInt(value.replace('column', ''));
          const fieldType = getFieldType(columnNumber);
          updatedFilter.type = fieldType;
          
          if (fieldType.startsWith('creatable-') || fieldType === 'text') {
            updatedFilter.operator = 'contains';
          } else if (fieldType === 'date') {
            updatedFilter.operator = 'equals';
          }
        }
        
        return updatedFilter;
      }
      return filter;
    }));
  };

  const getOperatorsByType = (type) => {
    if (type.startsWith('creatable-') || type === 'text') {
      return [
        { value: 'contains', label: 'Содержит' },
        { value: 'equals', label: 'Равно' },
        { value: 'startsWith', label: 'Начинается с' },
        { value: 'endsWith', label: 'Заканчивается на' },
        { value: 'notContains', label: 'Не содержит' },
        { value: 'notEquals', label: 'Не равно' }
      ];
    } else if (type === 'date') {
      return [
        { value: 'equals', label: 'Равно' },
        { value: 'greaterThan', label: 'Больше' },
        { value: 'lessThan', label: 'Меньше' },
        { value: 'between', label: 'Между' }
      ];
    } else if (type === 'tel' || type === 'password') {
      return [
        { value: 'contains', label: 'Содержит' },
        { value: 'equals', label: 'Равно' }
      ];
    }
    return [{ value: 'contains', label: 'Содержит' }];
  };

  const applyFilters = (rows) => {
    if (filters.length === 0) return rows;

    return rows.filter(row => {
      const results = filters.map(filter => {
        let columnValue = row[filter.column] || '';
        
        if (filter.column === 'column18') {
          try {
            const parsed = JSON.parse(columnValue);
            columnValue = Array.isArray(parsed) ? parsed.join(', ') : columnValue;
          } catch {
            columnValue = columnValue;
          }
        }
        
        if (filter.column === 'column9') {
          try {
            const leaves = JSON.parse(columnValue);
            if (Array.isArray(leaves)) {
              columnValue = leaves.map(l => 
                `${formatDateToDisplay(l.startDate) || ''} - ${formatDateToDisplay(l.endDate) || ''} (${l.reason || ''})`
              ).join('; ');
            }
          } catch {
            columnValue = columnValue;
          }
        }
        
        if (filter.column === 'column27') {
          try {
            const extensions = JSON.parse(columnValue);
            if (Array.isArray(extensions)) {
              columnValue = extensions.map(ext => 
                `${ext.orderNumber || ''} (${formatDateToDisplay(ext.orderDate) || ''}, срок: ${ext.extensionTerm || ''})`
              ).join('; ');
            }
          } catch {
            columnValue = columnValue;
          }
        }

        if (filter.column === 'column36') {
          try {
            const allowances = JSON.parse(columnValue);
            if (Array.isArray(allowances)) {
              columnValue = allowances.map(allow => 
                `${allow.orderNumber || ''} (${formatDateToDisplay(allow.startDate) || ''} - ${formatDateToDisplay(allow.endDate) || ''})`
              ).join('; ');
            }
          } catch {
            columnValue = columnValue;
          }
        }

        if (filter.column === 'column33') {
          try {
            const supervisors = JSON.parse(row[filter.column] || '[]');
            
            if (Array.isArray(supervisors) && supervisors.length > 0) {
              const supervisorsInfo = supervisors.map(sup => {
                let info = sup.supervisorName || '';
                if (sup.position) info += ` ${sup.position}`;
                if (sup.rank) info += ` ${sup.rank}`;
                if (sup.startDate) info += ` ${formatDateToDisplay(sup.startDate)}`;
                if (sup.endDate) info += ` ${formatDateToDisplay(sup.endDate)}`;
                return info;
              }).join(' ');
              
              columnValue = supervisorsInfo;
            } else {
              return false;
            }
          } catch (e) {
            return false;
          }
        }

        let filterValue = filter.value;
        let columnValueForCompare = columnValue;
        let filterValueForCompare = filterValue;
        
        const dateColumnNumbers = [3, 6, 7, 22, 24, 26, 30, 34, 35];
        const columnNumber = parseInt(filter.column.replace('column', ''));
        
        if (filter.type === 'date' || dateColumnNumbers.includes(columnNumber)) {
          columnValueForCompare = formatDateToDisplay(columnValue);
          filterValueForCompare = filterValue;
        }
        
        let processedValue = String(columnValueForCompare || '').toLowerCase();
        let processedFilterValue = String(filterValueForCompare || '').toLowerCase();
        
        switch (filter.operator) {
          case 'contains':
            return processedValue.includes(processedFilterValue);
          case 'notContains':
            return !processedValue.includes(processedFilterValue);
          case 'equals':
            return processedValue === processedFilterValue;
          case 'notEquals':
            return processedValue !== processedFilterValue;
          case 'startsWith':
            return processedValue.startsWith(processedFilterValue);
          case 'endsWith':
            return processedValue.endsWith(processedFilterValue);
          case 'greaterThan':
            return processedValue > processedFilterValue;
          case 'lessThan':
            return processedValue < processedFilterValue;
          case 'between':
            const [val1, val2] = filterValue.split(',').map(v => v.trim());
            if (dateColumnNumbers.includes(columnNumber)) {
              const formattedVal1 = formatDateToAPI(val1);
              const formattedVal2 = formatDateToAPI(val2);
              const currentDate = formatDateToAPI(columnValue);
              return currentDate >= formattedVal1 && currentDate <= formattedVal2;
            }
            return columnValue >= val1 && columnValue <= val2;
          default:
            return processedValue.includes(processedFilterValue);
        }
      });

      return filterLogic === 'AND' 
        ? results.every(result => result)
        : results.some(result => result);
    });
  };

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

  const loadServerOptions = async () => {
    try {
      setOptionsLoading(true);
      const data = await apiRequest('/options');
      setServerOptions(data);
      
      const preparationForm = data.preparationForm || ['очная', 'заочная', 'платно', 'за счёт бюджета'];
      
      setSelectOptions({
        gender: data.gender || ['М', 'Ж'],
        dismissalReason: data.dismissalReason || [],
        university: data.university || [],
        preparationForm: preparationForm,
        identityDocument: data.identityDocument || [],
        residence: data.residence || [],
        medicalCertificate: data.medicalCertificate || [],
        rivshCertificate: data.rivshCertificate || [],
        entryByInvitation: data.entryByInvitation || [],
        country: data.country || [],
        supervisors: data.supervisors || [],
        socialLeave: data.socialLeave || []
      });
  
      setSelectData({
        departments: data.departments || [],
        specialties: data.specialties || [],
        specialtyProfiles: data.specialtyProfiles || [],
        countries: data.country || [],
        gender: data.gender || ['М', 'Ж'],
        dismissalReason: data.dismissalReason || [],
        university: data.university || [],
        preparationForm: preparationForm,
        identityDocument: data.identityDocument || [],
        residence: data.residence || [],
        medicalCertificate: data.medicalCertificate || [],
        rivshCertificate: data.rivshCertificate || [],
        entryByInvitation: data.entryByInvitation || [],
        supervisors: data.supervisors || [],
        socialLeave: data.socialLeave || []
      });
    } catch (error) {
      console.error('Error loading server options:', error);
    } finally {
      setOptionsLoading(false);
    }
  };

  const addCustomOption = async (field, value) => {
    try {
      await apiRequest(`/options/${field}/add`, 'POST', { value });
      await loadServerOptions();
    } catch (error) {
      console.error('Error adding custom option:', error);
    }
  };

  const formatPreparationForm = (formData) => {
    if (!formData) return '';
    
    if (Array.isArray(formData)) {
      return formData.join(', ');
    }
    
    if (typeof formData === 'string') {
      try {
        const parsed = JSON.parse(formData);
        if (Array.isArray(parsed)) {
          const result = parsed.join(', ');
          return result;
        }
        return String(parsed);
      } catch (e) {
        if (formData.includes(',') && !formData.startsWith('[')) {
          return formData;
        }
        return formData;
      }
    }
    
    return String(formData);
  };

  const handleCertificateTypeChange = (typeId) => {
    const newSelected = new Set(selectedCertificateTypes);
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId);
    } else {
      newSelected.add(typeId);
    }
    setSelectedCertificateTypes(newSelected);
  };

  const handleGenerateCertificates = async () => {
    if (selectedRows.size === 0) {
      alert('Выберите записи для генерации справок');
      return;
    }
    
    if (selectedCertificateTypes.size === 0) {
      alert('Выберите хотя бы один тип справки');
      return;
    }
  
    setGeneratingCertificates(true);
    
    try {
      const selectedData = data.filter(row => selectedRows.has(row.id));
      const { successCount, errorCount, results } = await generateMultipleCertificates(selectedData, selectedCertificateTypes, userData);
      
      let message = '';
      if (successCount > 0 && errorCount === 0) {
        message = `✅ Успешно сгенерировано ${successCount} справок`;
      } else if (successCount > 0 && errorCount > 0) {
        message = `⚠️ Сгенерировано: ${successCount} успешно, ${errorCount} с ошибками`;
        
        const errors = results.filter(r => !r.success);
        if (errors.length > 0 && errors.length <= 5) {
          message += `\n\nОшибки:\n${errors.map(e => `${e.fio} - ${e.type}: ${e.error}`).join('\n')}`;
        } else if (errors.length > 5) {
          message += `\n\nОшибки у ${errors.length} справок. Подробности в консоли.`;
          console.error('Ошибки генерации:', errors);
        }
      } else {
        message = `❌ Ошибка: не удалось сгенерировать ни одной справки`;
      }
      
      alert(message);
      
      setShowCertificatePanel(false);
      setSelectedCertificateTypes(new Set());
    } catch (error) {
      console.error('Ошибка генерации справок:', error);
      alert('Ошибка при генерации справок: ' + error.message);
    } finally {
      setGeneratingCertificates(false);
    }
  };

  const handleSelectRow = (rowId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const newSelected = new Set(filteredData.map(row => row.id));
      setSelectedRows(newSelected);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectColumn = (columnIndex) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnIndex)) {
      newSelected.delete(columnIndex);
    } else {
      newSelected.add(columnIndex);
    }
    setSelectedColumns(newSelected);
  };

  const handleSelectAllColumns = () => {
    const allColumns = new Set();
    for (let i = 1; i <= 40; i++) {
      if (i !== 9) {
        allColumns.add(i);
      }
    }
    
    if (selectedColumns.size === allColumns.size) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(allColumns);
    }
  };

  const handleToggleColumn = (columnIndex) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnIndex)) {
      newVisible.delete(columnIndex);
    } else {
      newVisible.add(columnIndex);
    }
    setVisibleColumns(newVisible);
  };

  const handleShowAllColumns = () => {
    const allColumns = new Set();
    for (let i = 1; i <= 40; i++) {
      if (i !== 9) {
        allColumns.add(i);
      }
    }
    setVisibleColumns(allColumns);
  };

  const handleHideAllColumns = () => {
    setVisibleColumns(new Set());
  };

  const handleFormatChange = (format) => {
    setExportFormats(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const prepareDataForExport = () => {
    const selectedData = data.filter(row => selectedRows.has(row.id));
    
    if (selectedData.length === 0) {
      alert('Выберите записи для экспорта');
      return null;
    }
  
    return selectedData.map(row => {
      const exportRow = {};
      exportRow['ID'] = row.id;
      selectedColumns.forEach(colIndex => {
        const columnKey = `column${colIndex}`;
        if (row[columnKey] !== undefined) {
          let value = row[columnKey] || '';
          
          if (colIndex === 16) {
            value = formatPreparationForm(value);
          }
          
          if (colIndex === 9) {
            try {
              const leaves = JSON.parse(value);
              if (Array.isArray(leaves)) {
                value = leaves.map(l => `${l.startDate || ''} - ${l.endDate || ''} (${l.reason || ''})`).join('; ');
              } else {
                value = '';
              }
            } catch {
              value = '';
            }
          }
          
          if (colIndex === 27) {
            try {
              const extensions = JSON.parse(value);
              if (Array.isArray(extensions) && extensions.length > 0) {
                value = extensions.map(ext => 
                  `${ext.orderNumber || ''} (${ext.orderDate || ''}, срок: ${ext.extensionTerm || '1 год'})`
                ).join('; ');
              } else {
                value = '';
              }
            } catch {
              value = '';
            }
          }
          
          if (colIndex === 36) {
            try {
              const allowances = JSON.parse(value);
              if (Array.isArray(allowances) && allowances.length > 0) {
                value = allowances.map(allow => 
                  `${allow.orderNumber || ''} (${allow.startDate || ''} - ${allow.endDate || ''})`
                ).join('; ');
              } else {
                value = '';
              }
            } catch {
              value = '';
            }
          }
          
          if (colIndex === 33) {
            try {
              const supervisors = JSON.parse(value);
              if (Array.isArray(supervisors) && supervisors.length > 0) {
                value = supervisors.map(sup => {
                  let name = sup.supervisorName || '—';
                  if (sup.position) name += `, ${sup.position}`;
                  if (sup.rank) name += ` (${sup.rank})`;
                  if (sup.startDate) name += ` с ${formatDateToDisplay(sup.startDate)}`;
                  if (sup.endDate) name += ` по ${formatDateToDisplay(sup.endDate)}`;
                  return name;
                }).join('; ');
              } else {
                value = '';
              }
            } catch {
              value = '';
            }
          }
          
          exportRow[ColumnName[colIndex]] = value;
        }      
      });
      return exportRow;
    });
  };

  const exportToExcel = (exportData) => {
    try {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ординаторы');
      const fileName = `ординаторы_${new Date().toISOString().split('T')[0]}_${selectedRows.size}записей.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error);
      throw error;
    }
  };

  const exportToWord = (exportData) => {
    try {
      let html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Экспорт ординаторов</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th { background-color: #f2f2f2; font-weight: bold; padding: 10px; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .info { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Список ординаторов</h1>
          <div class="info">
            <p>Дата экспорта: ${new Date().toLocaleString('ru-RU')}</p>
            <p>Всего записей: ${exportData.length}</p>
          </div>
          <table border="1">
            <thead>
              <tr>
      `;
      
      const headers = Object.keys(exportData[0]);
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      
      html += `<tr></thead><tbody>`;
      
      exportData.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
      });
      
      html += `</tbody></table></body></html>`;
      
      const blob = new Blob([html], { type: 'application/msword' });
      const fileName = `ординаторы_${new Date().toISOString().split('T')[0]}_${selectedRows.size}записей.doc`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Ошибка экспорта в Word:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    if (selectedRows.size === 0) {
      alert('Сначала выберите записи для экспорта');
      return;
    }
    
    if (selectedColumns.size === 0) {
      alert('Выберите хотя бы одну колонку для экспорта');
      return;
    }

    if (!exportFormats.excel && !exportFormats.word) {
      alert('Выберите хотя бы один формат экспорта');
      return;
    }

    try {
      const exportData = prepareDataForExport();
      if (!exportData) return;

      if (exportFormats.excel) {
        await exportToExcel(exportData);
      }
      
      if (exportFormats.word) {
        await exportToWord(exportData);
      }

      setShowExportPanel(false);
      
      if (exportFormats.excel && exportFormats.word) {
        alert('Экспорт выполнен успешно в форматах Excel и Word');
      } else if (exportFormats.excel) {
        alert('Экспорт в Excel выполнен успешно');
      } else if (exportFormats.word) {
        alert('Экспорт в Word выполнен успешно');
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте: ' + error.message);
    }
  };

  const transformApiDataToTable = (apiData) => {
    return apiData.map((ordinator) => {
      const row = {};
      row.column1 = ordinator.fio || '';
      row.column2 = ordinator.fioEn || '';
      row.column3 = formatYearFromDate(ordinator.birthYear) || '';
      row.column4 = ordinator.gender || 'М';
      row.column5 = ordinator.country || '';
      row.column6 = formatDateToDisplay(ordinator.enrollmentDate) || '';
      row.column7 = formatDateToDisplay(ordinator.dismissalDate) || '';
      row.column8 = ordinator.dismissalReason || '';
      
      if (ordinator.socialLeaves && Array.isArray(ordinator.socialLeaves)) {
        row.column9 = JSON.stringify(ordinator.socialLeaves);
      } else {
        row.column9 = JSON.stringify([]);
      }
      
      row.column10 = ordinator.mobilePhone || '';
      
      if (ordinator.university) {
        row.column11 = ordinator.university.name || '';
        let graduationYear = ordinator.university.graduationYear;
        if (graduationYear) {
          if (typeof graduationYear === 'string') {
            graduationYear = graduationYear.split('-')[0];
          } else if (graduationYear instanceof Date) {
            graduationYear = graduationYear.getFullYear().toString();
          } else if (typeof graduationYear === 'number') {
            graduationYear = graduationYear.toString();
          }
        }
        row.column12 = graduationYear || '';
        row.column13 = ordinator.university.department || '';
        row.column15 = ordinator.university.specialtyProfile || '';
        row.column14 = ordinator.university.specialty || '';
        let prepForm = ordinator.university.preparationForm;
        if (prepForm && typeof prepForm === 'object') {
          prepForm = JSON.stringify(prepForm);
        } else if (!prepForm) {
          prepForm = JSON.stringify(['']);
        }
        row.column16 = prepForm;
      } else {
        row.column11 = '';
        row.column12 = '';
        row.column13 = '';
        row.column14 = '';
        row.column15 = '';
        row.column16 = JSON.stringify(['']);
      }
      
      row.column17 = ordinator.identityDocument || '';
      row.column18 = ordinator.documentNumber || '';
      row.column19 = ordinator.identNumber || '';
      row.column20 = ordinator.residenceAddress || '';
      row.column21 = ordinator.livingAddress || '';
      row.column22 = formatDateToDisplay(ordinator.registrationExpiry) || '';
      row.column23 = ordinator.enrollmentOrderNumber || '';
      row.column24 = formatDateToDisplay(ordinator.enrollmentOrderDate) || '';
      row.column25 = ordinator.dismissalOrderNumber || '';
      row.column26 = formatDateToDisplay(ordinator.dismissalOrderDate) || '';
      
      if (ordinator.extensions && Array.isArray(ordinator.extensions)) {
        row.column27 = JSON.stringify(ordinator.extensions);
      } else {
        row.column27 = JSON.stringify([]);
      }
      
      row.column28 = ordinator.contractInfo || '';
      row.column29 = ordinator.medicalCertificate || 'есть';
      
      if (ordinator.currentControl) {
        row.column30 = formatDateToDisplay(ordinator.currentControl.scores) || '';
      } else {
        row.column30 = '';
      }
      
      row.column31 = ordinator.login || '';
      row.column32 = ordinator.password || '';
      
      if (ordinator.supervisors && Array.isArray(ordinator.supervisors)) {
        row.column33 = JSON.stringify(ordinator.supervisors);
      } else {
        row.column33 = JSON.stringify([]);
      }
      
      if (ordinator.session) {
        row.column34 = formatDateToDisplay(ordinator.session.sessionStart) || '';
        row.column35 = formatDateToDisplay(ordinator.session.sessionEnd) || '';
      } else {
        row.column34 = '';
        row.column35 = '';
      }
      
      if (ordinator.allowances && Array.isArray(ordinator.allowances)) {
        row.column36 = JSON.stringify(ordinator.allowances);
      } else {
        row.column36 = JSON.stringify([]);
      }
      
      row.column38 = ordinator.rivshCertificate || 'нет';
      row.column39 = ordinator.entryByInvitation || 'нет';
      row.column40 = ordinator.distributionInfo || '';
      
      return {
        ...row,
        id: ordinator.id,
        originalData: ordinator
      };
    });
  };

  const transformTableDataToApi = (tableData, mode = 'create') => {
    let preparationFormValue = tableData.column16 || '';
  
    if (typeof preparationFormValue === 'string') {
      try {
        const parsed = JSON.parse(preparationFormValue);
        if (Array.isArray(parsed)) {
          preparationFormValue = JSON.stringify(parsed);
        } else {
          preparationFormValue = JSON.stringify([parsed]);
        }
      } catch {
        if (preparationFormValue) {
          preparationFormValue = JSON.stringify([preparationFormValue]);
        } else {
          preparationFormValue = JSON.stringify([]);
        }
      }
    } else if (Array.isArray(preparationFormValue)) {
      preparationFormValue = JSON.stringify(preparationFormValue);
    } else {
      preparationFormValue = JSON.stringify([]);
    }
  
    let socialLeavesValue = [];
    try {
      const parsed = JSON.parse(tableData.column9 || '[]');
      if (Array.isArray(parsed)) {
        socialLeavesValue = parsed.map(leave => ({
          startDate: leave.startDate ? new Date(formatDateToAPI(leave.startDate)) : null,
          endDate: leave.endDate ? new Date(formatDateToAPI(leave.endDate)) : null,
          reason: leave.reason || ''
        }));
      }
    } catch {
      socialLeavesValue = [];
    }
  
    let supervisorsValue = [];
    try {
      const parsed = JSON.parse(tableData.column33 || '[]');
      if (Array.isArray(parsed)) {
        supervisorsValue = parsed.map(sup => ({
          supervisorName: sup.supervisorName || '',
          position: sup.position || '',
          rank: sup.rank || '',
          startDate: sup.startDate ? new Date(formatDateToAPI(sup.startDate)) : null,
          endDate: sup.endDate ? new Date(formatDateToAPI(sup.endDate)) : null
        }));
      }
    } catch {
      supervisorsValue = [];
    }
  
    let extensionsValue = [];
    try {
      const parsed = JSON.parse(tableData.column27 || '[]');
      if (Array.isArray(parsed)) {
        extensionsValue = parsed.map(ext => ({
          orderNumber: ext.orderNumber || '',
          orderDate: ext.orderDate ? formatDateToAPI(ext.orderDate) : null,
          extensionTerm: ext.extensionTerm || '1 год'
        }));
      }
    } catch {
      extensionsValue = [];
    }
  
    let allowancesValue = [];
    try {
      const parsed = JSON.parse(tableData.column36 || '[]');
      if (Array.isArray(parsed)) {
        allowancesValue = parsed.map(item => ({
          orderNumber: item.orderNumber || '',
          startDate: item.startDate ? new Date(formatDateToAPI(item.startDate)) : null,
          endDate: item.endDate ? new Date(formatDateToAPI(item.endDate)) : null
        }));
      }
    } catch {
      allowancesValue = [];
    }

    const apiData = {
      fio: tableData.column1 || '',
      fioEn: tableData.column2 || '',
      birthYear: tableData.column3 ? new Date(Date.UTC(parseInt(tableData.column3), 0, 1)) : null,
      gender: tableData.column4 || 'М',
      country: tableData.column5 || 'Беларусь',
      enrollmentDate: formatDateToAPI(tableData.column6),
      dismissalDate: formatDateToAPI(tableData.column7),
      dismissalReason: tableData.column8 === 'иное' ? modalState.otherDismissalReason : tableData.column8 || '',
      socialLeaves: socialLeavesValue,
      mobilePhone: tableData.column10 || '',
      universityName: tableData.column11 === 'другое' ? modalState.otherUniversity : tableData.column11 || 'БГМУ',
      graduationYear: tableData.column12 ? `${tableData.column12}-01-01` : null,
      department: tableData.column13 || '',
      specialtyProfile: tableData.column15 || '',
      specialty: tableData.column14 || '',
      preparationForm: preparationFormValue,
      identityDocument: tableData.column17 === 'иное' ? modalState.otherDocument : tableData.column17 || 'паспорт',
      documentNumber: tableData.column18 || '',
      identNumber: tableData.column19 || '',
      residenceAddress: tableData.column20 || '',
      livingAddress: tableData.column21 || '',
      registrationExpiry: formatDateToAPI(tableData.column22),
      enrollmentOrderNumber: tableData.column23 || '',
      enrollmentOrderDate: formatDateToAPI(tableData.column24),
      dismissalOrderNumber: tableData.column25 || '',
      dismissalOrderDate: formatDateToAPI(tableData.column26),
      extensions: extensionsValue,
      contractInfo: tableData.column28 || '',
      medicalCertificate: tableData.column29 || 'есть',
      scores: tableData.column30 || null,
      login: tableData.column31 || '',
      password: tableData.column32 || '',
      supervisors: supervisorsValue,
      sessionStart: formatDateToAPI(tableData.column34),
      sessionEnd: formatDateToAPI(tableData.column35),
      allowances: allowancesValue,
      rivshCertificate: tableData.column38 || 'нет',
      entryByInvitation: tableData.column39 || 'нет',
      distributionInfo: tableData.column40 || ''
    };
  
    Object.keys(apiData).forEach(key => apiData[key] === undefined && delete apiData[key]);
    return apiData;
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
      loadServerOptions();
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
      setPendingChanges({});
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching ordinators:', error);
      setError('Не удалось загрузить данные. Проверьте соединение с сервером.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchColumn, filters, sortConfig]);

  const canEditTable = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
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
  
  const canExport = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher', 'passportist', 'supervisor'].includes(userData.role);
  };
  
  const canGenerateCertificates = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };
  
  const canViewAdminPanel = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  const goToAdminPanel = () => {
    navigate('/');
  };

  const goToInstruction = () => {
    navigate('/instruction');
  };

   
  const addSocialLeave = (rowId) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;
    
    const currentLeaves = (() => {
      try {
        const parsed = JSON.parse(data[rowIndex].column9 || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    
    const newLeave = {
      startDate: '',
      endDate: '',
      reason: ''
    };
    
    const updatedLeaves = [...currentLeaves, newLeave];
    const updatedData = [...data];
    updatedData[rowIndex].column9 = JSON.stringify(updatedLeaves);
    setData(updatedData);
    
    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        column9: JSON.stringify(updatedLeaves)
      }
    }));
  };

  const updateSocialLeave = (rowId, leaveIndex, field, value) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;
    
    const currentLeaves = (() => {
      try {
        const parsed = JSON.parse(data[rowIndex].column9 || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    
    if (leaveIndex >= currentLeaves.length) return;
    
    currentLeaves[leaveIndex] = { ...currentLeaves[leaveIndex], [field]: value };
    const updatedData = [...data];
    updatedData[rowIndex].column9 = JSON.stringify(currentLeaves);
    setData(updatedData);
    
    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        column9: JSON.stringify(currentLeaves)
      }
    }));
  };

  const removeSocialLeave = (rowId, leaveIndex) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;
    
    const currentLeaves = (() => {
      try {
        const parsed = JSON.parse(data[rowIndex].column9 || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    
    const updatedLeaves = currentLeaves.filter((_, idx) => idx !== leaveIndex);
    const updatedData = [...data];
    updatedData[rowIndex].column9 = JSON.stringify(updatedLeaves);
    setData(updatedData);
    
    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        column9: JSON.stringify(updatedLeaves)
      }
    }));
  };

  const addSupervisor = (rowId) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;
    
    const currentSupervisors = (() => {
      try {
        const parsed = JSON.parse(data[rowIndex].column33 || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    
    const newSupervisor = {
      supervisorName: '',
      position: '',    
      rank: '',         
      startDate: '',
      endDate: ''
    };
    
    const updatedSupervisors = [...currentSupervisors, newSupervisor];
    const updatedData = [...data];
    updatedData[rowIndex].column33 = JSON.stringify(updatedSupervisors);
    setData(updatedData);
    
    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        column33: JSON.stringify(updatedSupervisors)
      }
    }));
  };

  const updateSupervisor = (rowId, supervisorIndex, field, value) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;
    
    const currentSupervisors = (() => {
      try {
        const parsed = JSON.parse(data[rowIndex].column33 || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    
    if (supervisorIndex >= currentSupervisors.length) return;
    
    currentSupervisors[supervisorIndex] = { ...currentSupervisors[supervisorIndex], [field]: value };
    const updatedData = [...data];
    updatedData[rowIndex].column33 = JSON.stringify(currentSupervisors);
    setData(updatedData);
    
    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        column33: JSON.stringify(currentSupervisors)
      }
    }));
  };

  const removeSupervisor = (rowId, supervisorIndex) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;
    
    const currentSupervisors = (() => {
      try {
        const parsed = JSON.parse(data[rowIndex].column33 || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    
    const updatedSupervisors = currentSupervisors.filter((_, idx) => idx !== supervisorIndex);
    const updatedData = [...data];
    updatedData[rowIndex].column33 = JSON.stringify(updatedSupervisors);
    setData(updatedData);
    
    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        column33: JSON.stringify(updatedSupervisors)
      }
    }));
  };

  const handleCellDoubleClick = (rowId, column, currentValue, rowIndex) => {
    if (!canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }
  
    const columnNumber = parseInt(column.replace('column', ''));
    const fieldName = ColumnName[columnNumber];
    
    if (userData?.role === 'passportist') {
      const allowedFieldsForPassportist = [
        'Срок окончания регистрации',
        'Документ, удостоверяющий личность',
        'Идентификационный номер',
        'Номер документа'
      ];
      
      if (!allowedFieldsForPassportist.includes(fieldName)) {
        alert('У вас нет прав для редактирования этого поля. Паспортист может редактировать только: Срок окончания регистрации, Документ, удостоверяющий личность, Идентификационный номер, Номер документа.');
        return;
      }
    }
    
    const fieldType = getFieldType(columnNumber);
    
    let displayValue = currentValue;
    if (column === 'column16') {
      displayValue = formatPreparationForm(currentValue);
    }
  
    setEditingCell({
      rowId,
      column,
      value: displayValue,
      rowIndex,
      fieldType,
      columnNumber
    });
    setEditValue(displayValue);
  };

  const handleCellSave = async () => {
    if (editingCell.rowId === null) return;

    try {
      const { rowId, column, fieldType } = editingCell;
      
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex === -1) return;

      let valueToSave = editValue;

      if (fieldType === 'date' && valueToSave && editingCell.columnNumber !== 3) {
        valueToSave = formatDateToAPI(valueToSave);
      }

      const updatedRow = { ...data[rowIndex] };
      let valueToDisplay = editValue;
      if (editingCell.columnNumber === 3 && editValue && typeof editValue === 'string' && editValue.includes('-')) {
        valueToDisplay = editValue.split('-')[0];
      }
      updatedRow[column] = valueToDisplay;

      const updatedData = [...data];
      updatedData[rowIndex] = updatedRow;
      setData(updatedData);

      setPendingChanges(prev => ({
        ...prev,
        [rowId]: {
          ...prev[rowId],
          [column]: editValue
        }
      }));

      const apiData = transformTableDataToApi(updatedRow, 'update');
      await apiRequest(`/ordinators/${rowId}`, 'PATCH', apiData);

      setEditingCell({ rowId: null, column: null, value: '', rowIndex: null, fieldType: null, columnNumber: null, subField: null, subIndex: null });

    } catch (error) {
      console.error('Error saving cell:', error);
      alert('Ошибка при сохранении изменений');
    }
  };

  const handleCellCancel = () => {
    setEditingCell({ rowId: null, column: null, value: '', rowIndex: null, fieldType: null, columnNumber: null, subField: null, subIndex: null });
    setEditValue('');
  };

  const InlineCellEditor = ({ editingCell, editValue, setEditValue, onSave, onCancel }) => {
    const { fieldType, columnNumber } = editingCell;
    const fieldName = ColumnName[columnNumber];
    
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
    
    const inputRef = useRef(null);
    const selectRef = useRef(null);
  
    useEffect(() => {
      // Фокусируемся на элементе при монтировании
      if (selectRef.current) {
        selectRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
  
    const getOptions = () => {
      switch(fieldType) {
        case 'creatable-department':
          const departments = selectData.departments;
          const mappedOptions = departments?.map(option => ({ value: option, label: option })) || [];
          return mappedOptions;
        case 'creatable-gender':
          return selectData.gender.map(option => ({ value: option, label: option }));
        case 'creatable-country':
          return selectData.countries.map(option => ({ value: option, label: option }));
        case 'creatable-specialty':
          return selectData.specialties.map(option => ({ value: option, label: option }));
        case 'creatable-specialty-profile':
          return selectData.specialtyProfiles.map(option => ({ value: option, label: option }));
        case 'creatable-dismissal':
          return selectData.dismissalReason.map(option => ({ value: option, label: option }));
        case 'creatable-university':
          return selectData.university.map(option => ({ value: option, label: option }));
        case 'creatable-preparation':
          return selectData.preparationForm.map(option => ({ value: option, label: option }));
        case 'creatable-document':
          return selectData.identityDocument.map(option => ({ value: option, label: option }));
        case 'creatable-residence':
          return selectData.residence.map(option => ({ value: option, label: option }));
        case 'creatable-medical':
          return selectData.medicalCertificate.map(option => ({ value: option, label: option }));
        case 'creatable-rivsh':
          return selectData.rivshCertificate.map(option => ({ value: option, label: option }));
        case 'creatable-entry':
          return selectData.entryByInvitation.map(option => ({ value: option, label: option }));
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
          <div className="inline-checkbox-group" onKeyDown={handleKeyDown}>
            {selectOptions.preparationForm.map(option => (
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
                    setEditValue(JSON.stringify(newOptions));
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
          <div className="inline-creatable-wrapper" onKeyDown={handleKeyDown}>
            <CreatableSelect
              ref={selectRef}
              options={options}
              value={editValue ? { value: editValue, label: editValue } : null}
              onChange={(option) => {
                if (option) {
                  setEditValue(option.value);
                } else {
                  setEditValue('');
                }
              }}
              onKeyDown={handleKeyDown}
              isClearable
              placeholder="Выберите..."
              noOptionsMessage={() => "Нет вариантов, введите свой"}
              formatCreateLabel={(inputValue) => `Создать "${inputValue}"`}
              menuPortalTarget={document.body}
              onCreateOption={(inputValue) => {
                if (optionField) {
                  addCustomOption(optionField, inputValue);
                }
              }}
              styles={{
                menuPortal: base => ({ ...base, zIndex: 9999 }),
                container: base => ({ ...base, width: '100%' })
              }}
              className="react-select-inline"
              classNamePrefix="react-select"
              autoFocus
            />
          </div>
        );
      }
  
      switch(fieldType) {
        case 'date':
          if (columnNumber === 3) {
            let yearDisplay = editValue;
            if (editValue && typeof editValue === 'string') {
              if (editValue.includes('-')) {
                yearDisplay = editValue.split('-')[0];
              } else if (editValue.includes('.')) {
                yearDisplay = editValue.split('.')[2];
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
                  setEditValue(fullDate);
                }}
                onKeyDown={handleKeyDown}
                className="inline-input"
                placeholder="ГГГГ"
                maxLength="4"
              />
            );
          }
          const displayDate = (() => {
            if (!editValue) return '';
            if (/^\d{2}\.\d{2}\.\d{4}$/.test(editValue)) return editValue;
            if (/^\d{4}-\d{2}-\d{2}$/.test(editValue)) {
              const [year, month, day] = editValue.split('-');
              return `${day}.${month}.${year}`;
            }
            return editValue;
          })();
          const isDateInvalid = editValue && !isValidDate(displayDate);
          return (
            <>
              <input
                ref={inputRef}
                type="text"
                value={displayDate}
                onChange={(e) => setEditValue(e.target.value)}
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
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
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
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
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
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="inline-input"
            />
          );
        default:
          return (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="inline-input"
              placeholder="Введите значение..."
            />
          );
      }
    };
  
    return (
      <td className="editing-cell">
        <div className="inline-editor-container">
          {renderEditor()}
        </div>
      </td>
    );
  };

  const NestedSocialLeaveRenderer = ({ rowId, value }) => {
    const [editingLeaves, setEditingLeaves] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [originalLeaves, setOriginalLeaves] = useState([]);
    const [socialLeaveOptions, setSocialLeaveOptions] = useState([]);
    const [dateErrors, setDateErrors] = useState({});

    const canEditNested = userData?.role === 'admin' || userData?.role === 'dispatcher';

    useEffect(() => {
      loadSocialLeaveOptions();
    }, []);
  
    const loadSocialLeaveOptions = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/options`, {
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
        const response = await fetch(`${API_URL}/options/socialLeave/add`, {
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
      
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const updatedData = [...data];
        const toSave = sortLeaves(updated);
        updatedData[rowIndex].column9 = JSON.stringify(toSave);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          setOriginalLeaves(toSave);
          setEditingLeaves(JSON.parse(JSON.stringify(toSave)));
          setHasChanges(false);
          alert('Запись успешно удалена');
        } catch (error) {
          console.error('Remove error:', error);
          alert('Ошибка при удалении');
        }
      }
    };
  
    const saveChanges = async () => {
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const sorted = sortLeaves(editingLeaves);
        const updatedData = [...data];
        updatedData[rowIndex].column9 = JSON.stringify(sorted);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          if (!response.ok) {
            throw new Error('Ошибка сохранения');
          }
          setOriginalLeaves(sorted);
          setEditingLeaves(JSON.parse(JSON.stringify(sorted)));
          setHasChanges(false);
          alert('Изменения успешно сохранены');
        } catch (error) {
          console.error('Save error:', error);
          alert('Ошибка при сохранении');
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
          {canEditNested && (
          <button onClick={addLeave} className="nested-add-btn">
            <Plus size={14} />
            <span>Добавить период</span>
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
                readOnly={!canEditNested}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-endDate`] ? 'date-error' : ''}`}
                placeholder="Дата окончания"
                value={leave?.endDate ? formatDateToDisplay(leave.endDate) : ''}
                onChange={(e) => updateLeave(originalIdx, 'endDate', e.target.value)}
                readOnly={!canEditNested}
              />
                {canEditNested ? (
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
                {canEditNested && (
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
          
          {canEditNested && (editingLeaves.length <= 1 || isExpanded) && (
            <button onClick={addLeave} className="nested-add-btn">
              <Plus size={14} />
              <span>Добавить период</span>
            </button>
          )}
          
          {canEditNested && hasChanges && (
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
  
  const ExtensionsRenderer = ({ rowId, value }) => {
    const canEdit = userData?.role === 'admin' || userData?.role === 'dispatcher';
    
    const [editingExtensions, setEditingExtensions] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [originalExtensions, setOriginalExtensions] = useState([]);
    const [dateErrors, setDateErrors] = useState({});

    useEffect(() => {
      try {
        const parsed = JSON.parse(value || '[]');
        const newValue = Array.isArray(parsed) ? parsed : [];
        const sorted = sortExtensions(newValue);
        setOriginalExtensions(sorted);
        setEditingExtensions(JSON.parse(JSON.stringify(sorted)));
        setHasChanges(false);
      } catch {
        setOriginalExtensions([]);
        setEditingExtensions([]);
        setHasChanges(false);
      }
    }, [value]);
  
    const updateExtension = (idx, field, val) => {
      const updated = [...editingExtensions];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], [field]: val };
        setEditingExtensions(updated);
        setHasChanges(true);
      }
      if (field === 'orderDate') {
        if (val && !isValidDate(val)) {
          setDateErrors(prev => ({ ...prev, [`${idx}-${field}`]: true }));
        } else {
          setDateErrors(prev => ({ ...prev, [`${idx}-${field}`]: false }));
        }
      }
    };
  
    const addExtension = () => {
      const newExtension = { orderNumber: '', orderDate: '', extensionTerm: '1 год' };
      const updated = [...editingExtensions, newExtension];
      setEditingExtensions(updated);
      setHasChanges(true);
    };
  
    const removeExtension = async (idx) => {
      const updated = editingExtensions.filter((_, i) => i !== idx);
      setEditingExtensions(updated);
      setHasChanges(updated.length > 0);
      
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const updatedData = [...data];
        const toSave = sortExtensions(updated);
        updatedData[rowIndex].column27 = JSON.stringify(toSave);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          setOriginalExtensions(toSave);
          setEditingExtensions(JSON.parse(JSON.stringify(toSave)));
          setHasChanges(false);
          alert('Запись успешно удалена');
        } catch (error) {
          console.error('Remove error:', error);
          alert('Ошибка при удалении');
        }
      }
    };
  
    const saveChanges = async () => {
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const sorted = sortExtensions(editingExtensions);
        const updatedData = [...data];
        updatedData[rowIndex].column27 = JSON.stringify(sorted);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          if (!response.ok) {
            throw new Error('Ошибка сохранения');
          }
          setOriginalExtensions(sorted);
          setEditingExtensions(JSON.parse(JSON.stringify(sorted)));
          setHasChanges(false);
          alert('Изменения успешно сохранены');
        } catch (error) {
          console.error('Save error:', error);
          alert('Ошибка при сохранении');
        }
      }
    };
  
    const sortExtensions = (extensions) => {
      return [...extensions].sort((a, b) => {
        const dateA = a?.orderDate ? new Date(a.orderDate) : new Date(0);
        const dateB = b?.orderDate ? new Date(b.orderDate) : new Date(0);
        return dateB - dateA;
      });
    };
  
    const displayExtensions = isExpanded ? editingExtensions : [editingExtensions[0]].filter(l => l);
    const extensionTerms = ['1 год', '2 года', '3 года'];
  
    if (editingExtensions.length === 0) {
      return (
        <div className="nested-cell">
          {canEdit && (
            <button onClick={addExtension} className="nested-add-btn">
              <Plus size={14} />
              <span>Добавить продление</span>
            </button>
          )}
        </div>
      );
    }
  
    return (
      <div className="nested-cell">
        {displayExtensions.map((ext, idx) => {
          const originalIdx = editingExtensions.findIndex(l => l === ext);
          return (
            <div key={idx} className={!isExpanded && idx === 0 ? "last-item-row" : "nested-item-row"}>
              <div className="nested-fields-row">
                <input
                  type="text"
                  className="nested-date-term"
                  placeholder="Номер приказа"
                  value={ext?.orderNumber || ''}
                  onChange={(e) => updateExtension(originalIdx, 'orderNumber', e.target.value)}
                  readOnly={!canEdit}
                />
                <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-orderDate`] ? 'date-error' : ''}`}
                placeholder="Дата приказа"
                value={ext?.orderDate ? formatDateToDisplay(ext.orderDate) : ''}
                onChange={(e) => updateExtension(originalIdx, 'orderDate', e.target.value)}
                readOnly={!canEdit}
              />
                <select
                  className="nested-term-select"
                  value={ext?.extensionTerm || '1 год'}
                  onChange={(e) => updateExtension(originalIdx, 'extensionTerm', e.target.value)}
                  disabled={!canEdit}
                >
                  {extensionTerms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
                {canEdit && (
                  <button onClick={() => removeExtension(originalIdx)} className="nested-remove-btn">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="nested-actions">
          {editingExtensions.length > 1 && (
            <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "▲ Свернуть" : `▼ Развернуть (${editingExtensions.length - 1})`}
            </button>
          )}
          
          {canEdit && (editingExtensions.length <= 1 || isExpanded) && (
            <button onClick={addExtension} className="nested-add-btn">
              <Plus size={14} />
              <span>Добавить продление</span>
            </button>
          )}

          {canEdit && hasChanges && (
            <button onClick={saveChanges} className="nested-save-btn">
              💾 Сохранить
            </button>
          )}
        </div>
      </div>
    );
  };
  
  const AllowanceRenderer = ({ rowId, value }) => {
    const [editingAllowances, setEditingAllowances] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [originalAllowances, setOriginalAllowances] = useState([]);
    const [dateErrors, setDateErrors] = useState({});

    const canEdit = userData?.role === 'admin' || userData?.role === 'dispatcher';

    useEffect(() => {
      try {
        const parsed = JSON.parse(value || '[]');
        const newValue = Array.isArray(parsed) ? parsed : [];
        const sorted = sortAllowances(newValue);
        setOriginalAllowances(sorted);
        setEditingAllowances(JSON.parse(JSON.stringify(sorted)));
        setHasChanges(false);
      } catch {
        setOriginalAllowances([]);
        setEditingAllowances([]);
        setHasChanges(false);
      }
    }, [value]);
  
    const updateAllowance = (idx, field, val) => {
      const updated = [...editingAllowances];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], [field]: val };
        setEditingAllowances(updated);
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
  
    const addAllowance = () => {
      const newAllowance = { orderNumber: '', startDate: '', endDate: '' };
      const updated = [...editingAllowances, newAllowance];
      setEditingAllowances(updated);
      setHasChanges(true);
    };
  
    const removeAllowance = async (idx) => {
      const updated = editingAllowances.filter((_, i) => i !== idx);
      setEditingAllowances(updated);
      setHasChanges(updated.length > 0);
      
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const updatedData = [...data];
        const toSave = sortAllowances(updated);
        updatedData[rowIndex].column36 = JSON.stringify(toSave);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          setOriginalAllowances(toSave);
          setEditingAllowances(JSON.parse(JSON.stringify(toSave)));
          setHasChanges(false);
          alert('Запись успешно удалена');
        } catch (error) {
          console.error('Remove error:', error);
          alert('Ошибка при удалении');
        }
      }
    };
  
    const saveChanges = async () => {
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const sorted = sortAllowances(editingAllowances);
        const updatedData = [...data];
        updatedData[rowIndex].column36 = JSON.stringify(sorted);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          if (!response.ok) {
            throw new Error('Ошибка сохранения');
          }
          setOriginalAllowances(sorted);
          setEditingAllowances(JSON.parse(JSON.stringify(sorted)));
          setHasChanges(false);
          alert('Изменения успешно сохранены');
        } catch (error) {
          console.error('Save error:', error);
          alert('Ошибка при сохранении');
        }
      }
    };
  
    const sortAllowances = (allowances) => {
      return [...allowances].sort((a, b) => {
        const dateA = a?.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b?.startDate ? new Date(b.startDate) : new Date(0);
        return dateB - dateA;
      });
    };
  
    const displayAllowances = isExpanded ? editingAllowances : [editingAllowances[0]].filter(l => l);
  
    if (editingAllowances.length === 0) {
      return (
        <div className="nested-cell">
          {canEdit && (
            <button onClick={addAllowance} className="nested-add-btn">
              <Plus size={14} />
              <span>Добавить надбавку</span>
            </button>
          )}
        </div>
      );
    }
  
    return (
      <div className="nested-cell">
        {displayAllowances.map((item, idx) => {
          const originalIdx = editingAllowances.findIndex(l => l === item);
          return (
            <div key={idx} className={!isExpanded && idx === 0 ? "last-item-row" : "nested-item-row"}>
              <div className="nested-fields-row">
                <input
                  type="text"
                  className="nested-date-term"
                  placeholder="Номер приказа"
                  value={item?.orderNumber || ''}
                  onChange={(e) => updateAllowance(originalIdx, 'orderNumber', e.target.value)}
                  readOnly={!canEdit}
                />
                <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-startDate`] ? 'date-error' : ''}`}
                placeholder="Дата начала"
                value={item?.startDate ? formatDateToDisplay(item.startDate) : ''}
                onChange={(e) => updateAllowance(originalIdx, 'startDate', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-endDate`] ? 'date-error' : ''}`}
                placeholder="Дата окончания"
                value={item?.endDate ? formatDateToDisplay(item.endDate) : ''}
                onChange={(e) => updateAllowance(originalIdx, 'endDate', e.target.value)}
                readOnly={!canEdit}
              />
                {canEdit && (
                  <button onClick={() => removeAllowance(originalIdx)} className="nested-remove-btn">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="nested-actions">
          {editingAllowances.length > 1 && (
            <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "▲ Свернуть" : `▼ Развернуть (${editingAllowances.length - 1})`}
            </button>
          )}
          
          {canEdit && (editingAllowances.length <= 1 || isExpanded) && (
            <button onClick={addAllowance} className="nested-add-btn">
              <Plus size={14} />
              <span>Добавить надбавку</span>
            </button>
          )}
          
          {canEdit && hasChanges && (
            <button onClick={saveChanges} className="nested-save-btn">
              💾 Сохранить
            </button>
          )}
        </div>
      </div>
    );
  };

  const LastSupervisorRenderer = ({ value }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const cellRef = useRef(null);
    
    const supervisors = (() => {
      try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    const getLastSupervisor = () => {
      if (supervisors.length === 0) return null;
      
      const sorted = [...supervisors].sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        return dateB - dateA;
      });
      
      return sorted[0];
    };

    const lastSupervisor = getLastSupervisor();

    const getAllSupervisorsList = () => {
      if (supervisors.length === 0) return 'Нет руководителей';
      
      return supervisors.map((s, idx) => {
        let name = s.supervisorName || '—';
        if (s.position) name += `, ${s.position}`;
        if (s.rank) name += ` (${s.rank})`;
        if (s.startDate) name += `\n   с ${formatDateToDisplay(s.startDate)}`;
        if (s.endDate) name += ` по ${formatDateToDisplay(s.endDate)}`;
        return `${idx + 1}. ${name}`;
      }).join('\n\n');
    };

    const handleMouseEnter = () => {
      setShowTooltip(true);
    };

    const handleMouseLeave = () => {
      setShowTooltip(false);
    };

    if (!lastSupervisor || !lastSupervisor.supervisorName) {
      return <span className="no-supervisor">—</span>;
    }

    let displayName = lastSupervisor.supervisorName;
    if (lastSupervisor.position) displayName += `, ${lastSupervisor.position}`;
    if (lastSupervisor.rank) displayName += ` (${lastSupervisor.rank})`;

    return (
      <>
        <span
          ref={cellRef}
          className="last-supervisor-name"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {displayName}
        </span>
        {showTooltip && (
          <div className="supervisors-tooltip">
            <div className='supervizor-label' >
              Все руководители ({supervisors.length}):
            </div>
            <div>{getAllSupervisorsList()}</div>
            <div className='supervizor-all'/>
          </div>
        )}
      </>
    );
  };

  const NestedSupervisorsRenderer = ({ rowId, value }) => {
    const canEdit = !modalState.isOpen && (userData?.role === 'admin' || userData?.role === 'dispatcher');
    
    const [editingSupervisors, setEditingSupervisors] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [originalSupervisors, setOriginalSupervisors] = useState([]);
    const [dateErrors, setDateErrors] = useState({});

    useEffect(() => {
      try {
        const parsed = JSON.parse(value || '[]');
        const newValue = Array.isArray(parsed) ? parsed : [];
        const sorted = sortSupervisors(newValue);
        setOriginalSupervisors(sorted);
        setEditingSupervisors(JSON.parse(JSON.stringify(sorted)));
        setHasChanges(false);
      } catch {
        setOriginalSupervisors([]);
        setEditingSupervisors([]);
        setHasChanges(false);
      }
    }, [value]);
  
    const updateSupervisor = (idx, field, val) => {
      const updated = [...editingSupervisors];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], [field]: val };
        setEditingSupervisors(updated);
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
  
    const addSupervisor = () => {
      const newSupervisor = { supervisorName: '', position: '', rank: '', startDate: '', endDate: '' };
      const updated = [...editingSupervisors, newSupervisor];
      setEditingSupervisors(updated);
      setHasChanges(true);
    };
  
    const removeSupervisor = async (idx) => {
      const updated = editingSupervisors.filter((_, i) => i !== idx);
      setEditingSupervisors(updated);
      setHasChanges(updated.length > 0);
      
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const updatedData = [...data];
        const toSave = sortSupervisors(updated);
        updatedData[rowIndex].column33 = JSON.stringify(toSave);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          setOriginalSupervisors(toSave);
          setEditingSupervisors(JSON.parse(JSON.stringify(toSave)));
          setHasChanges(false);
          alert('Руководитель успешно удален');
        } catch (error) {
          console.error('Remove error:', error);
          alert('Ошибка при удалении');
        }
      }
    };
  
    const saveChanges = async () => {
      const token = localStorage.getItem('auth_token');
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        const sorted = sortSupervisors(editingSupervisors);
        const updatedData = [...data];
        updatedData[rowIndex].column33 = JSON.stringify(sorted);
        setData(updatedData);
        const apiData = transformTableDataToApi(updatedData[rowIndex], 'update');
        
        try {
          const response = await fetch(`${API_URL}/ordinators/${rowId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          if (!response.ok) {
            throw new Error('Ошибка сохранения');
          }
          setOriginalSupervisors(sorted);
          setEditingSupervisors(JSON.parse(JSON.stringify(sorted)));
          setHasChanges(false);
          alert('Изменения успешно сохранены');
        } catch (error) {
          console.error('Save error:', error);
          alert('Ошибка при сохранении');
        }
      }
    };
  
    const sortSupervisors = (supervisors) => {
      return [...supervisors].sort((a, b) => {
        const dateA = a?.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b?.startDate ? new Date(b.startDate) : new Date(0);
        return dateB - dateA;
      });
    };
  
    const displaySupervisors = isExpanded ? editingSupervisors : [editingSupervisors[0]].filter(l => l);
  
    if (editingSupervisors.length === 0) {
      return (
        <div className="nested-cell">
          {canEdit && (
            <button onClick={addSupervisor} className="nested-add-btn">
              <Plus size={14} />
              <span>Добавить руководителя</span>
            </button>
          )}
        </div>
      );
    }
  
    return (
      <div className="nested-cell">
        {displaySupervisors.map((sup, idx) => {
          const originalIdx = editingSupervisors.findIndex(l => l === sup);
          return (
            <div key={idx} className={!isExpanded && idx === 0 ? "last-item-row" : "nested-item-row"}>
              <div className="nested-fields-row">
                <input
                  type="text"
                  className="nested-date-term"
                  placeholder="ФИО руководителя"
                  value={sup?.supervisorName || ''}
                  onChange={(e) => updateSupervisor(originalIdx, 'supervisorName', e.target.value)}
                  readOnly={!canEdit}
                />
                <input
                  type="text"
                  className="nested-date-term"
                  placeholder="Должность"
                  value={sup?.position || ''}
                  onChange={(e) => updateSupervisor(originalIdx, 'position', e.target.value)}
                  readOnly={!canEdit}
                />
                <input
                  type="text"
                  className="nested-date-term"
                  placeholder="Звание"
                  value={sup?.rank || ''}
                  onChange={(e) => updateSupervisor(originalIdx, 'rank', e.target.value)}
                  readOnly={!canEdit}
                />
                <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-startDate`] ? 'date-error' : ''}`}
                placeholder="Дата начала"
                value={sup?.startDate ? formatDateToDisplay(sup.startDate) : ''}
                onChange={(e) => updateSupervisor(originalIdx, 'startDate', e.target.value)}
                readOnly={!canEdit}
              />
              <input
                type="text"
                className={`nested-date-term ${dateErrors[`${originalIdx}-endDate`] ? 'date-error' : ''}`}
                placeholder="Дата окончания"
                value={sup?.endDate ? formatDateToDisplay(sup.endDate) : ''}
                onChange={(e) => updateSupervisor(originalIdx, 'endDate', e.target.value)}
                readOnly={!canEdit}
              />
                {canEdit && (
                  <button onClick={() => removeSupervisor(originalIdx)} className="nested-remove-btn">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="nested-actions">
          {editingSupervisors.length > 1 && (
            <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "▲ Свернуть" : `▼ Развернуть (${editingSupervisors.length - 1})`}
            </button>
          )}
          
          {canEdit && (editingSupervisors.length <= 1 || isExpanded) && (
            <button onClick={addSupervisor} className="nested-add-btn">
              <Plus size={14} />
              <span>Добавить руководителя</span>
            </button>
          )}
          
          {canEdit && hasChanges && (
            <button 
              onClick={saveChanges} 
              className="nested-save-btn"
              disabled={Object.values(dateErrors).some(error => error === true)}
            >
              💾 Сохранить
            </button>
          )}
        </div>
      </div>
    );
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
          initialRowData[columnKey] = selectOptions.gender[0] || '';
          break;
        case 'Причина отчисления':
          initialRowData[columnKey] = selectOptions.dismissalReason[0] || '';
          break;
        case 'Социальный отпуск':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        case 'ВУЗ':
          initialRowData[columnKey] = selectOptions.university[0] || '';
          break;
        case 'Форма подготовки':
          const defaultPrepForm = modalState.selectedPreparationForm;
          initialRowData[columnKey] = JSON.stringify(defaultPrepForm);
          break;
        case 'Документ, удостоверяющий личность':
          initialRowData[columnKey] = selectOptions.identityDocument[0] || '';
          break;
        case 'Место проживания, регистрации':
          initialRowData[columnKey] = selectOptions.residence[0] || '';
          break;
        case 'Медицинская справка':
          initialRowData[columnKey] = selectOptions.medicalCertificate[0] || '';
          break;
        case 'Наличие сертификата РИВШ':
          initialRowData[columnKey] = selectOptions.rivshCertificate[0] || 'нет';
          break;
        case 'Въезд по приглашению':
          initialRowData[columnKey] = selectOptions.entryByInvitation[0] || 'нет';
          break;
        case 'Страна':
          initialRowData[columnKey] = selectOptions.country[0] || '';
          break;
        case 'Руководители':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        case 'Номер приказа о продлении':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        case 'Надбавка':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        case 'Дата приказа о продлении':
          initialRowData[columnKey] = '';
          break;
        case 'Срок продления':
          initialRowData[columnKey] = '';
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
      otherDismissalReason: '',
      otherCountry: '',
      selectedPreparationForm: selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['']
    });
  };

  const handleRowClick = async (rowIndex, row, mode = 'edit') => {
    if (mode === 'edit' && !canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }
    
    try {
      const response = await apiRequest(`/ordinators/${row.id}`);
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
      let otherDismissal = '';
      let prepForm = selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : [''];
      
      if (row['column11'] && !selectOptions.university.includes(row['column11'])) {
        otherUni = row['column11'];
      }
      if (row['column17'] && !selectOptions.identityDocument.includes(row['column17'])) {
        otherDoc = row['column17'];
      }
      if (row['column8'] && !selectOptions.dismissalReason.includes(row['column8'])) {
        otherDismissal = row['column8'];
      }
      
      try {
        if (row['column16']) {
          const parsed = JSON.parse(row['column16']);
          prepForm = Array.isArray(parsed) ? parsed : (selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['']);
        }
      } catch (e) {
        console.error('Ошибка парсинга данных:', e);
        prepForm = selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : [''];
      }
      
      setModalState({
        isOpen: true,
        mode: mode,
        selectedRow: {
          index: rowIndex,
          id: row.id,
          originalIndex: data.indexOf(row)
        },
        rowData: rowValues,
        otherUniversity: otherUni,
        otherDocument: otherDoc,
        otherDismissalReason: otherDismissal,
        otherCountry: '',
        selectedPreparationForm: prepForm
      });
      setNewRowData({ ...row });
    } catch (error) {
      console.error('Error fetching ordinator details:', error);
      alert('Не удалось загрузить данные');
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

  const handleBulkDelete = async () => {
    if (!canDeleteRow()) {
      alert('У вас нет прав для удаления записей');
      return;
    }
    
    if (selectedRows.size === 0) {
      alert('Выберите хотя бы одну запись для удаления');
      return;
    }
    
    const confirmed = window.confirm(`Вы уверены, что хотите удалить ${selectedRows.size} запись(ей)? Это действие нельзя отменить.`);
    
    if (!confirmed) return;
    
    setLoading(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const failedIds = [];
      
      for (const rowId of selectedRows) {
        try {
          await apiRequest(`/ordinators/${rowId}`, 'DELETE');
          successCount++;
        } catch (error) {
          console.error(`Ошибка удаления записи ${rowId}:`, error);
          errorCount++;
          failedIds.push(rowId);
        }
      }
      
      await fetchOrdinators();
      setSelectedRows(new Set());
      setSelectAll(false);
      
      if (errorCount > 0) {
        alert(`Удалено: ${successCount} записей. Ошибок: ${errorCount}\nНе удалось удалить ID: ${failedIds.join(', ')}`);
      } else {
        alert(`Успешно удалено ${successCount} записей`);
      }
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      alert('Ошибка при массовом удалении: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalChange = (column, value) => {
    const valueToSet = value && typeof value === 'object' && value.value !== undefined 
      ? value.value 
      : value;

    if (value && typeof value === 'object' && value.__isNew__) {
      const columnNumber = parseInt(column.replace('column', ''));
      const fieldName = ColumnName[columnNumber];
      
      let optionField = '';
      if (fieldName === 'Страна') optionField = 'country';
      else if (fieldName === 'Кафедра') optionField = 'departments';
      else if (fieldName === 'Профиль специальности') optionField = 'specialtyProfiles';
      else if (fieldName === 'Пол') optionField = 'gender';
      else if (fieldName === 'Причина отчисления') optionField = 'dismissalReason';
      else if (fieldName === 'ВУЗ') optionField = 'university';
      else if (fieldName === 'Форма подготовки') optionField = 'preparationForm';
      else if (fieldName === 'Документ, удостоверяющий личность') optionField = 'identityDocument';
      else if (fieldName === 'Место проживания, регистрации') optionField = 'residence';
      else if (fieldName === 'Медицинская справка') optionField = 'medicalCertificate';
      else if (fieldName === 'Наличие сертификата РИВШ') optionField = 'rivshCertificate';
      else if (fieldName === 'Въезд по приглашению') optionField = 'entryByInvitation';
      
      if (optionField) {
        addCustomOption(optionField, value.value);
      }
    }

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
      otherDismissalReason: '',
      otherCountry: '',
      selectedPreparationForm: selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['']
    });
    setNewRowData({});
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
    setFilters([]); 
    setFilterLogic('AND');
    setSortConfig({ key: null, direction: 'ascending' });
    setSelectedRows(new Set());
    setSelectAll(false);
  };

  const handleSort = (columnKey) => {
    if (sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      setSortConfig({ key: columnKey, direction: 'descending' });
    } else if (sortConfig.key === columnKey && sortConfig.direction === 'descending') {
      // Третий клик - сброс сортировки
      setSortConfig({ key: null, direction: 'ascending' });
    } else {
      setSortConfig({ key: columnKey, direction: 'ascending' });
    }
  };

  const getSortedData = (dataToSort) => {
    if (!sortConfig.key || !dataToSort.length) return dataToSort;
    
    return [...dataToSort].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      const columnNumber = parseInt(sortConfig.key.replace('column', ''));
      const fieldName = ColumnName[columnNumber];
      
      // Обработка специальных колонок
      if (sortConfig.key === 'column16') {
        aValue = formatPreparationForm(aValue);
        bValue = formatPreparationForm(bValue);
      }
      
      // Обработка вложенных колонок для сортировки
      if (sortConfig.key === 'column33') {
        try {
          const aSupervisors = JSON.parse(aValue || '[]');
          const bSupervisors = JSON.parse(bValue || '[]');
          
          // Получаем последнего руководителя по дате начала
          const getLastSupervisor = (supervisors) => {
            if (!Array.isArray(supervisors) || supervisors.length === 0) return null;
            const sorted = [...supervisors].sort((x, y) => {
              const dateX = x.startDate ? new Date(x.startDate) : new Date(0);
              const dateY = y.startDate ? new Date(y.startDate) : new Date(0);
              return dateY - dateX;
            });
            return sorted[0];
          };
          
          const aLast = getLastSupervisor(aSupervisors);
          const bLast = getLastSupervisor(bSupervisors);
          
          aValue = aLast?.supervisorName || '';
          bValue = bLast?.supervisorName || '';
        } catch {
          aValue = '';
          bValue = '';
        }
      }
      
      if (sortConfig.key === 'column9') {
        try {
          const aLeaves = JSON.parse(aValue || '[]');
          const bLeaves = JSON.parse(bValue || '[]');
          
          // Сортируем по дате начала первого отпуска
          const getFirstLeaveDate = (leaves) => {
            if (!Array.isArray(leaves) || leaves.length === 0) return null;
            const validDates = leaves
              .map(l => l.startDate ? new Date(l.startDate) : null)
              .filter(d => d && !isNaN(d));
            if (validDates.length === 0) return null;
            return Math.min(...validDates);
          };
          
          const aDate = getFirstLeaveDate(aLeaves);
          const bDate = getFirstLeaveDate(bLeaves);
          
          aValue = aDate ? aDate.getTime() : '';
          bValue = bDate ? bDate.getTime() : '';
        } catch {
          aValue = '';
          bValue = '';
        }
      }
      
      // Определяем тип колонки для правильной сортировки
      const dateColumns = [3, 6, 7, 22, 24, 26, 30, 34, 35];
      const numberColumns = [12]; // Год окончания и другие числовые колонки
      
      // Сортировка для дат
      if (dateColumns.includes(columnNumber)) {
        const dateA = aValue ? new Date(formatDateToAPI(aValue)) : null;
        const dateB = bValue ? new Date(formatDateToAPI(bValue)) : null;
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (!dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        const timeA = dateA.getTime();
        const timeB = dateB.getTime();
        
        return sortConfig.direction === 'ascending' 
          ? timeA - timeB 
          : timeB - timeA;
      }
      
      // Сортировка для чисел
      if (numberColumns.includes(columnNumber)) {
        const numA = parseFloat(aValue);
        const numB = parseFloat(bValue);
        
        if (isNaN(numA) && isNaN(numB)) return 0;
        if (isNaN(numA)) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (isNaN(numB)) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        return sortConfig.direction === 'ascending' 
          ? numA - numB 
          : numB - numA;
      }
      
      // Сортировка для года рождения (колонка 3)
      if (columnNumber === 3) {
        const yearA = parseInt(aValue);
        const yearB = parseInt(bValue);
        
        if (isNaN(yearA) && isNaN(yearB)) return 0;
        if (isNaN(yearA)) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (isNaN(yearB)) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        return sortConfig.direction === 'ascending' 
          ? yearA - yearB 
          : yearB - yearA;
      }
      
      // Сортировка для boolean значений (есть/нет)
      const booleanColumns = [38, 39]; // Сертификат РИВШ, Въезд по приглашению
      if (booleanColumns.includes(columnNumber)) {
        const boolA = aValue === 'есть' || aValue === 'да' ? 1 : 0;
        const boolB = bValue === 'есть' || bValue === 'да' ? 1 : 0;
        
        return sortConfig.direction === 'ascending' 
          ? boolA - boolB 
          : boolB - boolA;
      }
      
      // Стандартная строковая сортировка
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

  const filteredData = applyFilters(
    data.filter(row => {
      if (!searchTerm.trim()) return true;
      
      const searchTermLower = searchTerm.toLowerCase().trim();
      
      if (searchColumn === 'all') {
        for (const [key, value] of Object.entries(row)) {
          if (key !== 'id' && key !== 'originalData') {
            let displayValue = value;
            
            if (key === 'column16') {
              displayValue = formatPreparationForm(value);
            }
            
            if (key === 'column27') {
              try {
                const extensions = JSON.parse(value || '[]');
                if (Array.isArray(extensions)) {
                  displayValue = extensions.map(ext => 
                    `${ext.orderNumber || ''} (${formatDateToDisplay(ext.orderDate) || ''}, срок: ${ext.extensionTerm || ''})`
                  ).join('; ');
                }
              } catch {
                displayValue = value;
              }
            }
            
            if (key === 'column9') {
              try {
                const leaves = JSON.parse(displayValue || '[]');
                if (Array.isArray(leaves)) {
                  displayValue = leaves.map(l => 
                    `${formatDateToDisplay(l.startDate) || ''} - ${formatDateToDisplay(l.endDate) || ''} (${l.reason || ''})`
                  ).join('; ');
                }
              } catch {
                displayValue = displayValue;
              }
            }

            if (key === 'column36') {
              try {
                const allowances = JSON.parse(value || '[]');
                if (Array.isArray(allowances)) {
                  displayValue = allowances.map(allow => 
                    `${allow.orderNumber || ''} (${formatDateToDisplay(allow.startDate) || ''} - ${formatDateToDisplay(allow.endDate) || ''})`
                  ).join('; ');
                }
              } catch {
                displayValue = value;
              }
            }
            
            if (key === 'column33') {
              try {
                const supervisors = JSON.parse(value || '[]');
                if (Array.isArray(supervisors) && supervisors.length > 0) {
                  const supervisorsInfo = supervisors.map(sup => {
                    let info = sup.supervisorName || '';
                    if (sup.position) info += ` ${sup.position}`;
                    if (sup.rank) info += ` ${sup.rank}`;
                    if (sup.startDate) info += ` ${formatDateToDisplay(sup.startDate)}`;
                    if (sup.endDate) info += ` ${formatDateToDisplay(sup.endDate)}`;
                    return info;
                  }).join(' ');
                  
                  if (supervisorsInfo.toLowerCase().includes(searchTermLower)) return true;
                }
              } catch (e) {
              }
              continue;
            }
            
            const dateColumnNumbers = [3, 6, 7, 22, 24, 26, 30, 34, 35];
            const columnNumber = parseInt(key.replace('column', ''));
            
            if (dateColumnNumbers.includes(columnNumber)) {
              const dateString = formatDateToDisplay(displayValue);
              if (dateString.toLowerCase().includes(searchTermLower)) {
                return true;
              }
              continue;
            }
            
            if (String(displayValue || '').toLowerCase().includes(searchTermLower)) return true;
          }
        }
        return false;
      } else {
        let displayValue = row[searchColumn];
        const columnNumber = parseInt(searchColumn.replace('column', ''));
        
        if (searchColumn === 'column16') {
          displayValue = formatPreparationForm(displayValue);
        }
        
        if (searchColumn === 'column33') {
          try {
            const supervisors = JSON.parse(row[searchColumn] || '[]');
            if (Array.isArray(supervisors) && supervisors.length > 0) {
              const supervisorsInfo = supervisors.map(sup => {
                let info = sup.supervisorName || '';
                if (sup.position) info += ` ${sup.position}`;
                if (sup.rank) info += ` ${sup.rank}`;
                if (sup.startDate) info += ` ${formatDateToDisplay(sup.startDate)}`;
                if (sup.endDate) info += ` ${formatDateToDisplay(sup.endDate)}`;
                return info;
              }).join(' ');
              
              return supervisorsInfo.toLowerCase().includes(searchTermLower);
            }
            return false;
          } catch (e) {
            return false;
          }
        }
        
        if (searchColumn === 'column9') {
          try {
            const leaves = JSON.parse(displayValue || '[]');
            if (Array.isArray(leaves)) {
              displayValue = leaves.map(l => 
                `${formatDateToDisplay(l.startDate) || ''} - ${formatDateToDisplay(l.endDate) || ''} (${l.reason || ''})`
              ).join('; ');
            }
          } catch {
            displayValue = displayValue;
          }
        }
        
        if (searchColumn === 'column27') {
          try {
            const extensions = JSON.parse(displayValue || '[]');
            if (Array.isArray(extensions)) {
              displayValue = extensions.map(ext => 
                `${ext.orderNumber || ''} (${formatDateToDisplay(ext.orderDate) || ''}, срок: ${ext.extensionTerm || ''})`
              ).join('; ');
            }
          } catch {
            displayValue = displayValue;
          }
        }
        
        if (searchColumn === 'column36') {
          try {
            const allowances = JSON.parse(displayValue || '[]');
            if (Array.isArray(allowances)) {
              displayValue = allowances.map(allow => 
                `${allow.orderNumber || ''} (${formatDateToDisplay(allow.startDate) || ''} - ${formatDateToDisplay(allow.endDate) || ''})`
              ).join('; ');
            }
          } catch {
            displayValue = displayValue;
          }
        }
        
        const dateColumnNumbers = [3, 6, 7, 22, 24, 26, 30, 34, 35];
        
        if (dateColumnNumbers.includes(columnNumber)) {
          const dateString = formatDateToDisplay(displayValue);
          return dateString.toLowerCase().includes(searchTermLower);
        }
        
        return String(displayValue || '').toLowerCase().includes(searchTermLower);
      }
    })
  );

  const sortedFilteredData = getSortedData(filteredData);
  const totalPages = Math.ceil(sortedFilteredData.length / ROWS_PER_PAGE);
  const paginatedData = sortedFilteredData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  useEffect(() => {
    const allFilteredIds = sortedFilteredData.map(row => row.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedRows.has(id));
    setSelectAll(isAllSelected);
  }, [selectedRows, sortedFilteredData]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const renderModalField = (columnName, columnNumber, isEditMode = false, currentValue = '') => {
    const fieldName = ColumnName[columnNumber];
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
      const currentFieldName = ColumnName[columnNumber];
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

  const extensionTerms = ['1 год', '2 года', '3 года'];

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
              {extensionTerms.map(term => (
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

      case 'Дата приказа о продлении':
              return (
                <input
                  type="text"
                  value={formatDateToDisplay(value)}
                  onChange={(e) => handleChange(e.target.value)}
                  className="modal-input"
                  placeholder="ДД.ММ.ГГГГ"
                />
              );
            
      case 'Срок продления':
              return (
                <select
                  value={value || ''}
                  onChange={(e) => handleChange(e.target.value)}
                  className="modal-input"
                >
                  <option value="">Выберите срок</option>
                  <option value="1 год">1 год</option>
                  <option value="2 года">2 года</option>
                  <option value="3 года">3 года</option>
                </select>
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

  if (!userData || optionsLoading) {
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

  const PaginationComponent = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="page-button">««</button>
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="page-button">«</button>
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`page-button ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="page-button">»</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="page-button">»»</button>
      </div>
    );
  };

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
                <span className={`role-badge role-${userData.role}-table`}>
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
                  {userData.role === 'admin' && (
                    <div className="menu-item" onClick={goToAdminPanel}>
                      <span>Панель администратора</span>
                    </div>
                  )}
                  <div className="menu-item" onClick={fetchOrdinators}>
                    <span>Обновить данные</span>
                  </div>
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
        </div>

        <div className="header-center">
          <div className="app-title">
            <h1>Система управления ординаторами</h1>
            <p>Таблица данных клинических ординаторов</p>
            <p className="data-info">Количество ординаторов: {data.length}</p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions">
          {canViewAdminPanel() && (
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
              <div className="mobile-menu-item" onClick={fetchOrdinators}>
                <span>🔄 Обновить данные</span>
              </div>
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
            <input
              type="text"
              placeholder="Введите текст для поиска"
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
              {columns.map((col, index) => {
                const columnName = ColumnName[index + 1];
                if (!columnName || columnName === '') return null;
                return (
                  <option key={col} value={col}>
                    {columnName}
                  </option>
                );
              })}
            </select>
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`filter-button ${filters.length > 0 ? 'active' : ''}`}
              title="Настройка фильтров"
            >
              <Filter size={18} />
              <span>Фильтры {filters.length > 0 && `(${filters.length})`}</span>
            </button>
            <button 
              onClick={handleResetSearch} 
              className="reset-search-button"
            >
              Сброс
            </button>
              <button 
                onClick={() => setShowColumnsPanel(!showColumnsPanel)}
                className={`columns-button ${visibleColumns.size < 40 ? 'active' : ''}`}
                title="Выбор колонок для отображения"
              >
                <Eye size={18} />
                <span>Колонки</span>
              </button>
              {canGenerateCertificates() && (
              <button 
                onClick={() => setShowCertificatePanel(!showCertificatePanel)}
                className={`certificate-button ${selectedCertificateTypes.size > 0 ? 'active' : ''}`}
                title="Генерация справок"
                disabled={selectedRows.size === 0}
              >
                <FileSignature size={18} />
                <span>Справки ({selectedRows.size})</span>
              </button>
            )}
            {canExport() && (
              <button 
                onClick={() => setShowExportPanel(!showExportPanel)}
                className="export-button"
                title="Настройки экспорта"
                disabled={selectedRows.size === 0}
              >
                <Download size={18} />
                <span>Экспорт ({selectedRows.size})</span>
              </button>
            )}
            {canCreateRow() && (
              <button 
                onClick={initCreateRow}
                className="create-row-button"
                title="Создать новую запись"
              >
               Создать
              </button>
            )}
            {canDeleteRow() && selectedRows.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="create-row-button"
                title="Удалить выбранные записи"
              >
                Удалить выбранные ({selectedRows.size})
              </button>
            )}
          </div>

          {showFilterPanel && (
            <div className="filter-panel">
              <div className="filter-panel-header">
                <h3>Комбинированные фильтры</h3>
                <div className="filter-logic">
                  <label>
                    <input
                      type="radio"
                      value="AND"
                      checked={filterLogic === 'AND'}
                      onChange={(e) => setFilterLogic(e.target.value)}
                    />
                    И (все условия)
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="OR"
                      checked={filterLogic === 'OR'}
                      onChange={(e) => setFilterLogic(e.target.value)}
                    />
                    ИЛИ (любое условие)
                  </label>
                </div>
              </div>
              
              <div className="filters-list">
                {filters.map((filter) => (
                  <div key={filter.id} className="filter-item">
                    <select
                      value={filter.column}
                      onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                      className="filter-column-select"
                    >
                      {columns.map((col, idx) => {
                        const columnNumber = idx + 1;
                        const fieldName = ColumnName[columnNumber];
                        if (!fieldName || fieldName === '') return null;
                        return (
                          <option key={col} value={col}>
                            {fieldName}
                          </option>
                        );
                      })}
                    </select>
                    
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                      className="filter-operator-select"
                    >
                      {getOperatorsByType(filter.type).map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    
                    {filter.operator === 'between' ? (
                      <input
                        type="text"
                        placeholder="значение1,значение2"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        className="filter-value-input"
                      />
                    ) : (
                      <input
                        type={filter.type === 'date' ? 'date' : 'text'}
                        placeholder="Значение фильтра"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        className="filter-value-input"
                      />
                    )}
                    
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="remove-filter-button"
                      title="Удалить фильтр"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="filter-actions">
                <button onClick={addFilter} className="add-filter-button">
                  + Добавить фильтр
                </button>
                {filters.length > 0 && (
                  <button onClick={() => setFilters([])} className="clear-filters-button">
                    Очистить все
                  </button>
                )}
              </div>
            </div>
          )}

          {showColumnsPanel && (
            <div className="columns-panel">
              <div className="columns-panel-header">
                <h3>Выбор колонок для отображения</h3>
                <div className="columns-actions">
                  <button onClick={handleShowAllColumns} className="show-all-columns-button">
                    Показать все
                  </button>
                  <button onClick={handleHideAllColumns} className="hide-all-columns-button">
                    Скрыть все
                  </button>
                </div>
              </div>
              <div className="columns-grid">
                {ColumnName.slice(1).map((name, index) => {
                  const columnNumber = index + 1;
                  if (!name || name === '') return null;
                  return (
                    <label key={columnNumber} className={`column-checkbox-label ${visibleColumns.has(columnNumber) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(columnNumber)}
                        onChange={() => handleToggleColumn(columnNumber)}
                        className="column-checkbox"
                      />
                      <span className="column-name">{name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {showCertificatePanel && (
            <div className="certificate-panel">
              <div className="certificate-panel-header">
                <h3>Выберите типы справок</h3>
              </div>
              
              <div className="certificate-types">
                {CERTIFICATE_TYPES.map(type => (
                  <label key={type.id} className="certificate-type-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCertificateTypes.has(type.id)}
                      onChange={() => handleCertificateTypeChange(type.id)}
                      disabled={generatingCertificates}
                    />
                    <span className="certificate-type-name">{type.name}</span>
                  </label>
                ))}
              </div>
              
              <div className="certificate-actions">
                <button 
                  onClick={handleGenerateCertificates}
                  className="export-confirm-button"
                  disabled={selectedCertificateTypes.size === 0 || generatingCertificates}
                >
                  {generatingCertificates ? 'Генерация...' : 'Сгенерировать справки'}
                </button>
                <button 
                  onClick={() => {
                    setShowCertificatePanel(false);
                    setSelectedCertificateTypes(new Set());
                  }}
                  className="certificate-cancel-button"
                  disabled={generatingCertificates}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {showExportPanel && (
            <>
              <div className="column-selector-panel">
                <div className="column-selector-header">
                  <h3>Выбор колонок для экспорта</h3>
                  <button 
                    onClick={handleSelectAllColumns}
                    className="select-all-columns-button"
                  >
                    {selectedColumns.size === 40 ? 'Снять все' : 'Выбрать все'}
                  </button>
                </div>
                <div className="column-selector-grid">
                  {ColumnName.slice(1).map((name, index) => {
                    const colNum = index + 1;
                    if (!name || name === '') return null;
                    return (
                      <label key={colNum} className="column-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedColumns.has(colNum)}
                          onChange={() => handleSelectColumn(colNum)}
                          className="column-checkbox"
                        />
                        <span className="column-name">{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="export-panel">
                <div className="export-panel-header">
                  <h3>Настройки экспорта</h3>
                </div>
                <div className="export-formats">
                  <label className="format-checkbox">
                    <input
                      type="checkbox"
                      checked={exportFormats.excel}
                      onChange={() => handleFormatChange('excel')}
                    />
                    <FileSpreadsheet size={18} />
                    <span>Excel (.xlsx)</span>
                  </label>
                  <label className="format-checkbox">
                    <input
                      type="checkbox"
                      checked={exportFormats.word}
                      onChange={() => handleFormatChange('word')}
                    />
                    <FileText size={18} />
                    <span>Word (.doc)</span>
                  </label>
                </div>
                <div className="export-actions">
                  <button 
                    onClick={handleExport}
                    className="export-confirm-button"
                    disabled={!exportFormats.excel && !exportFormats.word}
                  >
                    Выполнить экспорт
                  </button>
                  <button 
                    onClick={() => setShowExportPanel(false)}
                    className="export-cancel-button"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </>
          )}
          
          <div className="selection-info">
            {selectedRows.size > 0 && (
              <p className="selected-count-table">
                Выбрано записей: {selectedRows.size} 
                {selectAll && sortedFilteredData.length > 0 && ` (все из текущего фильтра)`}
              </p>
            )}
            {filters.length > 0 && (
              <p className="filter-info">
                Активных фильтров: {filters.length} (логика: {filterLogic === 'AND' ? 'И' : 'ИЛИ'})
              </p>
            )}
            {visibleColumns.size <40 && (
              <p className="columns-info">
                Отображается колонок: {visibleColumns.size} из 40
              </p>
            )}
            {showExportPanel && selectedColumns.size >= 0 && selectedColumns.size <= 40 && (
              <p className="selected-columns-info">
                Выбрано колонок для экспорта: {selectedColumns.size} из 40
              </p>
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
                <th className="id-checkbox-header sticky-top-left">
                  <div className="id-checkbox-container">
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="select-all-checkbox"
                        title="Выбрать все из текущего фильтра"
                      />
                    </div>
                  </div>
                </th>
                {columns.map((col, index) => {
                  const columnNumber = index + 1;
                  const fieldName = ColumnName[columnNumber];
                  if (!fieldName || fieldName === '') return null;
                  if (!visibleColumns.has(columnNumber)) return null;
                  
                  return (
                    <th 
                      key={col} 
                      className="column-header sticky-top sortable-header"
                      onClick={() => handleSort(col)}
                      title={`Сортировать по ${ColumnName[columnNumber]}`}
                    >
                      <div className="header-content">
                        <span className="header-text">{ColumnName[columnNumber]}</span>
                        <span className="sort-icon">
                          {getSortIcon(col)}
                        </span>
                      </div>
                    </th>
                  );
                })}
                {/*<th className="action-header sticky-top-right">Действия</th>*/}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.size + 1} className="no-data">{/* тут было + 2*/}
                    {data.length === 0 ? 'Нет данных. Создайте первую запись.' : 'Нет результатов по вашему запросу.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => {
                  const originalIndex = data.indexOf(row);
                  const isEditAllowed = canEditRow();
                  const isDeleteAllowed = canDeleteRow();
                  
                  return (
                    <tr key={`row-${row.id}`} className="table-row">
                      <td className="id-checkbox-cell sticky-left">
                        <div className="id-checkbox-container">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.id)}
                              onChange={() => handleSelectRow(row.id)}
                              className="row-checkbox"
                            />
                          </div>
                        </div>
                      </td>
                      {columns.map((column) => {
                        const columnNumber = parseInt(column.replace('column', ''));
                        const fieldName = ColumnName[columnNumber];
                        if (!fieldName || fieldName === '') return null;
                        if (!visibleColumns.has(columnNumber)) return null;
                        
                        let cellValue = row[column] || '';
                        const isEditing = editingCell.rowId === row.id && editingCell.column === column;
                        
                        if (column === 'column16') {
                          cellValue = formatPreparationForm(cellValue);
                        }

                        if (isEditing && !['column9', 'column32'].includes(column)) {
                          return (
                            <InlineCellEditor
                              key={`cell-${row.id}-${column}`}
                              editingCell={editingCell}
                              editValue={editValue}
                              setEditValue={setEditValue}
                              onSave={handleCellSave}
                              onCancel={handleCellCancel}
                            />
                          );
                        }

                        if (column === 'column9') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <NestedSocialLeaveRenderer rowId={row.id} value={row[column]} />
                             </td>
                          );
                        }

                        if (column === 'column33') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <NestedSupervisorsRenderer rowId={row.id} value={row[column]} />
                            </td>
                          );
                        }

                        if (column === 'column27') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <ExtensionsRenderer rowId={row.id} value={row[column]} />
                            </td>
                          );
                        }

                        if (column === 'column36') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <AllowanceRenderer rowId={row.id} value={row[column]} />
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={`cell-${row.id}-${column}`}
                            onDoubleClick={() => handleCellDoubleClick(row.id, column, cellValue, rowIndex)}
                            className={isEditAllowed ? 'editable-cell' : ''}
                          >
                            <span className="cell-value" title={cellValue}>
                              {searchTerm && String(cellValue || '').toLowerCase().includes(searchTerm.toLowerCase()) && 
                               (searchColumn === 'all' || searchColumn === column) ? (
                                <mark>{cellValue}</mark>
                              ) : (
                                cellValue
                              )}
                            </span>
                           </td>
                        );
                      })}
                      {/*<td className="action-cell sticky-right">
                        {userData?.role === 'supervisor' ? (
                          <button 
                            onClick={() => handleRowClick(originalIndex, row, 'view')}
                            className="view-row-button"
                            title="Просмотреть запись"
                          >
                            👁️ Просмотр
                          </button>
                        ) : (
                          <>
                            {isEditAllowed && (
                              <button 
                                onClick={() => handleRowClick(originalIndex, row, 'edit')}
                                className="edit-row-button"
                                title="Редактировать эту строку"
                              >
                                ✏️ Редактировать
                              </button>
                            )}
                            {isDeleteAllowed && (
                              <button 
                                onClick={() => handleDeleteRow(originalIndex, row)}
                                className="delete-row-button"
                                title="Удалить эту строку"
                              >
                                🗑️ Удалить
                              </button>
                            )}
                            {!isEditAllowed && !isDeleteAllowed && userData?.role !== 'supervisor' && (
                              <div className="no-actions">Только просмотр</div>
                            )}
                          </>
                        )}
                        </td>*/}
                      </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <PaginationComponent />
        
        <div className="pagination-info">
          Показано {paginatedData.length} из {sortedFilteredData.length} записей (стр. {currentPage} из {totalPages})
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
                  : `Редактирование ординатора ID: ${modalState.selectedRow?.id || modalState.selectedRow?.index + 1}`}
              </h2>
              <button onClick={handleCancel} className="close-button">&times;</button>
            </div>
            
            <div className="modal-content">
              <div className="row-editor">
                <div className="columns-editor">
                {columns.map((column, index) => {
                  const columnNumber = parseInt(column.replace('column', ''));
                  const fieldName = ColumnName[columnNumber];
                  
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
                    onClick={handleSave} 
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
      )}
      <button 
        className="floating-help-button"
        onClick={goToInstruction}
        title="Открыть инструкцию"
      >
        <HelpCircle size={24} />
      </button>
    </div>
  );
};

export default EditableTable;