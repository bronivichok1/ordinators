import React from 'react';
import { COLUMN_NAMES } from '../utils/constants';

const ColumnsPanel = ({
  visibleColumns,
  handleToggleColumn,
  handleShowAllColumns,
  handleHideAllColumns,
}) => {
  return (
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
        {Object.entries(COLUMN_NAMES).map(([key, name]) => {
          const columnNumber = parseInt(key);
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
  );
};

export default ColumnsPanel;