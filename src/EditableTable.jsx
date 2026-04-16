import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import './EditableTable.css';
import { 
  LogOut, User, Shield, Download, FileText, FileSpreadsheet,
  Filter, Eye, X, FileSignature
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CERTIFICATE_TYPES, generateMultipleCertificates } from './utils/certificateGenerator';

const ROWS_PER_PAGE = 50;

const TableRow = React.memo(({ 
  row, columns, visibleColumns, selectedRows, editingCell, editValue,
  searchTerm, searchColumn, onSelectRow, onCellDoubleClick, onCellSave, onCellCancel,
  setEditValue, formatPreparationForm, canEdit, canDelete, onRowClick, onDeleteRow,
  userRole, isSelected, rowIndex
}) => {
  return (
    <tr className="table-row">
      <td className="id-checkbox-cell sticky-left">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectRow(row.id)}
          className="row-checkbox"
        />
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
            <td key={`cell-${row.id}-${column}`} className="editing-cell">
              <div className="inline-editor-container">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onCellSave();
                    if (e.key === 'Escape') onCellCancel();
                  }}
                  className="inline-input"
                  autoFocus
                />
                <div className="inline-editor-actions">
                  <button onClick={onCellSave} className="inline-save-button">✓</button>
                  <button onClick={onCellCancel} className="inline-cancel-button">✗</button>
                </div>
              </div>
             </td>
          );
        }

        return (
          <td 
            key={`cell-${row.id}-${column}`}
            onDoubleClick={() => canEdit && onCellDoubleClick(row.id, column, cellValue, rowIndex)}
            className={canEdit ? 'editable-cell' : ''}
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
        {userRole === 'supervisor' ? (
          <button onClick={() => onRowClick(row, 'view')} className="view-row-button">👁️ Просмотр</button>
        ) : (
          <>
            {canEdit && (
              <button onClick={() => onRowClick(row, 'edit')} className="edit-row-button">✏️ Редактировать</button>
            )}
            {canDelete && (
              <button onClick={() => onDeleteRow(row)} className="delete-row-button">🗑️ Удалить</button>
            )}
          </>
        )}
      </td>
    </tr>
  );
});

