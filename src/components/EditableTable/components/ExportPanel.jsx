import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { COLUMN_NAMES } from '../utils/constants';

const ExportPanel = ({
  selectedColumns,
  exportFormats,
  handleSelectColumn,
  handleSelectAllColumns,
  handleFormatChange,
  handleExport,
  setShowExportPanel,
}) => {
  return (
    <>
      <div className="column-selector-panel">
        <div className="column-selector-header">
          <h3>Выбор колонок для экспорта</h3>
          <button 
            onClick={handleSelectAllColumns}
            className="select-all-columns-button"
          >
            {selectedColumns.size === 39 ? 'Снять все' : 'Выбрать все'}
          </button>
        </div>
        <div className="column-selector-grid">
          {Object.entries(COLUMN_NAMES).map(([key, name]) => {
            const colNum = parseInt(key);
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
  );
};

export default ExportPanel;