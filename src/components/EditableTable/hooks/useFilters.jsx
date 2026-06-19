import { useState } from 'react';
import { COLUMN_NAMES, DATE_COLUMNS, NUMBER_COLUMNS, BOOLEAN_COLUMNS } from '../utils/constants';
import { formatDateToAPI, formatPreparationForm, formatDateToDisplay } from '../utils/dateUtils';

export const useFilters = () => {
  const [filters, setFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');

  const getFieldType = (columnNumber) => {
    const fieldName = COLUMN_NAMES[columnNumber];
    
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
        { value: 'between', label: 'Между' },
        { value: 'contains', label: 'Содержит (текст)' }
      ];
    } else if (type === 'tel' || type === 'password') {
      return [
        { value: 'contains', label: 'Содержит' },
        { value: 'equals', label: 'Равно' },
        { value: 'notContains', label: 'Не содержит' },
        { value: 'notEquals', label: 'Не равно' }
      ];
    } else if (type === 'number') {
      return [
        { value: 'equals', label: 'Равно' },
        { value: 'greaterThan', label: 'Больше' },
        { value: 'lessThan', label: 'Меньше' },
        { value: 'between', label: 'Между' }
      ];
    }
    return [{ value: 'contains', label: 'Содержит' }];
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

  const applyFilters = (rows) => {
    if (filters.length === 0) return rows;
  
    return rows.filter(row => {
      const results = filters.map(filter => {
        let columnValue = row[filter.column] || '';
        const columnNumber = parseInt(filter.column.replace('column', ''));
        
        if (!filter.value || filter.value.trim() === '') {
          return true;
        }
        
        const isEmptyValue = (value) => {
          if (value === null || value === undefined) return true;
          if (typeof value === 'string') return value.trim() === '';
          if (Array.isArray(value)) return value.length === 0;
          if (typeof value === 'object') return Object.keys(value).length === 0;
          return false;
        };
        
        if (filter.column === 'column16') {
          columnValue = formatPreparationForm(columnValue);
        }
        
        if (filter.column === 'column33') {
          try {
            const supervisors = JSON.parse(row[filter.column] || '[]');
            if (!Array.isArray(supervisors) || supervisors.length === 0) {
              columnValue = '';
            } else {
              const supervisorsInfo = supervisors.map(sup => {
                let info = sup.supervisorName || '';
                if (sup.position) info += ` ${sup.position}`;
                if (sup.rank) info += ` ${sup.rank}`;
                if (sup.startDate) info += ` ${formatDateToDisplay(sup.startDate)}`;
                if (sup.endDate) info += ` ${formatDateToDisplay(sup.endDate)}`;
                return info;
              }).join(' ');
              columnValue = supervisorsInfo;
            }
          } catch (e) {
            columnValue = '';
          }
        }
        
        if (filter.column === 'column9') {
          try {
            const leaves = JSON.parse(columnValue || '[]');
            if (Array.isArray(leaves) && leaves.length > 0) {
              columnValue = leaves.map(l => 
                `${formatDateToDisplay(l.startDate) || ''} ${formatDateToDisplay(l.endDate) || ''} ${l.reason || ''}`
              ).join(' ');
            } else {
              columnValue = '';
            }
          } catch {
            columnValue = '';
          }
        }
        
        if (filter.column === 'column27') {
          try {
            const extensions = JSON.parse(columnValue || '[]');
            if (Array.isArray(extensions) && extensions.length > 0) {
              columnValue = extensions.map(ext => 
                `${ext.orderNumber || ''} ${formatDateToDisplay(ext.orderDate) || ''} ${ext.extensionTerm || ''}`
              ).join(' ');
            } else {
              columnValue = '';
            }
          } catch {
            columnValue = '';
          }
        }
        
        if (filter.column === 'column36') {
          try {
            const allowances = JSON.parse(columnValue || '[]');
            if (Array.isArray(allowances) && allowances.length > 0) {
              columnValue = allowances.map(allow => 
                `${allow.orderNumber || ''} ${formatDateToDisplay(allow.startDate) || ''} ${formatDateToDisplay(allow.endDate) || ''}`
              ).join(' ');
            } else {
              columnValue = '';
            }
          } catch {
            columnValue = '';
          }
        }
        
        let filterValue = filter.value;
        let filterValueTrimmed = filterValue.trim();
        
        const isColumnEmpty = isEmptyValue(columnValue);
        
        if (isColumnEmpty) {
          switch (filter.operator) {
            case 'equals':
              return filterValueTrimmed === '';
            case 'notEquals':
              return filterValueTrimmed !== '';
            case 'contains':
            case 'notContains':
            case 'startsWith':
            case 'endsWith':
              return false;
            default:
              return false;
          }
        }
        
        if (DATE_COLUMNS.includes(columnNumber) || filter.type === 'date') {
          const formattedColumnValue = formatDateToAPI(columnValue);
          const formattedFilterValue = formatDateToAPI(filterValueTrimmed);
          
          if (!formattedColumnValue) return false;
          
          const columnDate = new Date(formattedColumnValue);
          if (isNaN(columnDate.getTime())) return false;
          
          switch (filter.operator) {
            case 'equals':
              const filterDate = new Date(formattedFilterValue);
              if (isNaN(filterDate.getTime())) return false;
              return columnDate.toDateString() === filterDate.toDateString();
            
            case 'greaterThan':
              const greaterDate = new Date(formattedFilterValue);
              if (isNaN(greaterDate.getTime())) return false;
              return columnDate > greaterDate;
            
            case 'lessThan':
              const lessDate = new Date(formattedFilterValue);
              if (isNaN(lessDate.getTime())) return false;
              return columnDate < lessDate;
            
            case 'between':
              const [startDateStr, endDateStr] = filterValueTrimmed.split(',').map(s => s.trim());
              if (!startDateStr || !endDateStr) return false;
              const startDate = new Date(formatDateToAPI(startDateStr));
              const endDate = new Date(formatDateToAPI(endDateStr));
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
              return columnDate >= startDate && columnDate <= endDate;
            
            default:
              return String(columnValue).toLowerCase().includes(filterValueTrimmed.toLowerCase());
          }
        }
        
        if (NUMBER_COLUMNS.includes(columnNumber)) {
          let numColumn = 0;
          if (columnNumber === 3) {
            const yearMatch = String(columnValue).match(/\d{4}/);
            numColumn = yearMatch ? parseInt(yearMatch[0]) : NaN;
          } else {
            numColumn = parseFloat(columnValue);
          }
          
          const numFilter = parseFloat(filterValueTrimmed);
          
          if (isNaN(numColumn)) return false;
          
          switch (filter.operator) {
            case 'equals':
              return !isNaN(numFilter) && numColumn === numFilter;
            case 'notEquals':
              return !isNaN(numFilter) && numColumn !== numFilter;
            case 'greaterThan':
              return !isNaN(numFilter) && numColumn > numFilter;
            case 'lessThan':
              return !isNaN(numFilter) && numColumn < numFilter;
            case 'between':
              const [num1, num2] = filterValueTrimmed.split(',').map(s => parseFloat(s.trim()));
              if (isNaN(num1) || isNaN(num2)) return false;
              return numColumn >= num1 && numColumn <= num2;
            default:
              return String(numColumn).includes(filterValueTrimmed);
          }
        }
        
        if (BOOLEAN_COLUMNS.includes(columnNumber)) {
          const getBoolValue = (value) => {
            const str = String(value || '').toLowerCase();
            return str === 'есть' || str === 'да' || str === 'true';
          };
          
          const boolColumn = getBoolValue(columnValue);
          let boolFilter = false;
          
          if (filterValueTrimmed.toLowerCase() === 'есть' || filterValueTrimmed.toLowerCase() === 'да') {
            boolFilter = true;
          } else if (filterValueTrimmed.toLowerCase() === 'нет' || filterValueTrimmed.toLowerCase() === 'false') {
            boolFilter = false;
          } else {
            return false;
          }
          
          switch (filter.operator) {
            case 'equals':
              return boolColumn === boolFilter;
            case 'notEquals':
              return boolColumn !== boolFilter;
            default:
              return boolColumn === boolFilter;
          }
        }
        
        const columnStr = String(columnValue).toLowerCase();
        const filterStr = filterValueTrimmed.toLowerCase();
        
        switch (filter.operator) {
          case 'contains':
            return columnStr.includes(filterStr);
          case 'notContains':
            return !columnStr.includes(filterStr);
          case 'equals':
            return columnStr === filterStr;
          case 'notEquals':
            return columnStr !== filterStr;
          case 'startsWith':
            return columnStr.startsWith(filterStr);
          case 'endsWith':
            return columnStr.endsWith(filterStr);
          case 'greaterThan':
            return columnStr > filterStr;
          case 'lessThan':
            return columnStr < filterStr;
          case 'between':
            const [val1, val2] = filterValueTrimmed.split(',').map(s => s.trim().toLowerCase());
            return columnStr >= val1 && columnStr <= val2;
          default:
            return columnStr.includes(filterStr);
        }
      });
      
      return filterLogic === 'AND' 
        ? results.every(result => result === true)
        : results.some(result => result === true);
    });
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchColumn('all');
    setFilters([]);
    setFilterLogic('AND');
  };

  return {
    filters,
    setFilters,
    filterLogic,
    setFilterLogic,
    searchTerm,
    setSearchTerm,
    searchColumn,
    setSearchColumn,
    getFieldType,
    getOperatorsByType,
    addFilter,
    removeFilter,
    updateFilter,
    applyFilters,
    handleResetSearch,
  };
};