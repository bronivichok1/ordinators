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
  EyeOff,
  X,
  FileSignature
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CERTIFICATE_TYPES, generateMultipleCertificates } from './utils/certificateGenerator';

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
    columnNumber: null
  });
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState({});

  const [serverOptions, setServerOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

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

  useEffect(() => {
    const allColumns = new Set();
    for (let i = 1; i <= 41; i++) {
      allColumns.add(i);
    }
    setSelectedColumns(allColumns);
    setVisibleColumns(allColumns);
  }, []);

  const [selectOptions, setSelectOptions] = useState({
    gender: [],
    dismissalReason: [],
    socialLeave: [],
    university: [],
    preparationForm: [],
    identityDocument: [],
    residence: [],
    medicalCertificate: [],
    rivshCertificate: [],
    entryByInvitation: [],
    country: []
  });

  const [selectData, setSelectData] = useState({
    departments: [],
    specialtyProfiles: [],
    countries: [],
    gender: [],
    dismissalReason: [],
    socialLeave: [],
    university: [],
    preparationForm: [],
    identityDocument: [],
    residence: [],
    medicalCertificate: [],
    rivshCertificate: [],
    entryByInvitation: []
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
    selectedPreparationForm: ['очная']
  });
  
  const [newRowData, setNewRowData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });

  const getFieldType = (columnNumber) => {
    const fieldName = ColumnName[columnNumber];
    
    switch(fieldName) {
      case 'Пол':
        return 'creatable-gender';
      case 'Страна':
        return 'creatable-country';
      case 'Кафедра':
        return 'creatable-department';
      case 'Профиль специальности':
        return 'creatable-specialty';
      case 'Причина отчисления':
        return 'creatable-dismissal';
      case 'Социальный отпуск':
        return 'creatable-social';
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
      case 'Год рождения':
      case 'Дата зачисления':
      case 'Дата отчисления':
      case 'Дата начала социального отпуска':
      case 'Дата окончания социального отпуска':
      case 'Дата приказа о зачислении':
      case 'Дата приказа об отчислении':
      case 'Срок окончания регистрации':
      case 'Дата установки надбавки':
      case 'Дата окончания надбавки':
      case 'Дата начала сессии(циклов)':
      case 'Дата окончания сессии(циклов)':
        return 'date';
      case 'Мобильный телефон':
        return 'tel';
      case 'Пароль':
        return 'password';
      case 'Текущий контроль':
      case 'Распределение клинических ординаторов':
      case 'Адрес проживания':
        return 'textarea';
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
        const columnValue = row[filter.column] || '';
        let filterValue = filter.value;
        
        let processedValue = columnValue;
        if (filter.column === 'column18') {
          processedValue = formatPreparationForm(columnValue);
        }
        
        const processedValueStr = String(processedValue || '').toLowerCase();
        const filterValueStr = String(filterValue || '').toLowerCase();

        switch (filter.operator) {
          case 'contains':
            return processedValueStr.includes(filterValueStr);
          case 'notContains':
            return !processedValueStr.includes(filterValueStr);
          case 'equals':
            return processedValueStr === filterValueStr;
          case 'notEquals':
            return processedValueStr !== filterValueStr;
          case 'startsWith':
            return processedValueStr.startsWith(filterValueStr);
          case 'endsWith':
            return processedValueStr.endsWith(filterValueStr);
          case 'greaterThan':
            return processedValueStr > filterValueStr;
          case 'lessThan':
            return processedValueStr < filterValueStr;
          case 'between':
            const [val1, val2] = filterValue.split(',').map(v => v.trim());
            return processedValueStr >= val1 && processedValueStr <= val2;
          default:
            return true;
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
        socialLeave: data.socialLeave || [],
        university: data.university || [],
        preparationForm: preparationForm,
        identityDocument: data.identityDocument || [],
        residence: data.residence || [],
        medicalCertificate: data.medicalCertificate || [],
        rivshCertificate: data.rivshCertificate || [],
        entryByInvitation: data.entryByInvitation || [],
        country: data.country || []
      });

      setSelectData({
        departments: data.departments || [],
        specialtyProfiles: data.specialtyProfiles || [],
        countries: data.country || [],
        gender: data.gender || ['М', 'Ж'],
        dismissalReason: data.dismissalReason || [],
        socialLeave: data.socialLeave || [],
        university: data.university || [],
        preparationForm: preparationForm,
        identityDocument: data.identityDocument || [],
        residence: data.residence || [],
        medicalCertificate: data.medicalCertificate || [],
        rivshCertificate: data.rivshCertificate || [],
        entryByInvitation: data.entryByInvitation || []
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
    try {
      if (Array.isArray(formData)) {
        return formData.join(', ');
      }
      const parsed = JSON.parse(formData);
      return Array.isArray(parsed) ? parsed.join(', ') : String(formData);
    } catch {
      return String(formData);
    }
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
      const { successCount, errorCount } = await generateMultipleCertificates(selectedData, selectedCertificateTypes, userData);
      
      if (errorCount > 0) {
        alert(`Справки сгенерированы: ${successCount} успешно, ${errorCount} с ошибками`);
      } else {
        alert(`Справки успешно сгенерированы для ${successCount} записей`);
      }
      
      setShowCertificatePanel(false);
      setSelectedCertificateTypes(new Set());
    } catch (error) {
      console.error('Ошибка генерации справок:', error);
      alert('Ошибка при генерации справок');
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
    setSelectAll(newSelected.size === filteredData.length && filteredData.length > 0);
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
    if (selectedColumns.size === 41) {
      setSelectedColumns(new Set());
    } else {
      const allColumns = new Set();
      for (let i = 1; i <= 41; i++) {
        allColumns.add(i);
      }
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
    for (let i = 1; i <= 41; i++) {
      allColumns.add(i);
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
          if (colIndex === 18) {
            value = formatPreparationForm(value);
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
          <table>
            <thead>
              <tr>
      `;
      
      const headers = Object.keys(exportData[0]);
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      
      html += `
              </tr>
            </thead>
            <tbody>
      `;
      
      exportData.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
      });
      
      html += `
            </tbody>
          </table>
        </body>
        </html>
      `;
      
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
      row.column3 = ordinator.birthYear || '';
      row.column4 = ordinator.gender || 'М';
      row.column5 = ordinator.country || '';
      row.column6 = ordinator.enrollmentDate || '';
      row.column7 = ordinator.dismissalDate || '';
      row.column8 = ordinator.dismissalReason || '';
      row.column9 = ordinator.socialLeave || '';
      row.column10 = ordinator.socialLeaveStart || '';
      row.column11 = ordinator.socialLeaveEnd || '';
      row.column12 = ordinator.mobilePhone || '';
      if (ordinator.university) {
        row.column13 = ordinator.university.name || 'БГМУ';
        row.column14 = ordinator.university.graduationYear || '';
        row.column15 = ordinator.university.department || '';
        row.column16 = ordinator.university.specialtyProfile || '';
        row.column17 = ordinator.university.specialty || '';
        let prepForm = ordinator.university.preparationForm;
        if (prepForm && typeof prepForm === 'object') {
          prepForm = JSON.stringify(prepForm);
        } else if (!prepForm) {
          prepForm = JSON.stringify(['очная']);
        }
        row.column18 = prepForm;
      } else {
        row.column13 = 'БГМУ';
        row.column14 = '';
        row.column15 = '';
        row.column16 = '';
        row.column17 = '';
        row.column18 = JSON.stringify(['очная']);
      }
      row.column19 = ordinator.identityDocument || 'паспорт';
      row.column20 = ordinator.documentNumber || '';
      row.column21 = '';
      row.column22 = ordinator.residenceAddress || 'общежитие';
      row.column23 = ordinator.livingAddress || ''; 
      row.column24 = ordinator.registrationExpiry || '';
      row.column25 = ordinator.enrollmentOrderNumber || '';
      row.column26 = ordinator.enrollmentOrderDate || '';
      row.column27 = ordinator.dismissalOrderNumber || '';
      row.column28 = ordinator.dismissalOrderDate || '';
      row.column29 = ordinator.contractInfo || '';
      row.column30 = ordinator.medicalCertificate || 'есть';
      if (ordinator.currentControl) {
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
      if (ordinator.session) {
        row.column35 = ordinator.session.sessionStart || '';
        row.column36 = ordinator.session.sessionEnd || '';
      } else {
        row.column35 = '';
        row.column36 = '';
      }
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

  let preparationFormValue = tableData.column18 || '';
  
  if (typeof preparationFormValue === 'string') {
    try {
      const parsed = JSON.parse(preparationFormValue);
      if (Array.isArray(parsed)) {
        preparationFormValue = JSON.stringify(parsed);
      }
    } catch {
      if (preparationFormValue.includes(',')) {
        const options = preparationFormValue.split(',').map(s => s.trim());
        preparationFormValue = JSON.stringify(options);
      } else {
        preparationFormValue = JSON.stringify([preparationFormValue]);
      }
    }
  } else if (Array.isArray(preparationFormValue)) {
    preparationFormValue = JSON.stringify(preparationFormValue);
  }

    const apiData = {
      fio: tableData.column1 || '',
      fioEn: tableData.column2 || '',
      birthYear: tableData.column3 || null,
      gender: tableData.column4 || 'М',
      country: tableData.column5 || 'Беларусь',
      enrollmentDate: tableData.column6 || null,
      dismissalDate: tableData.column7 || null,
      dismissalReason: tableData.column8 === 'иное' ? modalState.otherDismissalReason : tableData.column8 || '',
      socialLeave: tableData.column9 || '',
      socialLeaveStart: tableData.column10 || null,
      socialLeaveEnd: tableData.column11 || null,
      mobilePhone: tableData.column12 || '',
      universityName: tableData.column13 === 'другое' ? modalState.otherUniversity : tableData.column13 || 'БГМУ',
      graduationYear: tableData.column14 ? parseInt(tableData.column14) : null,
      department: tableData.column15 || '',
      specialtyProfile: tableData.column16 || '',
      specialty: tableData.column17 || '',
      preparationForm: preparationFormValue,
      identityDocument: tableData.column19 === 'иное' ? modalState.otherDocument : tableData.column19 || 'паспорт',
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

  const handleCellDoubleClick = (rowId, column, currentValue, rowIndex) => {
    if (!canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }

    const columnNumber = parseInt(column.replace('column', ''));
    const fieldType = getFieldType(columnNumber);
    
    let displayValue = currentValue;
    if (column === 'column18') {
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
    
      if (fieldType === 'date' && valueToSave) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(valueToSave)) {
          const [year, month, day] = valueToSave.split('-');
          valueToSave = `${day}.${month}.${year}`;
        }
      }
  

      const updatedRow = { ...data[rowIndex] };
      updatedRow[column] = editValue;
      
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

      setEditingCell({ rowId: null, column: null, value: '', rowIndex: null, fieldType: null, columnNumber: null });

    } catch (error) {
      console.error('Error saving cell:', error);
      alert('Ошибка при сохранении изменений');
    }
  };

  const handleCellCancel = () => {
    setEditingCell({ rowId: null, column: null, value: '', rowIndex: null, fieldType: null, columnNumber: null });
    setEditValue('');
  };

  const InlineCellEditor = ({ editingCell, editValue, setEditValue, onSave, onCancel }) => {
    const { fieldType, columnNumber } = editingCell;
    const fieldName = ColumnName[columnNumber];
    
    const [otherValue, setOtherValue] = useState('');
    const [selectedOptions, setSelectedOptions] = useState(() => {
      if (columnNumber === 18 && editValue) {
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

    useEffect(() => {
      if (selectRef.current) {
        selectRef.current.focus();
      }
    }, []);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    const getOptions = () => {
      switch(fieldType) {
        case 'creatable-gender':
          return selectData.gender.map(option => ({ value: option, label: option }));
        case 'creatable-country':
          return selectData.countries.map(option => ({ value: option, label: option }));
        case 'creatable-department':
          return selectData.departments.map(option => ({ value: option, label: option }));
        case 'creatable-specialty':
          return selectData.specialtyProfiles.map(option => ({ value: option, label: option }));
        case 'creatable-dismissal':
          return selectData.dismissalReason.map(option => ({ value: option, label: option }));
        case 'creatable-social':
          return selectData.socialLeave.map(option => ({ value: option, label: option }));
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
        case 'creatable-specialty': return 'specialtyProfiles';
        case 'creatable-dismissal': return 'dismissalReason';
        case 'creatable-social': return 'socialLeave';
        case 'creatable-university': return 'university';
        case 'creatable-preparation': return 'preparationForm';
        case 'creatable-document': return 'identityDocument';
        case 'creatable-residence': return 'residence';
        case 'creatable-medical': return 'medicalCertificate';
        case 'creatable-rivsh': return 'rivshCertificate';
        case 'creatable-entry': return 'entryByInvitation';
        default: return null;
      }
    };

    const renderEditor = () => {

      if (columnNumber === 18) {
        return (
          <div className="inline-checkbox-group">
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
                    // Сохраняем как JSON массив
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
          <div className="inline-creatable-wrapper">
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
          const handleDateChange = (e) => {
            const value = e.target.value;
            setEditValue(value);
          };
        
          const handleDateBlur = () => {
          };
        
          const displayDate = (() => {
            if (!editValue) return '';
            
            if (/^\d{4}-\d{2}-\d{2}$/.test(editValue)) {
              return editValue;
            }
            
            const ddmmyyyy = editValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (ddmmyyyy) {
              return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
            }
            
            return editValue;
          })();
        
          return (
            <input
              ref={selectRef}
              type="input"
              value={displayDate}
              onChange={handleDateChange}
              onBlur={handleDateBlur}
              onKeyDown={handleKeyDown}
              className="inline-input"
            />
          );

        case 'tel':
          return (
            <input
              ref={selectRef}
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
              ref={selectRef}
              type="password"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="inline-input"
              placeholder="Введите пароль"
            />
          );

        case 'textarea':
          return (
            <textarea
              ref={selectRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="inline-textarea"
              rows="3"
            />
          );

        case 'checkbox-group':
          return (
            <div className="inline-checkbox-group">
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

        default:
          return (
            <input
              ref={selectRef}
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
          <div className="inline-editor-actions">
            <button 
              onClick={onSave}
              className="inline-save-button"
              title="Сохранить"
            >
              ✓ Сохранить
            </button>
            <button 
              onClick={onCancel}
              className="inline-cancel-button"
              title="Отмена"
            >
              ✗ Отмена
            </button>
          </div>
        </div>
      </td>
    );
  };

  const initCreateRow = () => {
    if (!canCreateRow()) {
      alert('У вас нет прав для создания новой записи');
      return;
    }
    const initialRowData = {};
    for (let i = 1; i <= 41; i++) {
      const columnKey = `column${i}`;
      const fieldName = ColumnName[i];
      switch(fieldName) {
        case 'Пол':
          initialRowData[columnKey] = selectOptions.gender[0] || 'М';
          break;
        case 'Причина отчисления':
          initialRowData[columnKey] = selectOptions.dismissalReason[0] || '';
          break;
        case 'Социальный отпуск':
          initialRowData[columnKey] = '';
          break;
        case 'ВУЗ':
          initialRowData[columnKey] = selectOptions.university[0] || 'БГМУ';
          break;
        case 'Форма подготовки':
          initialRowData[columnKey] = JSON.stringify(modalState.selectedPreparationForm);
          break;
        case 'Документ, удостоверяющий личность':
          initialRowData[columnKey] = selectOptions.identityDocument[0] || 'паспорт';
          break;
        case 'Место проживания, регистрации':
          initialRowData[columnKey] = selectOptions.residence[0] || 'общежитие';
          break;
        case 'Медицинская справка':
          initialRowData[columnKey] = selectOptions.medicalCertificate[0] || 'есть';
          break;
        case 'Наличие сертификата РИВШ':
          initialRowData[columnKey] = selectOptions.rivshCertificate[0] || 'нет';
          break;
        case 'Въезд по приглашению':
          initialRowData[columnKey] = selectOptions.entryByInvitation[0] || 'нет';
          break;
        case 'Страна':
          initialRowData[columnKey] = selectOptions.country[0] || 'Беларусь';
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
      selectedPreparationForm: selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['очная']
    });
  };

  const handleRowClick = async (rowIndex, row, mode = 'edit') => {
    if (mode === 'edit' && !canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }
    
    try {
      const response = await apiRequest(`/ordinators/${row.id}`);
      const ordinator = response;
      const rowValues = [];
      for (let i = 1; i <= 41; i++) {
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
      let prepForm = selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['очная'];
      
      if (row['column13'] && !selectOptions.university.includes(row['column13'])) {
        otherUni = row['column13'];
      }
      if (row['column19'] && !selectOptions.identityDocument.includes(row['column19'])) {
        otherDoc = row['column19'];
      }
      if (row['column8'] && !selectOptions.dismissalReason.includes(row['column8'])) {
        otherDismissal = row['column8'];
      }
      
      try {
        if (row['column18']) {
          const parsed = JSON.parse(row['column18']);
          prepForm = Array.isArray(parsed) ? parsed : (selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['очная']);
        }
      } catch (e) {
        console.error('Ошибка парсинга данных:', e);
        prepForm = selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['очная'];
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

    if (value && typeof value === 'object' && value.__isNew__) {
      const columnNumber = parseInt(column.replace('column', ''));
      const fieldName = ColumnName[columnNumber];
      
      let optionField = '';
      if (fieldName === 'Страна') optionField = 'country';
      else if (fieldName === 'Кафедра') optionField = 'departments';
      else if (fieldName === 'Профиль специальности') optionField = 'specialtyProfiles';
      else if (fieldName === 'Пол') optionField = 'gender';
      else if (fieldName === 'Причина отчисления') optionField = 'dismissalReason';
      else if (fieldName === 'Социальный отпуск') optionField = 'socialLeave';
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
      selectedPreparationForm: selectOptions.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['очная']
    });
    setNewRowData({});
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
    setFilters([]); 
    setFilterLogic('AND');
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
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'column18') {
        aValue = formatPreparationForm(aValue);
        bValue = formatPreparationForm(bValue);
      }
      
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
      if (searchColumn === 'all') {
        return Object.entries(row).some(([key, value]) => {
          if (key !== 'id' && key !== 'originalData') {
            let displayValue = value;
            if (key === 'column18') {
              displayValue = formatPreparationForm(value);
            }
            return String(displayValue || '').toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });
      } else {
        let displayValue = row[searchColumn];
        if (searchColumn === 'column18') {
          displayValue = formatPreparationForm(displayValue);
        }
        return String(displayValue || '').toLowerCase().includes(searchTerm.toLowerCase());
      }
    })
  );

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
    let value = isEditMode ? currentValue : (newRowData[columnKey] || '');
    
    if (columnNumber === 18 && !isEditMode && modalState.mode === 'create') {
      value = JSON.stringify(modalState.selectedPreparationForm);
    }
    
    const isReadOnly = modalState.mode === 'view' || 
      userData?.role === 'supervisor' || 
      (userData?.role === 'passportist' && ![23, 24].includes(columnNumber));

    const handleChange = (newValue) => {
      if (isReadOnly) return;
      handleModalChange(columnKey, newValue);
    };

    if (isReadOnly) {
      let displayValue = value;
      if (columnNumber === 18) {
        displayValue = formatPreparationForm(value);
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
        case 'Профиль специальности':
          return selectData.specialtyProfiles.map(option => ({ value: option, label: option }));
        case 'Причина отчисления':
          return selectData.dismissalReason.map(option => ({ value: option, label: option }));
        case 'Социальный отпуск':
          return selectData.socialLeave.map(option => ({ value: option, label: option }));
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
      'Пол', 'Страна', 'Кафедра', 'Профиль специальности', 'Причина отчисления',
      'Социальный отпуск', 'ВУЗ', 'Документ, удостоверяющий личность',
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
          placeholder={``}
          isClearable
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
      case 'Год рождения':
      case 'Дата зачисления':
      case 'Дата отчисления':
      case 'Дата начала социального отпуска':
      case 'Дата окончания социального отпуска':
      case 'Дата приказа о зачислении':
      case 'Дата приказа об отчислении':
      case 'Срок окончания регистрации':
      case 'Дата установки надбавки':
      case 'Дата окончания надбавки':
      case 'Дата начала сессии(циклов)':
      case 'Дата окончания сессии(циклов)':
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
      case 'Распределение клинических ординаторов':
      case 'Адрес проживания':
        return (
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="modal-input"
            rows="3"
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

  const columns = Array.from({ length: 41 }, (_, i) => `column${i + 1}`);

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
                      <Shield size={16} />
                      <span>Панель администратора</span>
                    </div>
                  )}
                  <div className="menu-item" onClick={fetchOrdinators}>
                    <span>🔄 Обновить данные</span>
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
              className={`columns-button ${visibleColumns.size < 41 ? 'active' : ''}`}
              title="Выбор колонок для отображения"
            >
              <Eye size={18} />
              <span>Колонки</span>
            </button>

            <button 
              onClick={() => setShowCertificatePanel(!showCertificatePanel)}
              className={`certificate-button ${selectedCertificateTypes.size > 0 ? 'active' : ''}`}
              title="Генерация справок"
              disabled={selectedRows.size === 0}
            >
              <FileSignature size={18} />
              <span>Справки ({selectedRows.size})</span>
            </button>
            <button 
              onClick={() => setShowExportPanel(!showExportPanel)}
              className="export-button"
              title="Настройки экспорта"
              disabled={selectedRows.size === 0}
            >
              <Download size={18} />
              <span>Экспорт ({selectedRows.size})</span>
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
                {filters.map((filter, index) => (
                  <div key={filter.id} className="filter-item">
                    <select
                      value={filter.column}
                      onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                      className="filter-column-select"
                    >
                      {columns.map((col, idx) => (
                        <option key={col} value={col}>
                          {ColumnName[idx + 1]}
                        </option>
                      ))}
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
                {ColumnName.slice(1).map((name, index) => (
                  <label key={index + 1} className={`column-checkbox-label ${visibleColumns.has(index + 1) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(index + 1)}
                      onChange={() => handleToggleColumn(index + 1)}
                      className="column-checkbox"
                    />
                    <span className="column-name">{name}</span>
                  </label>
                ))}
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
                    <span>{type.name}</span>
                  </label>
                ))}
              </div>
              
              <div className="certificate-actions">
                <button 
                  onClick={handleGenerateCertificates}
                  className="generate-certificate-button"
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
                    {selectedColumns.size === 41 ? 'Снять все' : 'Выбрать все'}
                  </button>
                </div>
                <div className="column-selector-grid">
                  {ColumnName.slice(1).map((name, index) => (
                    <label key={index + 1} className="column-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(index + 1)}
                        onChange={() => handleSelectColumn(index + 1)}
                        className="column-checkbox"
                      />
                      <span className="column-name">{name}</span>
                    </label>
                  ))}
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
              <p className="selected-count">
                Выбрано записей: {selectedRows.size} 
                {selectAll && filteredData.length > 0 && ` (все из текущего фильтра)`}
              </p>
            )}
            {filters.length > 0 && (
              <p className="filter-info">
                Активных фильтров: {filters.length} (логика: {filterLogic === 'AND' ? 'И' : 'ИЛИ'})
              </p>
            )}
            {visibleColumns.size < 41 && (
              <p className="columns-info">
                Отображается колонок: {visibleColumns.size} из 41
              </p>
            )}
            {showCertificatePanel && selectedCertificateTypes.size > 0 && (
              <p className="certificate-info">
                Выбрано типов справок: {selectedCertificateTypes.size}
              </p>
            )}
            {showExportPanel && selectedColumns.size >= 0 && selectedColumns.size <= 41 && (
              <p className="selected-columns-info">
                Выбрано колонок для экспорта: {selectedColumns.size} из 41
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
                <th className="action-header sticky-top-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.size + 2} className="no-data">
                    {data.length === 0 ? 'Нет данных. Создайте первую запись.' : 'Нет результатов по вашему запросу.'}
                  </td>
                </tr>
              ) : (
                sortedFilteredData.map((row, rowIndex) => {
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
                        if (!visibleColumns.has(columnNumber)) return null;
                        
                        let cellValue = row[column] || '';
                        const isEditing = editingCell.rowId === row.id && editingCell.column === column;
                        
                        if (column === 'column18') {
                          cellValue = formatPreparationForm(cellValue);
                        }

                        if (isEditing) {
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
                      <td className="action-cell sticky-right">
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
                  : modalState.mode === 'view'
                    ? `Просмотр ординатора ID: ${modalState.selectedRow?.id || modalState.selectedRow?.index + 1}`
                    : `Редактирование ординатора ID: ${modalState.selectedRow?.id || modalState.selectedRow?.index + 1}`}
              </h2>
              <button onClick={handleCancel} className="close-button">&times;</button>
            </div>
            
            <div className="modal-content">
              <div className="row-editor">
                <div className="editor-info">
                  <p>
                    {modalState.mode === 'create' 
                      ? 'Заполните данные нового ординатора' 
                      : modalState.mode === 'view'
                        ? 'Просмотр данных ординатора'
                        : 'Редактирование данных ординатора'}
                  </p>
                </div>
                
                <div className="columns-editor">
                  {columns.map((column, index) => {
                    const columnNumber = parseInt(column.replace('column', ''));
                    const fieldName = ColumnName[columnNumber];
                    const currentValue = modalState.mode === 'edit' || modalState.mode === 'view'
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
                          modalState.mode === 'edit' || modalState.mode === 'view', 
                          currentValue
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="modal-actions">
                  {modalState.mode !== 'view' && (
                    <button onClick={handleSave} className="save-button">
                      {modalState.mode === 'create' ? 'Создать ординатора' : 'Сохранить изменения'}
                    </button>
                  )}
                  <button onClick={handleCancel} className="cancel-button-modal">
                    {modalState.mode === 'view' ? 'Закрыть' : 'Отмена'}
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