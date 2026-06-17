// src/components/EditableTable/components/FilterPanel.js

import React from 'react';
import { X } from 'lucide-react';
import { COLUMN_NAMES } from '../utils/constants';

const FilterPanel = ({
  filters,
  filterLogic,
  setFilterLogic,
  getOperatorsByType,
  updateFilter,
  removeFilter,
  addFilter,
  setFilters,
}) => {
  const columns = Array.from({ length: 40 }, (_, i) => `column${i + 1}`);

  return (
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
                const fieldName = COLUMN_NAMES[columnNumber];
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
          Добавить фильтр
        </button>
        {filters.length > 0 && (
          <button onClick={() => setFilters([])} className="export-cancel-button">
            Очистить
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;