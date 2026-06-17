import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, HelpCircle } from 'lucide-react';
import './EditableTable.css';

import { useApi } from './components/EditableTable/hooks/useApi';
import { useOrdinators } from './components/EditableTable/hooks/useOrdinators';
import { useOptions } from './components/EditableTable/hooks/useOptions';
import { usePermissions } from './components/EditableTable/hooks/usePermissions';
import { useFilters } from './components/EditableTable/hooks/useFilters';
import { useExport } from './components/EditableTable/hooks/useExport';
import { useCertificates } from './components/EditableTable/hooks/useCertificates';
import { useModal } from './components/EditableTable/hooks/useModal';

import SearchPanel from './components/EditableTable/components/SearchPanel';
import FilterPanel from './components/EditableTable/components/FilterPanel';
import ColumnsPanel from './components/EditableTable/components/ColumnsPanel';
import ExportPanel from './components/EditableTable/components/ExportPanel';
import CertificatePanel from './components/EditableTable/components/CertificatePanel';
import CreateModal from './components/EditableTable/components/CreateModal';
import Pagination from './components/EditableTable/components/Pagination';

import InlineCellEditor from './components/EditableTable/renderers/InlineCellEditor';
import NestedSocialLeaveRenderer from './components/EditableTable/renderers/NestedSocialLeaveRenderer';
import NestedSupervisorsRenderer from './components/EditableTable/renderers/NestedSupervisorsRenderer';
import ExtensionsRenderer from './components/EditableTable/renderers/ExtensionsRenderer';
import AllowanceRenderer from './components/EditableTable/renderers/AllowanceRenderer';

import { COLUMN_NAMES, ROWS_PER_PAGE } from './components/EditableTable/utils/constants';
import { formatPreparationForm, formatDateToAPI } from './components/EditableTable/utils/dateUtils';
import { transformTableDataToApi } from './components/EditableTable/utils/dataTransformers';
import { getFieldType } from './components/EditableTable/utils/fieldUtils';

const EditableTable = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { apiRequest } = useApi();
  const {
    data,
    setData,
    loading,
    setLoading,
    error,
    fetchOrdinators,
    createOrdinator,
    updateOrdinator,
    deleteOrdinator,
    bulkDeleteOrdinators,
    getOrdinatorById,
  } = useOrdinators();
  
  const {
    selectOptions,
    selectData,
    optionsLoading,
    loadServerOptions,
    addCustomOption,
  } = useOptions();
  
  const permissions = usePermissions(userData);
  
  const {
    filters,
    setFilters,
    filterLogic,
    setFilterLogic,
    searchTerm,
    setSearchTerm,
    searchColumn,
    setSearchColumn,
    getOperatorsByType,
    addFilter,
    removeFilter,
    updateFilter,
    applyFilters,
  } = useFilters();
  
  const {
    showExportPanel,
    setShowExportPanel,
    selectedColumns,
    setSelectedColumns,
    exportFormats,
    handleSelectAllColumns,
    handleSelectColumn,
    handleFormatChange,
    handleExport,
  } = useExport();
  
  const {
    showCertificatePanel,
    setShowCertificatePanel,
    selectedCertificateTypes,
    setSelectedCertificateTypes,
    generatingCertificates,
    handleCertificateTypeChange,
    handleGenerateCertificates,
  } = useCertificates(userData);
  
  const {
    modalState,
    setModalState,
    newRowData,
    setNewRowData,
    dateErrors,
    setDateErrors,
    initCreateRow,
    openEditModal,
    handleModalChange,
    handleCancel,
    handleSave,
  } = useModal(selectOptions);

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(new Set());
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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  useEffect(() => {
    const allColumns = new Set();
    const initialVisible = new Set();
    for (let i = 1; i <= 40; i++) {
      allColumns.add(i);
      initialVisible.add(i);
    }
    setSelectedColumns(allColumns);
    setVisibleColumns(initialVisible);
  }, [setSelectedColumns]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchColumn, filters, sortConfig]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
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

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
    setFilters([]);
    setFilterLogic('AND');
    setSortConfig({ key: null, direction: 'ascending' });
    setSelectedRows(new Set());
    setSelectAll(false);
    setCurrentPage(1);
    
    setShowFilterPanel(false);
    setShowColumnsPanel(false);
    setShowCertificatePanel(false);
    setShowExportPanel(false);
    
    const allColumns = new Set();
    for (let i = 1; i <= 40; i++) {
      allColumns.add(i);
    }
    setSelectedColumns(allColumns);
    
    const initialVisible = new Set();
    for (let i = 1; i <= 40; i++) {
      initialVisible.add(i);
    }
    setVisibleColumns(initialVisible);
    
    setSelectedCertificateTypes(new Set());
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
      const newSelected = new Set(sortedFilteredData.map(row => row.id));
      setSelectedRows(newSelected);
    }
    setSelectAll(!selectAll);
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

  const handleCellSave = async (savedValue) => {
    if (editingCell.rowId === null) return;

    try {
      const { rowId, column, fieldType, columnNumber } = editingCell;
      const rowIndex = data.findIndex(row => row.id === rowId);
      if (rowIndex === -1) return;

      let valueToSave = savedValue;
      if (fieldType === 'date' && valueToSave && columnNumber !== 3) {
        valueToSave = formatDateToAPI(valueToSave);
      }

      const updatedRow = { ...data[rowIndex] };
      let valueToDisplay = savedValue;
      if (columnNumber === 3 && savedValue && typeof savedValue === 'string' && savedValue.includes('-')) {
        valueToDisplay = savedValue.split('-')[0];
      }
      updatedRow[column] = valueToDisplay;

      const updatedData = [...data];
      updatedData[rowIndex] = updatedRow;
      setData(updatedData);

      const apiData = transformTableDataToApi(updatedRow, 'update');
      await apiRequest(`/ordinators/${rowId}`, 'PATCH', apiData);

      setEditingCell({ rowId: null, column: null, value: '', rowIndex: null, fieldType: null, columnNumber: null, subField: null, subIndex: null });
    } catch (error) {
      console.error('Error saving cell:', error);
      alert('Ошибка при сохранении изменений');
    }
  };

  const handleCellDoubleClick = (rowId, column, currentValue, rowIndex) => {
    if (!permissions.canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }

    const columnNumber = parseInt(column.replace('column', ''));
    const fieldName = COLUMN_NAMES[columnNumber];
    
    if (userData?.role === 'passportist') {
      const allowedFieldsForPassportist = [
        'Срок окончания регистрации',
        'Документ, удостоверяющий личность',
        'Идентификационный номер',
        'Номер документа'
      ];
      if (!allowedFieldsForPassportist.includes(fieldName)) {
        alert('У вас нет прав для редактирования этого поля.');
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

  const handleCellCancel = () => {
    setEditingCell({ rowId: null, column: null, value: '', rowIndex: null, fieldType: null, columnNumber: null, subField: null, subIndex: null });
    setEditValue('');
  };

  const handleRowClick = async (rowIndex, row, mode = 'edit') => {
    if (mode === 'edit' && !permissions.canEditRow()) {
      alert('У вас нет прав для редактирования');
      return;
    }
    openEditModal(row, rowIndex, selectOptions, getOrdinatorById);
  };

  const handleDeleteRow = async (rowIndex, row) => {
    if (!permissions.canDeleteRow()) {
      alert('У вас нет прав для удаления записей');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите удалить запись "${row.column1}"?`)) {
      try {
        await deleteOrdinator(row.id);
        alert('Запись успешно удалена');
      } catch (error) {
        console.error('Error deleting ordinator:', error);
        alert('Не удалось удалить запись');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDeleteRow()) {
      alert('У вас нет прав для удаления записей');
      return;
    }
    if (selectedRows.size === 0) {
      alert('Выберите хотя бы одну запись для удаления');
      return;
    }
    const confirmed = window.confirm(`Вы уверены, что хотите удалить ${selectedRows.size} запись(ей)?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const { successCount, errorCount, failedIds } = await bulkDeleteOrdinators(selectedRows);
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

  const handleSort = (columnKey) => {
    if (sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      setSortConfig({ key: columnKey, direction: 'descending' });
    } else if (sortConfig.key === columnKey && sortConfig.direction === 'descending') {
      setSortConfig({ key: null, direction: 'ascending' });
    } else {
      setSortConfig({ key: columnKey, direction: 'ascending' });
    }
  };

  const filteredData = (() => {
    let result = [...data];
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(row => {
        if (searchColumn === 'all') {
          for (const [key, value] of Object.entries(row)) {
            if (key !== 'id' && key !== 'originalData') {
              let displayValue = value;
              if (key === 'column16') {
                displayValue = formatPreparationForm(value);
              }
              if (String(displayValue || '').toLowerCase().includes(searchLower)) {
                return true;
              }
            }
          }
          return false;
        } else {
          let displayValue = row[searchColumn] || '';
          if (searchColumn === 'column16') {
            displayValue = formatPreparationForm(displayValue);
          }
          return String(displayValue || '').toLowerCase().includes(searchLower);
        }
      });
    }
    
    if (filters.length > 0) {
      result = applyFilters(result);
    }
    
    return result;
  })();
  
  const getSortedData = (dataToSort) => {
    if (!sortConfig.key || !dataToSort.length) return dataToSort;
    
    return [...dataToSort].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      const columnNumber = parseInt(sortConfig.key.replace('column', ''));
      
      const isEmpty = (value) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
      };
      
      if (sortConfig.key === 'column16') {
        aValue = formatPreparationForm(aValue);
        bValue = formatPreparationForm(bValue);
      }
      
      if (sortConfig.key === 'column33') {
        const getLastSupervisorName = (value) => {
          try {
            const supervisors = JSON.parse(value || '[]');
            if (!Array.isArray(supervisors) || supervisors.length === 0) return '';
            const sorted = [...supervisors].sort((x, y) => {
              const dateX = x.startDate ? new Date(x.startDate) : new Date(0);
              const dateY = y.startDate ? new Date(y.startDate) : new Date(0);
              return dateY - dateX;
            });
            return sorted[0]?.supervisorName || '';
          } catch {
            return '';
          }
        };
        aValue = getLastSupervisorName(aValue);
        bValue = getLastSupervisorName(bValue);
      }
      
      if (sortConfig.key === 'column9') {
        const getEarliestLeaveDate = (value) => {
          try {
            const leaves = JSON.parse(value || '[]');
            if (!Array.isArray(leaves) || leaves.length === 0) return null;
            let earliestDate = null;
            for (const leave of leaves) {
              if (leave.startDate) {
                const date = new Date(leave.startDate);
                if (!isNaN(date) && (!earliestDate || date < earliestDate)) {
                  earliestDate = date;
                }
              }
            }
            return earliestDate;
          } catch {
            return null;
          }
        };
        const aDate = getEarliestLeaveDate(aValue);
        const bDate = getEarliestLeaveDate(bValue);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        const timeA = aDate.getTime();
        const timeB = bDate.getTime();
        return sortConfig.direction === 'ascending' ? timeA - timeB : timeB - timeA;
      }
      
      if (sortConfig.key === 'column27') {
        const getLatestExtensionDate = (value) => {
          try {
            const extensions = JSON.parse(value || '[]');
            if (!Array.isArray(extensions) || extensions.length === 0) return null;
            let latestDate = null;
            for (const ext of extensions) {
              if (ext.orderDate) {
                const date = new Date(ext.orderDate);
                if (!isNaN(date) && (!latestDate || date > latestDate)) {
                  latestDate = date;
                }
              }
            }
            return latestDate;
          } catch {
            return null;
          }
        };
        const aDate = getLatestExtensionDate(aValue);
        const bDate = getLatestExtensionDate(bValue);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        const timeA = aDate.getTime();
        const timeB = bDate.getTime();
        return sortConfig.direction === 'ascending' ? timeA - timeB : timeB - timeA;
      }
      
      if (sortConfig.key === 'column36') {
        const getEarliestAllowanceDate = (value) => {
          try {
            const allowances = JSON.parse(value || '[]');
            if (!Array.isArray(allowances) || allowances.length === 0) return null;
            let earliestDate = null;
            for (const allow of allowances) {
              if (allow.startDate) {
                const date = new Date(allow.startDate);
                if (!isNaN(date) && (!earliestDate || date < earliestDate)) {
                  earliestDate = date;
                }
              }
            }
            return earliestDate;
          } catch {
            return null;
          }
        };
        const aDate = getEarliestAllowanceDate(aValue);
        const bDate = getEarliestAllowanceDate(bValue);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        const timeA = aDate.getTime();
        const timeB = bDate.getTime();
        return sortConfig.direction === 'ascending' ? timeA - timeB : timeB - timeA;
      }
      
      const dateColumns = [3, 6, 7, 22, 24, 26, 30, 34, 35];
      const numberColumns = [12];
      
      if (columnNumber === 3) {
        const getYear = (value) => {
          if (isEmpty(value)) return null;
          if (typeof value === 'number') return value;
          const yearMatch = String(value).match(/\d{4}/);
          return yearMatch ? parseInt(yearMatch[0]) : null;
        };
        const yearA = getYear(aValue);
        const yearB = getYear(bValue);
        if (yearA === null && yearB === null) return 0;
        if (yearA === null) return 1;
        if (yearB === null) return -1;
        return sortConfig.direction === 'ascending' ? yearA - yearB : yearB - yearA;
      }
      
      if (dateColumns.includes(columnNumber)) {
        const getDate = (value) => {
          if (isEmpty(value)) return null;
          const formatted = formatDateToAPI(value);
          if (!formatted) return null;
          const date = new Date(formatted);
          return isNaN(date.getTime()) ? null : date;
        };
        const dateA = getDate(aValue);
        const dateB = getDate(bValue);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        const timeA = dateA.getTime();
        const timeB = dateB.getTime();
        return sortConfig.direction === 'ascending' ? timeA - timeB : timeB - timeA;
      }
      
      if (numberColumns.includes(columnNumber)) {
        const numA = parseFloat(aValue);
        const numB = parseFloat(bValue);
        const isNumAValid = !isNaN(numA) && !isEmpty(aValue);
        const isNumBValid = !isNaN(numB) && !isEmpty(bValue);
        if (!isNumAValid && !isNumBValid) return 0;
        if (!isNumAValid) return 1;
        if (!isNumBValid) return -1;
        return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
      }
      
      const booleanColumns = [38, 39];
      if (booleanColumns.includes(columnNumber)) {
        const getBoolValue = (value) => {
          if (isEmpty(value)) return -1;
          const str = String(value || '').toLowerCase();
          return (str === 'есть' || str === 'да' || str === 'true') ? 1 : 0;
        };
        const boolA = getBoolValue(aValue);
        const boolB = getBoolValue(bValue);
        if (boolA === -1 && boolB === -1) return 0;
        if (boolA === -1) return 1;
        if (boolB === -1) return -1;
        return sortConfig.direction === 'ascending' ? boolA - boolB : boolB - boolA;
      }
      
      const aStr = String(aValue || '').trim();
      const bStr = String(bValue || '').trim();
      const isAEmpty = aStr === '';
      const isBEmpty = bStr === '';
      if (isAEmpty && isBEmpty) return 0;
      if (isAEmpty) return 1;
      if (isBEmpty) return -1;
      const aLower = aStr.toLowerCase();
      const bLower = bStr.toLowerCase();
      if (aLower < bLower) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aLower > bLower) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  };

  const sortedFilteredData = getSortedData(filteredData);

  useEffect(() => {
    const allFilteredIds = sortedFilteredData.map(row => row.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedRows.has(id));
    setSelectAll(isAllSelected);
  }, [selectedRows, sortedFilteredData]);

  const totalPages = Math.ceil(sortedFilteredData.length / ROWS_PER_PAGE);
  const paginatedData = sortedFilteredData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const columns = Array.from({ length: 40 }, (_, i) => `column${i + 1}`);

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

  return (
    <div className="table-page">
      <header className="user-header">
        <div className="header-left">
          <div className="user-profile-button" onClick={() => setShowUserMenu(!showUserMenu)}>
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
            {permissions.canViewAdminPanel() && (
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
      </header>

      <div className="table-container">
        <SearchPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchColumn={searchColumn}
          setSearchColumn={setSearchColumn}
          filters={filters}
          showFilterPanel={showFilterPanel}
          setShowFilterPanel={setShowFilterPanel}
          showColumnsPanel={showColumnsPanel}
          setShowColumnsPanel={setShowColumnsPanel}
          showCertificatePanel={showCertificatePanel}
          setShowCertificatePanel={setShowCertificatePanel}
          showExportPanel={showExportPanel}
          setShowExportPanel={setShowExportPanel}
          selectedRows={selectedRows}
          selectedCertificateTypes={selectedCertificateTypes}
          canGenerateCertificates={permissions.canGenerateCertificates}
          canExport={permissions.canExport}
          canCreateRow={permissions.canCreateRow}
          canDeleteRow={permissions.canDeleteRow}
          initCreateRow={() => initCreateRow(selectOptions)}
          handleBulkDelete={handleBulkDelete}
          handleResetSearch={handleResetSearch}
          visibleColumns={visibleColumns}
        />

        {showFilterPanel && (
          <FilterPanel
            filters={filters}
            filterLogic={filterLogic}
            setFilterLogic={setFilterLogic}
            getOperatorsByType={getOperatorsByType}
            updateFilter={updateFilter}
            removeFilter={removeFilter}
            addFilter={addFilter}
            setFilters={setFilters}
          />
        )}

        {showColumnsPanel && (
          <ColumnsPanel
            visibleColumns={visibleColumns}
            handleToggleColumn={handleToggleColumn}
            handleShowAllColumns={handleShowAllColumns}
            handleHideAllColumns={handleHideAllColumns}
          />
        )}

        {showCertificatePanel && (
          <CertificatePanel
            selectedCertificateTypes={selectedCertificateTypes}
            generatingCertificates={generatingCertificates}
            handleCertificateTypeChange={handleCertificateTypeChange}
            handleGenerateCertificates={() => handleGenerateCertificates(data, selectedRows)}
            setShowCertificatePanel={setShowCertificatePanel}
          />
        )}

        {showExportPanel && (
          <ExportPanel
            selectedColumns={selectedColumns}
            exportFormats={exportFormats}
            handleSelectColumn={handleSelectColumn}
            handleSelectAllColumns={handleSelectAllColumns}
            handleFormatChange={handleFormatChange}
            handleExport={() => handleExport(data, selectedRows)}
            setShowExportPanel={setShowExportPanel}
          />
        )}

        <div className="selection-info">
          {selectedRows.size > 0 && (
            <p className="selected-count-table">
              Выбрано записей: {selectedRows.size}
            </p>
          )}
          {filters.length > 0 && (
            <p className="filter-info">
              Активных фильтров: {filters.length} (логика: {filterLogic === 'AND' ? 'И' : 'ИЛИ'})
            </p>
          )}
          {visibleColumns.size < 40 && (
            <p className="columns-info">
              Отображается колонок: {visibleColumns.size} из 40
            </p>
          )}
        </div>
        
        <div className="search-info">
          {searchTerm && (
            <p>
              Найдено строк: {filteredData.length} из {data.length}
            </p>
          )}
          {sortConfig.key && (
            <p className="sort-info">
              Сортировка по: <strong>{COLUMN_NAMES[parseInt(sortConfig.key.replace('column', ''))]}</strong> 
              ({sortConfig.direction === 'ascending' ? 'по возрастанию' : 'по убыванию'})
            </p>
          )}
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
                      />
                    </div>
                  </div>
                </th>
                {columns.map((col, index) => {
                  const columnNumber = index + 1;
                  const fieldName = COLUMN_NAMES[columnNumber];
                  if (!fieldName || fieldName === '') return null;
                  if (!visibleColumns.has(columnNumber)) return null;
                  return (
                    <th key={col} className="column-header sticky-top sortable-header" onClick={() => handleSort(col)}>
                      <div className="header-content">
                        <span className="header-text">{fieldName}</span>
                        <span className="sort-icon">
                          {sortConfig.key === col && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.size + 1} className="no-data">
                    {data.length === 0 ? 'Нет данных. Создайте первую запись.' : 'Нет результатов по вашему запросу.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => {
                  const originalIndex = data.indexOf(row);
                  return (
                    <tr key={`row-${row.id}`} className="table-row">
                      <td className="id-checkbox-cell sticky-left" onDoubleClick={() => {
                        if (permissions.canEditRow()) {
                          handleRowClick(originalIndex, row, 'edit');
                        } else if (userData?.role === 'supervisor') {
                          handleRowClick(originalIndex, row, 'view');
                        }
                      }} style={{ cursor: 'pointer' }}>
                        <div className="id-checkbox-container">
                          <div className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
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
                        const fieldName = COLUMN_NAMES[columnNumber];
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
                              selectData={selectData}
                              addCustomOption={addCustomOption}
                              selectOptions={selectOptions}
                            />
                          );
                        }

                        if (column === 'column9') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <NestedSocialLeaveRenderer 
                                rowId={row.id} 
                                value={row[column]} 
                                data={data}
                                setData={setData}
                                userData={userData}
                              />
                            </td>
                          );
                        }

                        if (column === 'column33') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <NestedSupervisorsRenderer 
                                rowId={row.id} 
                                value={row[column]} 
                                data={data}
                                setData={setData}
                                userData={userData}
                              />
                            </td>
                          );
                        }

                        if (column === 'column27') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <ExtensionsRenderer 
                                rowId={row.id} 
                                value={row[column]} 
                                data={data}
                                setData={setData}
                                userData={userData}
                              />
                            </td>
                          );
                        }

                        if (column === 'column36') {
                          return (
                            <td key={`cell-${row.id}-${column}`} className="nested-cell-td">
                              <AllowanceRenderer 
                                rowId={row.id} 
                                value={row[column]} 
                                data={data}
                                setData={setData}
                                userData={userData}
                              />
                            </td>
                          );
                        }

                        return (
                          <td
                            key={`cell-${row.id}-${column}`}
                            onDoubleClick={() => handleCellDoubleClick(row.id, column, cellValue, rowIndex)}
                            className={permissions.canEditRow() ? 'editable-cell' : ''}
                          >
                            <span className="cell-value" title={cellValue}>
                              {cellValue}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        <div className="pagination-info">
          Показано {paginatedData.length} из {sortedFilteredData.length} записей (стр. {currentPage} из {totalPages})
        </div>
      </div>

      {modalState.isOpen && (
        <CreateModal
          modalState={modalState}
          newRowData={newRowData}
          dateErrors={dateErrors}
          setDateErrors={setDateErrors}
          selectOptions={selectOptions}
          selectData={selectData}
          addCustomOption={addCustomOption}
          handleModalChange={handleModalChange}
          handleSave={() => handleSave(createOrdinator, updateOrdinator, fetchOrdinators)}
          handleCancel={handleCancel}
          userData={userData}
          columns={columns}
        />
      )}

      <button className="floating-help-button" onClick={goToInstruction} title="Открыть инструкцию">
        <HelpCircle size={24} />
      </button>
    </div>
  );
};

export default EditableTable;