const Pagination = React.memo(({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="page-button">««</button>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="page-button">«</button>
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`page-button ${currentPage === page ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="page-button">»</button>
      <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="page-button">»»</button>
    </div>
  );
});

const EditableTable = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const all = new Set();
    for (let i = 1; i <= 41; i++) all.add(i);
    return all;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showCertificatePanel, setShowCertificatePanel] = useState(false);
  const [filters, setFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND');
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const all = new Set();
    for (let i = 1; i <= 41; i++) all.add(i);
    return all;
  });
  const [exportFormats, setExportFormats] = useState({ excel: true, word: false });
  const [selectedCertificateTypes, setSelectedCertificateTypes] = useState(new Set());
  const [generatingCertificates, setGeneratingCertificates] = useState(false);
  const [editingCell, setEditingCell] = useState({ rowId: null, column: null, value: '', rowIndex: null });
  const [editValue, setEditValue] = useState('');
  const [selectOptions, setSelectOptions] = useState({});
  const [selectData, setSelectData] = useState({});
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'create', selectedRow: null, rowData: [] });
  const [newRowData, setNewRowData] = useState({});
  
  const API_URL = process.env.REACT_APP_API_URL;
  
  const ColumnName = useMemo(() => [
    '', 'ФИО', 'ФИО(EN)', 'Год рождения', 'Пол', 'Страна', 'Дата зачисления',
    'Дата отчисления', 'Причина отчисления', 'Социальный отпуск', 'Дата начала социального отпуска',
    'Дата окончания социального отпуска', 'Мобильный телефон', 'ВУЗ', 'Год окончания',
    'Кафедра', 'Профиль специальности', 'Специальность', 'Форма подготовки',
    'Документ, удостоверяющий личность', 'Номер документа', 'Идентификационный номер',
    'Место проживания, регистрации', 'Адрес проживания', 'Срок окончания регистрации',
    'Номер приказа о зачислении', 'Дата приказа о зачислении', 'Номер приказа об отчислении',
    'Дата приказа об отчислении', 'Договор, дополнительное соглашение', 'Медицинская справка',
    'Текущий контроль', 'Логин', 'Пароль', 'Руководитель ординатора', 'Дата начала сессии(циклов)',
    'Дата окончания сессии(циклов)', 'Дата установки надбавки', 'Дата окончания надбавки',
    'Наличие сертификата РИВШ', 'Въезд по приглашению', 'Распределение клинических ординаторов',
  ], []);

  const apiRequest = useCallback(async (endpoint, method = 'GET', reqData = null) => {
    const token = localStorage.getItem('auth_token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const config = { method, headers, credentials: 'include' };
    if (reqData && ['POST', 'PATCH', 'PUT'].includes(method)) config.body = JSON.stringify(reqData);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        navigate('/');
        throw new Error('Не авторизован');
      }
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      return method === 'DELETE' ? { success: true } : await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }, [API_URL, navigate]);

  const formatPreparationForm = useCallback((formData) => {
    if (!formData) return '';
    try {
      if (Array.isArray(formData)) return formData.join(', ');
      const parsed = JSON.parse(formData);
      return Array.isArray(parsed) ? parsed.join(', ') : String(formData);
    } catch {
      return String(formData);
    }
  }, []);

  const transformApiDataToTable = useCallback((apiData) => {
    return apiData.map((ordinator) => ({
      column1: ordinator.fio || '',
      column2: ordinator.fioEn || '',
      column3: ordinator.birthYear || '',
      column4: ordinator.gender || 'М',
      column5: ordinator.country || '',
      column6: ordinator.enrollmentDate || '',
      column7: ordinator.dismissalDate || '',
      column8: ordinator.dismissalReason || '',
      column9: ordinator.socialLeave || '',
      column10: ordinator.socialLeaveStart || '',
      column11: ordinator.socialLeaveEnd || '',
      column12: ordinator.mobilePhone || '',
      column13: ordinator.university?.name || 'БГМУ',
      column14: ordinator.university?.graduationYear || '',
      column15: ordinator.university?.department || '',
      column16: ordinator.university?.specialtyProfile || '',
      column17: ordinator.university?.specialty || '',
      column18: ordinator.university?.preparationForm ? JSON.stringify(ordinator.university.preparationForm) : JSON.stringify(['очная']),
      column19: ordinator.identityDocument || 'паспорт',
      column20: ordinator.documentNumber || '',
      column21: '',
      column22: ordinator.residenceAddress || 'общежитие',
      column23: ordinator.livingAddress || '',
      column24: ordinator.registrationExpiry || '',
      column25: ordinator.enrollmentOrderNumber || '',
      column26: ordinator.enrollmentOrderDate || '',
      column27: ordinator.dismissalOrderNumber || '',
      column28: ordinator.dismissalOrderDate || '',
      column29: ordinator.contractInfo || '',
      column30: ordinator.medicalCertificate || 'есть',
      column31: ordinator.currentControl?.scores || '',
      column32: ordinator.login || '',
      column33: ordinator.password,
      column34: ordinator.supervisorId ? String(ordinator.supervisorId) : '',
      column35: ordinator.session?.sessionStart || '',
      column36: ordinator.session?.sessionEnd || '',
      column37: ordinator.money?.allowanceStartDate || '',
      column38: ordinator.money?.allowanceEndDate || '',
      column39: ordinator.rivshCertificate || 'нет',
      column40: ordinator.entryByInvitation || 'нет',
      column41: ordinator.distributionInfo || '',
      id: ordinator.id,
      originalData: ordinator
    }));
  }, []);

  const fetchOrdinators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/ordinators');
      setData(transformApiDataToTable(response));
      setCurrentPage(1);
    } catch (error) {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, transformApiDataToTable]);

  const loadServerOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      const data = await apiRequest('/options');
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
      console.error('Error loading options:', error);
    } finally {
      setOptionsLoading(false);
    }
  }, [apiRequest]);

  const applyFilters = useCallback((rows) => {
    if (filters.length === 0) return rows;
    return rows.filter(row => {
      const results = filters.map(filter => {
        const columnValue = row[filter.column] || '';
        const filterValue = filter.value;
        let processedValue = filter.column === 'column18' ? formatPreparationForm(columnValue) : String(columnValue || '').toLowerCase();
        const filterValueStr = String(filterValue || '').toLowerCase();
        
        switch (filter.operator) {
          case 'contains': return processedValue.includes(filterValueStr);
          case 'equals': return processedValue === filterValueStr;
          case 'startsWith': return processedValue.startsWith(filterValueStr);
          case 'endsWith': return processedValue.endsWith(filterValueStr);
          case 'notContains': return !processedValue.includes(filterValueStr);
          case 'notEquals': return processedValue !== filterValueStr;
          default: return true;
        }
      });
      return filterLogic === 'AND' ? results.every(r => r) : results.some(r => r);
    });
  }, [filters, filterLogic, formatPreparationForm]);

  const filteredData = useMemo(() => {
    let result = data;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row => {
        if (searchColumn === 'all') {
          return Object.entries(row).some(([key, value]) => {
            if (key !== 'id' && key !== 'originalData') {
              let displayValue = key === 'column18' ? formatPreparationForm(value) : value;
              return String(displayValue || '').toLowerCase().includes(term);
            }
            return false;
          });
        } else {
          let displayValue = searchColumn === 'column18' ? formatPreparationForm(row[searchColumn]) : row[searchColumn];
          return String(displayValue || '').toLowerCase().includes(term);
        }
      });
    }
    return applyFilters(result);
  }, [data, searchTerm, searchColumn, formatPreparationForm, applyFilters]);

  const sortedFilteredData = useMemo(() => {
    if (!sortConfig.key || !filteredData.length) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aValue = sortConfig.key === 'column18' ? formatPreparationForm(a[sortConfig.key]) : (a[sortConfig.key] || '');
      let bValue = sortConfig.key === 'column18' ? formatPreparationForm(b[sortConfig.key]) : (b[sortConfig.key] || '');
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, formatPreparationForm]);

  const totalPages = Math.ceil(sortedFilteredData.length / ROWS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedFilteredData.slice(start, start + ROWS_PER_PAGE);
  }, [sortedFilteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchColumn, filters, sortConfig]);

  const selectedRowsSet = useMemo(() => selectedRows, [selectedRows]);

  const handleSelectRow = useCallback((rowId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) newSet.delete(rowId);
      else newSet.add(rowId);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, paginatedData]);

  useEffect(() => {
    setSelectAll(paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id)));
  }, [selectedRows, paginatedData]);

  const handleCellSave = useCallback(async () => {
    if (editingCell.rowId === null) return;
    try {
      const { rowId, column } = editingCell;
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex === -1) return;

      const updatedRow = { ...data[rowIndex], [column]: editValue };
      const updatedData = [...data];
      updatedData[rowIndex] = updatedRow;
      setData(updatedData);

      const columnNum = parseInt(column.replace('column', ''));
      const fieldMapping = {
        1: 'fio', 2: 'fioEn', 3: 'birthYear', 4: 'gender', 5: 'country',
        6: 'enrollmentDate', 7: 'dismissalDate', 8: 'dismissalReason', 9: 'socialLeave',
        10: 'socialLeaveStart', 11: 'socialLeaveEnd', 12: 'mobilePhone', 13: 'universityName',
        14: 'graduationYear', 15: 'department', 16: 'specialtyProfile', 17: 'specialty',
        18: 'preparationForm', 19: 'identityDocument', 20: 'documentNumber', 21: 'identNumber',
        22: 'residenceAddress', 23: 'livingAddress', 24: 'registrationExpiry', 25: 'enrollmentOrderNumber',
        26: 'enrollmentOrderDate', 27: 'dismissalOrderNumber', 28: 'dismissalOrderDate', 29: 'contractInfo',
        30: 'medicalCertificate', 31: 'scores', 32: 'login', 33: 'password', 34: 'supervisorId',
        35: 'sessionStart', 36: 'sessionEnd', 37: 'allowanceStartDate', 38: 'allowanceEndDate',
        39: 'rivshCertificate', 40: 'entryByInvitation', 41: 'distributionInfo'
      };
      
      const apiData = {};
      if (fieldMapping[columnNum]) apiData[fieldMapping[columnNum]] = editValue;
      if (columnNum === 18) apiData.preparationForm = JSON.stringify([editValue]);
      
      await apiRequest(`/ordinators/${rowId}`, 'PATCH', apiData);
      setEditingCell({ rowId: null, column: null, value: '', rowIndex: null });
    } catch (error) {
      alert('Ошибка при сохранении');
    }
  }, [editingCell, editValue, data, apiRequest]);

  const handleSort = useCallback((columnKey) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  }, []);

  const getSortIcon = useCallback((columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  }, [sortConfig]);

  const handleResetSearch = useCallback(() => {
    setSearchTerm('');
    setSearchColumn('all');
    setFilters([]);
    setFilterLogic('AND');
    setSortConfig({ key: null, direction: 'ascending' });
  }, []);

  const addFilter = useCallback(() => {
    setFilters(prev => [...prev, { id: Date.now(), column: 'column1', operator: 'contains', value: '', type: 'text' }]);
  }, []);

  const removeFilter = useCallback((filterId) => {
    setFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  const updateFilter = useCallback((filterId, field, value) => {
    setFilters(prev => prev.map(filter => {
      if (filter.id === filterId) {
        const updated = { ...filter, [field]: value };
        if (field === 'column') {
          const fieldName = ColumnName[parseInt(value.replace('column', ''))];
          const dateFields = ['Год рождения', 'Дата зачисления', 'Дата отчисления', 'Дата начала социального отпуска', 'Дата окончания социального отпуска', 'Дата приказа о зачислении', 'Дата приказа об отчислении', 'Срок окончания регистрации', 'Дата установки надбавки', 'Дата окончания надбавки', 'Дата начала сессии(циклов)', 'Дата окончания сессии(циклов)'];
          updated.type = dateFields.includes(fieldName) ? 'date' : 'text';
          if (updated.type === 'date') updated.operator = 'equals';
          else updated.operator = 'contains';
        }
        return updated;
      }
      return filter;
    }));
  }, [ColumnName]);

  const handleExport = useCallback(async () => {
    if (selectedRows.size === 0) {
      alert('Сначала выберите записи для экспорта');
      return;
    }
    
    const exportData = Array.from(selectedRows).map(rowId => {
      const row = data.find(r => r.id === rowId);
      const exportRow = { ID: row.id };
      selectedColumns.forEach(colIndex => {
        const columnKey = `column${colIndex}`;
        let value = row[columnKey] || '';
        if (colIndex === 18) value = formatPreparationForm(value);
        exportRow[ColumnName[colIndex]] = value;
      });
      return exportRow;
    });

    if (exportFormats.excel) {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ординаторы');
      XLSX.writeFile(wb, `ординаторы_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    
    if (exportFormats.word) {
      let html = `<html><head><meta charset="UTF-8"><title>Экспорт ординаторов</title></head><body><h1>Список ординаторов</h1><table border="1">`;
      html += '<tr>' + Object.keys(exportData[0]).map(h => `<th>${h}</th>`).join('') + '</tr>';
      exportData.forEach(row => html += '<tr>' + Object.values(row).map(v => `<td>${v || ''}</td>`).join('') + '</tr>');
      html += '</table></body></html>';
      saveAs(new Blob([html], { type: 'application/msword' }), `ординаторы_${new Date().toISOString().split('T')[0]}.doc`);
    }
    
    setShowExportPanel(false);
    alert('Экспорт выполнен успешно');
  }, [selectedRows, data, selectedColumns, ColumnName, formatPreparationForm, exportFormats]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {}
    localStorage.clear();
    navigate('/');
  }, [API_URL, navigate]);

  const canEdit = userData && ['admin', 'dispatcher', 'passportist'].includes(userData.role);
  const canDelete = userData && ['admin', 'dispatcher'].includes(userData.role);
  const canCreate = userData && ['admin', 'dispatcher'].includes(userData.role);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user_data');
    if (!token || !userDataStr) { navigate('/'); return; }
    try {
      const user = JSON.parse(userDataStr);
      if (!['admin', 'dispatcher', 'passportist', 'supervisor'].includes(user.role)) { navigate('/'); return; }
      setUserData(user);
      fetchOrdinators();
      loadServerOptions();
    } catch (error) { navigate('/'); }
  }, [navigate, fetchOrdinators, loadServerOptions]);

  const columns = useMemo(() => Array.from({ length: 41 }, (_, i) => `column${i + 1}`), []);

  if (loading || optionsLoading) return <div className="table-page"><div className="loading-users">Загрузка...</div></div>;
  if (error) return <div className="table-page"><div className="error-message">{error}<button onClick={fetchOrdinators}>Повторить</button></div></div>;

  return (
    <div className="table-page">
      <header className="user-header">
        <div className="header-left">
          <div className="user-profile-button">
            <div className="user-avatar"><User size={20} /></div>
            <div className="user-details">
              <div className="user-name">{userData?.fio || userData?.login}</div>
              <div className="user-role">
                <span className={`role-badge role-${userData?.role}-table`}>
                  {userData?.role === 'admin' ? 'Администратор' : 
                   userData?.role === 'dispatcher' ? 'Диспетчер' :
                   userData?.role === 'passportist' ? 'Паспортист' :
                   userData?.role === 'supervisor' ? 'Руководитель' : 'Пользователь'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-center">
          <div className="app-title">
            <h1>Система управления ординаторами</h1>
            <p className="data-info">Всего: {data.length} | Отфильтровано: {sortedFilteredData.length}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-actions">
            {(userData?.role === 'admin' || userData?.role === 'dispatcher') && (
              <button className="admin-panel-button" onClick={() => navigate('/')}>
                <Shield size={18} /><span>Админ-панель</span>
              </button>
            )}
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} /><span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <div className="table-container">
        <div className="search-panel">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={searchColumn} onChange={(e) => setSearchColumn(e.target.value)} className="column-select">
              <option value="all">Все колонки</option>
              {columns.map((col, idx) => <option key={col} value={col}>{ColumnName[idx + 1]}</option>)}
            </select>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`filter-button ${filters.length > 0 ? 'active' : ''}`}>
              <Filter size={18} /><span>Фильтры ({filters.length})</span>
            </button>
            <button onClick={handleResetSearch} className="reset-search-button">Сброс</button>
            <button onClick={() => setShowColumnsPanel(!showColumnsPanel)} className="columns-button">
              <Eye size={18} /><span>Колонки</span>
            </button>
            <button onClick={() => setShowExportPanel(!showExportPanel)} className="export-button" disabled={selectedRows.size === 0}>
              <Download size={18} /><span>Экспорт ({selectedRows.size})</span>
            </button>
            {canCreate && (
              <button onClick={() => setModalState({ isOpen: true, mode: 'create', selectedRow: null, rowData: [] })} className="create-row-button">
                📋 Создать
              </button>
            )}
          </div>

          {showFilterPanel && (
            <div className="filter-panel">
              <div className="filter-panel-header">
                <h3>Фильтры</h3>
                <div className="filter-logic">
                  <label><input type="radio" value="AND" checked={filterLogic === 'AND'} onChange={(e) => setFilterLogic(e.target.value)} /> И</label>
                  <label><input type="radio" value="OR" checked={filterLogic === 'OR'} onChange={(e) => setFilterLogic(e.target.value)} /> ИЛИ</label>
                </div>
              </div>
              <div className="filters-list">
                {filters.map(filter => (
                  <div key={filter.id} className="filter-item">
                    <select value={filter.column} onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}>
                      {columns.map((col, idx) => <option key={col} value={col}>{ColumnName[idx + 1]}</option>)}
                    </select>
                    <select value={filter.operator} onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}>
                      <option value="contains">Содержит</option>
                      <option value="equals">Равно</option>
                      <option value="startsWith">Начинается с</option>
                      <option value="endsWith">Заканчивается на</option>
                    </select>
                    <input type="text" placeholder="Значение" value={filter.value} onChange={(e) => updateFilter(filter.id, 'value', e.target.value)} />
                    <button onClick={() => removeFilter(filter.id)} className="remove-filter-button"><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button onClick={addFilter} className="add-filter-button">+ Добавить фильтр</button>
            </div>
          )}

          {showColumnsPanel && (
            <div className="columns-panel">
              <div className="columns-panel-header">
                <h3>Колонки</h3>
                <button onClick={() => { const all = new Set(); for(let i=1;i<=41;i++) all.add(i); setVisibleColumns(all); }}>Все</button>
                <button onClick={() => setVisibleColumns(new Set())}>Ничего</button>
              </div>
              <div className="columns-grid">
                {ColumnName.slice(1).map((name, idx) => (
                  <label key={idx + 1}>
                    <input type="checkbox" checked={visibleColumns.has(idx + 1)} onChange={() => {
                      const newVisible = new Set(visibleColumns);
                      if (newVisible.has(idx + 1)) newVisible.delete(idx + 1);
                      else newVisible.add(idx + 1);
                      setVisibleColumns(newVisible);
                    }} />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showExportPanel && (
            <div className="export-panel">
              <h3>Экспорт</h3>
              <div className="export-formats">
                <label><input type="checkbox" checked={exportFormats.excel} onChange={() => setExportFormats(prev => ({ ...prev, excel: !prev.excel }))} /> Excel</label>
                <label><input type="checkbox" checked={exportFormats.word} onChange={() => setExportFormats(prev => ({ ...prev, word: !prev.word }))} /> Word</label>
              </div>
              <div className="column-selector-grid">
                {ColumnName.slice(1).map((name, idx) => (
                  <label key={idx + 1}>
                    <input type="checkbox" checked={selectedColumns.has(idx + 1)} onChange={() => {
                      const newSelected = new Set(selectedColumns);
                      if (newSelected.has(idx + 1)) newSelected.delete(idx + 1);
                      else newSelected.add(idx + 1);
                      setSelectedColumns(newSelected);
                    }} />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
              <button onClick={handleExport} className="export-confirm-button">Экспортировать</button>
              <button onClick={() => setShowExportPanel(false)}>Отмена</button>
            </div>
          )}
        </div>

        <div className="table-wrapper">
          <table className="editable-table">
            <thead>
              <tr>
                <th className="id-checkbox-header"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                {columns.map((col, idx) => {
                  const colNum = idx + 1;
                  if (!visibleColumns.has(colNum)) return null;
                  return (
                    <th key={col} className="sortable-header" onClick={() => handleSort(col)}>
                      <div className="header-content">
                        <span>{ColumnName[colNum]}</span>
                        <span className="sort-icon">{getSortIcon(col)}</span>
                      </div>
                    </th>
                  );
                })}
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr><td colSpan={visibleColumns.size + 2} className="no-data">Нет данных</td></tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    rowIndex={(currentPage - 1) * ROWS_PER_PAGE + idx}
                    columns={columns}
                    visibleColumns={visibleColumns}
                    selectedRows={selectedRows}
                    editingCell={editingCell}
                    editValue={editValue}
                    searchTerm={searchTerm}
                    searchColumn={searchColumn}
                    isSelected={selectedRows.has(row.id)}
                    onSelectRow={handleSelectRow}
                    onCellDoubleClick={(rowId, column, value) => {
                      if (canEdit) {
                        setEditingCell({ rowId, column, value, rowIndex: idx });
                        setEditValue(value);
                      }
                    }}
                    onCellSave={handleCellSave}
                    onCellCancel={() => setEditingCell({ rowId: null, column: null, value: '', rowIndex: null })}
                    setEditValue={setEditValue}
                    formatPreparationForm={formatPreparationForm}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onRowClick={(row, mode) => {
                      const rowValues = columns.map((col, i) => ({ id: i + 1, columnName: col, value: row[col] || '', columnNumber: i + 1 }));
                      setModalState({ isOpen: true, mode, selectedRow: row, rowData: rowValues });
                    }}
                    onDeleteRow={async (row) => {
                      if (window.confirm(`Удалить "${row.column1}"?`)) {
                        await apiRequest(`/ordinators/${row.id}`, 'DELETE');
                        await fetchOrdinators();
                      }
                    }}
                    userRole={userData?.role}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        
        <div className="pagination-info">
          Показано {paginatedData.length} из {sortedFilteredData.length} записей (стр. {currentPage} из {totalPages})
        </div>
      </div>

      {modalState.isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{modalState.mode === 'create' ? 'Создание' : modalState.mode === 'view' ? 'Просмотр' : 'Редактирование'}</h2>
              <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="close-button">×</button>
            </div>
            <div className="modal-content">
              <div className="columns-editor">
                {columns.map((col, idx) => {
                  const colNum = idx + 1;
                  const value = modalState.mode === 'create' ? '' : modalState.rowData.find(item => item.columnName === col)?.value || '';
                  return (
                    <div key={col} className="column-editor-item">
                      <label>{ColumnName[colNum]}:</label>
                      <input type="text" value={value} onChange={(e) => {
                        if (modalState.mode !== 'view') {
                          const newRowData = [...modalState.rowData];
                          const item = newRowData.find(i => i.columnName === col);
                          if (item) item.value = e.target.value;
                          setModalState(prev => ({ ...prev, rowData: newRowData }));
                        }
                      }} disabled={modalState.mode === 'view'} />
                    </div>
                  );
                })}
              </div>
              <div className="modal-actions">
                {modalState.mode !== 'view' && (
                  <button onClick={async () => {
                    const rowDataObj = {};
                    modalState.rowData.forEach(item => { rowDataObj[item.columnName] = item.value; });
                    if (modalState.mode === 'create') await apiRequest('/ordinators', 'POST', rowDataObj);
                    else await apiRequest(`/ordinators/${modalState.selectedRow.id}`, 'PATCH', rowDataObj);
                    await fetchOrdinators();
                    setModalState({ ...modalState, isOpen: false });
                  }} className="save-button">Сохранить</button>
                )}
                <button onClick={() => setModalState({ ...modalState, isOpen: false })}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableTable;