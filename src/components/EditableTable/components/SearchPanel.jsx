import React from 'react';
import { Filter, Eye, FileSignature, Download } from 'lucide-react';
import { COLUMN_NAMES } from '../utils/constants';

const SearchPanel = ({
  searchTerm,
  setSearchTerm,
  searchColumn,
  setSearchColumn,
  filters,
  showFilterPanel,
  setShowFilterPanel,
  showColumnsPanel,
  setShowColumnsPanel,
  showCertificatePanel,
  setShowCertificatePanel,
  showExportPanel,
  setShowExportPanel,
  selectedRows,
  selectedCertificateTypes,
  canGenerateCertificates,
  canExport,
  canCreateRow,
  canDeleteRow,
  initCreateRow,
  handleBulkDelete,
  handleResetSearch,
  visibleColumns,
}) => {
  const columns = Array.from({ length: 39 }, (_, i) => `column${i + 1}`);

  return (
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
            const columnName = COLUMN_NAMES[index + 1];
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
          className={`columns-button ${visibleColumns.size < 39 ? 'active' : ''}`}
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
    </div>
  );
};

export default SearchPanel;