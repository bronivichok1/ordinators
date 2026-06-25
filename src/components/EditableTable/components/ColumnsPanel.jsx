import React from 'react';
import { COLUMN_NAMES } from '../utils/constants';

const ColumnsPanel = ({
  visibleColumns,
  handleToggleColumn,
  handleShowAllColumns,
  handleHideAllColumns,
}) => {
  const allColumnNumbers = Object.keys(COLUMN_NAMES)
    .map(Number)
    .filter(num => COLUMN_NAMES[num] && COLUMN_NAMES[num] !== '');

  const allColumnsVisible = visibleColumns.size === allColumnNumbers.length;

  const handleToggleAllColumns = () => {
    if (allColumnsVisible) {
      handleHideAllColumns();
    } else {
      handleShowAllColumns();
    }
  };

  return (
    <div className="columns-panel">
      <div className="columns-panel-header">
        <h3>Выбор колонок для отображения</h3>
        <div className="columns-actions">
          <button 
            onClick={handleToggleAllColumns} 
            className='show-all-columns-button'
          >
            {allColumnsVisible ? 'Скрыть все' : 'Показать все'}
          </button>
        </div>
      </div>
      <div className="columns-grid">
        {allColumnNumbers.map((columnNumber) => {
          const name = COLUMN_NAMES[columnNumber];
          if (!name || name === '') return null;
          
          return (
            <label 
              key={columnNumber} 
              className={`column-checkbox-label ${visibleColumns.has(columnNumber) ? 'selected' : ''}`}
            >
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