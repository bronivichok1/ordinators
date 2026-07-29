import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, X, Filter, Search, ChevronLeft } from 'lucide-react';
import '../styles/ColumnFilter.css';

const ColumnFilter = ({
  data,
  onFilterChange,
  currentFilters,
  columns
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubFilter, setActiveSubFilter] = useState(null);
  const [activeYear, setActiveYear] = useState(null);
  const [activeMonth, setActiveMonth] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearSearchTerm, setYearSearchTerm] = useState('');
  const [monthSearchTerm, setMonthSearchTerm] = useState('');
  const [valueSearchTerm, setValueSearchTerm] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveCategory(null);
        setActiveSubFilter(null);
        setActiveYear(null);
        setActiveMonth(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleValueClick = (columnKey, value) => {
    const currentValues = currentFilters.get(columnKey) || [];
    let newValues;
    
    if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }
    
    if (newValues.length === 0) {
      onFilterChange(columnKey, null);
    } else {
      onFilterChange(columnKey, newValues);
    }
  };

  const applyDateFilter = (year, month) => {
    if (!year || !month) return;
    
    const dates = data
      .map(row => row.column6)
      .filter(date => {
        if (!date) return false;
        const parts = date.split('.');
        if (parts.length !== 3) return false;
        const dateYear = parts[2];
        const dateMonth = getMonthsFromDate(date);
        return dateYear === year && dateMonth === month;
      });
    
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length > 0) {
      onFilterChange('column6', uniqueDates);
    } else {
      onFilterChange('column6', null);
    }
  };

  const applyYearFilter = (year) => {
    if (!year) return;
    
    const dates = data
      .map(row => row.column6)
      .filter(date => {
        if (!date) return false;
        const parts = date.split('.');
        if (parts.length !== 3) return false;
        return parts[2] === year;
      });
    
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length > 0) {
      onFilterChange('column6', uniqueDates);
    } else {
      onFilterChange('column6', null);
    }
  };

  const applyValueFilterWithDate = (columnKey, value, year, month) => {
    if (!year || !month || !value) return;
    
    const filteredData = data.filter(row => {
      const date = row.column6;
      if (!date) return false;
      const parts = date.split('.');
      if (parts.length !== 3) return false;
      const dateYear = parts[2];
      const dateMonth = getMonthsFromDate(date);
      if (dateYear !== year || dateMonth !== month) return false;
      
      const rowValue = row[columnKey] || 'Не указано';
      return String(rowValue).trim() === value;
    });
    
    const values = filteredData.map(row => row[columnKey]);
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length > 0) {
      onFilterChange(columnKey, uniqueValues);
    } else {
      onFilterChange(columnKey, null);
    }
  };

  const applyValueFilterWithYear = (columnKey, value, year) => {
    if (!year || !value) return;
    
    const filteredData = data.filter(row => {
      const date = row.column6;
      if (!date) return false;
      const parts = date.split('.');
      if (parts.length !== 3) return false;
      const dateYear = parts[2];
      if (dateYear !== year) return false;
      
      const rowValue = row[columnKey] || 'Не указано';
      return String(rowValue).trim() === value;
    });
    
    const values = filteredData.map(row => row[columnKey]);
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length > 0) {
      onFilterChange(columnKey, uniqueValues);
    } else {
      onFilterChange(columnKey, null);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    currentFilters.forEach((value) => {
      if (value && Array.isArray(value) && value.length > 0) {
        count++;
      }
    });
    return count;
  };

  const clearAllFilters = () => {
    currentFilters.forEach((_, key) => {
      onFilterChange(key, null);
    });
    setActiveYear(null);
    setActiveMonth(null);
  };

  const getFilterData = (columnKey, filteredData) => {
    const stats = new Map();
    const targetData = filteredData || data;
    targetData.forEach(row => {
      let value = row[columnKey] || 'Не указано';
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      const strValue = String(value).trim() || 'Не указано';
      stats.set(strValue, (stats.get(strValue) || 0) + 1);
    });
    return Array.from(stats.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getMonthsFromDate = (dateStr) => {
    if (!dateStr) return 'Не указан';
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const month = parseInt(parts[1]);
      const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      return monthNames[month - 1] || 'Не указан';
    }
    return 'Не указан';
  };

  const getUniqueYears = () => {
    const years = new Set();
    data.forEach(row => {
      const date = row.column6;
      if (date) {
        const parts = date.split('.');
        if (parts.length === 3) {
          years.add(parts[2]);
        }
      }
    });
    return Array.from(years).sort();
  };

  const getUniqueMonths = (year) => {
    const months = new Set();
    data.forEach(row => {
      const date = row.column6;
      if (date) {
        const parts = date.split('.');
        if (parts.length === 3 && parts[2] === year) {
          months.add(getMonthsFromDate(date));
        }
      }
    });
    const monthOrder = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return Array.from(months).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  };

  const getFilterDataByYearAndMonth = (year, month, columnKey) => {
    const stats = new Map();
    data.forEach(row => {
      const date = row.column6;
      if (date) {
        const parts = date.split('.');
        if (parts.length === 3) {
          const rowYear = parts[2];
          const rowMonth = getMonthsFromDate(date);
          if (rowYear === year && rowMonth === month) {
            let value = row[columnKey] || 'Не указано';
            if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            const strValue = String(value).trim() || 'Не указано';
            stats.set(strValue, (stats.get(strValue) || 0) + 1);
          }
        }
      }
    });
    return Array.from(stats.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getFilterDataByYear = (year, columnKey) => {
    const stats = new Map();
    data.forEach(row => {
      const date = row.column6;
      if (date) {
        const parts = date.split('.');
        if (parts.length === 3) {
          const rowYear = parts[2];
          if (rowYear === year) {
            let value = row[columnKey] || 'Не указано';
            if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            const strValue = String(value).trim() || 'Не указано';
            stats.set(strValue, (stats.get(strValue) || 0) + 1);
          }
        }
      }
    });
    return Array.from(stats.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const studyingData = data.filter(row => {
    const endDate = row.column7;
    if (!endDate) return true;
    const formattedEndDate = endDate.split('.').reverse().join('-');
    return formattedEndDate >= today;
  });

  const allYears = getUniqueYears();

  const activeFiltersCount = getActiveFiltersCount();

  const categories = [
    { 
      id: 'enrollment', 
      label: '1. Зачислены', 
      total: data.length
    },
    { 
      id: 'studying', 
      label: '2. Обучаются', 
      total: studyingData.length
    }
  ];

  const subFilters = {
    enrollment: [
      { id: 'all', label: 'Все', columnKey: 'column6', type: 'all' },
      { id: 'country', label: 'Страна', columnKey: 'column5', type: 'value' },
      { id: 'department', label: 'Кафедра', columnKey: 'column13', type: 'value' },
      { id: 'specialty', label: 'Специальность', columnKey: 'column14', type: 'value' },
      { id: 'university', label: 'ВУЗ', columnKey: 'column11', type: 'value' },
    ],
    studying: [
      { id: 'all', label: 'Все', columnKey: null, type: 'direct' },
      { id: 'country', label: 'По стране', columnKey: 'column5', type: 'direct' },
      { id: 'department', label: 'По кафедре', columnKey: 'column13', type: 'direct' },
      { id: 'specialty', label: 'По специальности', columnKey: 'column14', type: 'direct' },
      { id: 'graduation', label: 'По году окончания', columnKey: 'column12', type: 'direct' },
      { id: 'current_control', label: 'По текущему контролю', columnKey: 'column30', type: 'direct' },
    ]
  };

  const currentCategory = categories.find(c => c.id === activeCategory);
  const currentSubFilters = activeCategory ? subFilters[activeCategory] || [] : [];
  const currentSubFilter = activeSubFilter ? currentSubFilters.find(s => s.id === activeSubFilter) : null;

  const currentYears = allYears;
  const currentMonths = activeYear ? getUniqueMonths(activeYear) : [];
  const currentValues = activeMonth && currentSubFilter?.type === 'value' 
    ? getFilterDataByYearAndMonth(activeYear, activeMonth, currentSubFilter.columnKey)
    : [];
  const currentValuesByYear = activeYear && !activeMonth && currentSubFilter?.type === 'value'
    ? getFilterDataByYear(activeYear, currentSubFilter.columnKey)
    : [];

  const getActiveFilterDisplayValue = (key, values) => {
    if (!values || !Array.isArray(values) || values.length === 0) return null;
    
    if (key === 'column6') {
      const uniqueMonths = new Set();
      values.forEach(date => {
        const parts = date.split('.');
        if (parts.length === 3) {
          const month = getMonthsFromDate(date);
          const year = parts[2];
          uniqueMonths.add(`${month} ${year}`);
        }
      });
      return Array.from(uniqueMonths).join(', ');
    }
    
    return values.join(', ');
  };

  const activeFiltersList = Array.from(currentFilters.entries()).map(([key, values]) => {
    if (!values || !Array.isArray(values) || values.length === 0) return null;
    const columnName = {
      column6: 'Зачислены',
      column11: 'ВУЗ',
      column5: 'Страна',
      column13: 'Кафедра',
      column14: 'Специальность',
      column12: 'Год окончания',
      column30: 'Текущий контроль'
    }[key] || key;
    const displayValue = getActiveFilterDisplayValue(key, values);
    return { key, columnName, displayValue };
  }).filter(Boolean);

  const renderFilterList = (items, columnKey) => {
    if (!items || items.length === 0) {
      return <div className="ColumnFilter-no-results">Нет данных</div>;
    }

    const currentValues = currentFilters.get(columnKey) || [];

    return (
      <div className="ColumnFilter-filter-list">
        {items.map(([value, count]) => {
          const isActive = currentValues.includes(value);
          return (
            <div 
              key={value}
              className={`ColumnFilter-filter-item ${isActive ? 'active' : ''}`}
              onClick={() => handleValueClick(columnKey, value)}
            >
              <span className="ColumnFilter-filter-name">{value}</span>
              <span className="ColumnFilter-filter-count">{count}</span>
              {isActive && (
                <span className="ColumnFilter-filter-check">✓</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearList = () => {
    return (
      <div className="ColumnFilter-filter-list">
        {currentYears.map((year) => {
          const isActive = activeYear === year;
          return (
            <div 
              key={year}
              className={`ColumnFilter-filter-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (isActive) {
                  setActiveYear(null);
                  setActiveMonth(null);
                  if (currentSubFilter?.type === 'all') {
                    onFilterChange('column6', null);
                  } else if (currentSubFilter?.type === 'value') {
                    onFilterChange(currentSubFilter.columnKey, null);
                  }
                } else {
                  setActiveYear(year);
                  setActiveMonth(null);
                  applyYearFilter(year);
                }
              }}
            >
              <span className="ColumnFilter-filter-name">{year}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthList = () => {
    return (
      <div className="ColumnFilter-filter-list">
        {currentMonths.map((month) => {
          const isActive = activeMonth === month;
          return (
            <div 
              key={month}
              className={`ColumnFilter-filter-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (isActive) {
                  setActiveMonth(null);
                  applyYearFilter(activeYear);
                } else {
                  setActiveMonth(month);
                  applyDateFilter(activeYear, month);
                }
              }}
            >
              <span className="ColumnFilter-filter-name">{month}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderValueList = (items) => {
    if (!items || items.length === 0) {
      return <div className="ColumnFilter-no-results">Нет данных</div>;
    }

    const columnKey = currentSubFilter?.columnKey;
    const currentValues = currentFilters.get(columnKey) || [];

    return (
      <div className="ColumnFilter-filter-list">
        {items.map(([value, count]) => {
          const isActive = currentValues.includes(value);
          return (
            <div 
              key={value}
              className={`ColumnFilter-filter-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (currentSubFilter) {
                  if (activeMonth) {
                    applyValueFilterWithDate(columnKey, value, activeYear, activeMonth);
                  } else {
                    applyValueFilterWithYear(columnKey, value, activeYear);
                  }
                }
              }}
            >
              <span className="ColumnFilter-filter-name">{value}</span>
              <span className="ColumnFilter-filter-count">{count}</span>
              {isActive && (
                <span className="ColumnFilter-filter-check">✓</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <button 
        className="ColumnFilter-trigger-button"
        onClick={() => setIsOpen(true)}
        title="Открыть фильтры"
      >
        <Filter size={22} />
        {activeFiltersCount > 0 && (
          <span className="ColumnFilter-trigger-badge">{activeFiltersCount}</span>
        )}
      </button>

      {isOpen && (
        <div 
          className="ColumnFilter-overlay"
          onClick={() => {
            setIsOpen(false);
            setActiveCategory(null);
            setActiveSubFilter(null);
            setActiveYear(null);
            setActiveMonth(null);
          }}
        />
      )}

      <div 
        ref={menuRef}
        className={`ColumnFilter-side-menu ${isOpen ? 'open' : ''}`}
      >
        <div className="ColumnFilter-menu-header">
          <div className="ColumnFilter-menu-title">
            <Filter size={20} />
            <h3>Фильтры</h3>
          </div>
          <button 
            className="ColumnFilter-close-button"
            onClick={() => {
              setIsOpen(false);
              setActiveCategory(null);
              setActiveSubFilter(null);
              setActiveYear(null);
              setActiveMonth(null);
            }}
          >
            <X size={24} />
          </button>
        </div>

        {activeFiltersCount > 0 && (
          <div className="ColumnFilter-active-info">
            <div className="ColumnFilter-active-tags">
              <span className="ColumnFilter-active-label">Активные фильтры:</span>
              {activeFiltersList.map(({ key, columnName, displayValue }) => (
                <span key={key} className="ColumnFilter-active-tag">
                  {columnName}: {displayValue}
                  <button 
                    className="ColumnFilter-active-remove"
                    onClick={() => {
                      onFilterChange(key, null);
                      if (key === 'column6') {
                        setActiveYear(null);
                        setActiveMonth(null);
                      }
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button 
              className="ColumnFilter-clear-all-btn"
              onClick={clearAllFilters}
            >
              Сбросить все
            </button>
          </div>
        )}

        <div className="ColumnFilter-main-menu">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <div key={category.id} className="ColumnFilter-main-item">
                <div 
                  className={`ColumnFilter-main-item-header ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (isActive) {
                      setActiveCategory(null);
                      setActiveSubFilter(null);
                      setActiveYear(null);
                      setActiveMonth(null);
                    } else {
                      setActiveCategory(category.id);
                      setActiveSubFilter(null);
                      setActiveYear(null);
                      setActiveMonth(null);
                      setSearchTerm('');
                    }
                  }}
                >
                  <div className="ColumnFilter-main-item-info">
                    <span className="ColumnFilter-main-item-label">{category.label}</span>
                    <span className="ColumnFilter-main-item-badge">{category.total}</span>
                  </div>
                  <ChevronRight 
                    size={18} 
                    className={`ColumnFilter-main-item-arrow ${isActive ? 'rotated' : ''}`} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        {activeCategory && (
          <div className="ColumnFilter-sub-menu">
            <div 
              className="ColumnFilter-sub-menu-back"
              onClick={() => {
                setActiveCategory(null);
                setActiveSubFilter(null);
                setActiveYear(null);
                setActiveMonth(null);
              }}
            >
              <ChevronLeft size={18} />
              <span>Назад</span>
            </div>
            <div className="ColumnFilter-sub-menu-content">
              <div className="ColumnFilter-sub-menu-title">
                <h4>{categories.find(c => c.id === activeCategory)?.label}</h4>
                <span className="ColumnFilter-sub-menu-count">
                  {categories.find(c => c.id === activeCategory)?.total}
                </span>
              </div>

              <div className="ColumnFilter-sub-categories">
                {currentSubFilters.map((subItem) => {
                  const isActive = activeSubFilter === subItem.id;
                  return (
                    <div 
                      key={subItem.id}
                      className={`ColumnFilter-sub-category-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (isActive) {
                          setActiveSubFilter(null);
                          setActiveYear(null);
                          setActiveMonth(null);
                        } else {
                          setActiveSubFilter(subItem.id);
                          setActiveYear(null);
                          setActiveMonth(null);
                          setSearchTerm('');
                        }
                      }}
                    >
                      <span className="ColumnFilter-sub-category-label">{subItem.label}</span>
                      <ChevronRight size={16} className={`ColumnFilter-sub-category-arrow ${isActive ? 'rotated' : ''}`} />
                    </div>
                  );
                })}
              </div>

              {currentSubFilter && (
                <div className="ColumnFilter-sub-sub-menu">
                  <div 
                    className="ColumnFilter-sub-sub-back"
                    onClick={() => {
                      setActiveSubFilter(null);
                      setActiveYear(null);
                      setActiveMonth(null);
                    }}
                  >
                    <ChevronLeft size={16} />
                    <span>Назад</span>
                  </div>
                  <div className="ColumnFilter-sub-sub-content">
                    <div className="ColumnFilter-sub-sub-title">
                      <h5>{currentSubFilter.label}</h5>
                    </div>

                    {currentSubFilter.type === 'all' && !activeYear && (
                      <div className="ColumnFilter-filter-list-wrapper">
                        <div className="ColumnFilter-search-wrapper">
                          <Search size={14} className="ColumnFilter-search-icon" />
                          <input
                            type="text"
                            className="ColumnFilter-search-input"
                            placeholder="Поиск года..."
                            value={yearSearchTerm}
                            onChange={(e) => setYearSearchTerm(e.target.value)}
                          />
                        </div>
                        {renderYearList()}
                      </div>
                    )}

                    {currentSubFilter.type === 'all' && activeYear && !activeMonth && (
                      <div className="ColumnFilter-filter-list-wrapper">
                        <div className="ColumnFilter-breadcrumb">
                          <span className="ColumnFilter-breadcrumb-item" onClick={() => setActiveYear(null)}>
                            {activeYear}
                          </span>
                          <span className="ColumnFilter-breadcrumb-separator">/</span>
                          <span className="ColumnFilter-breadcrumb-item active">Месяц</span>
                        </div>
                        <div className="ColumnFilter-search-wrapper">
                          <Search size={14} className="ColumnFilter-search-icon" />
                          <input
                            type="text"
                            className="ColumnFilter-search-input"
                            placeholder="Поиск месяца..."
                            value={monthSearchTerm}
                            onChange={(e) => setMonthSearchTerm(e.target.value)}
                          />
                        </div>
                        {renderMonthList()}
                      </div>
                    )}

                    {currentSubFilter.type === 'value' && !activeYear && (
                      <div className="ColumnFilter-filter-list-wrapper">
                        <div className="ColumnFilter-search-wrapper">
                          <Search size={14} className="ColumnFilter-search-icon" />
                          <input
                            type="text"
                            className="ColumnFilter-search-input"
                            placeholder="Поиск года..."
                            value={yearSearchTerm}
                            onChange={(e) => setYearSearchTerm(e.target.value)}
                          />
                        </div>
                        {renderYearList()}
                      </div>
                    )}

                    {currentSubFilter.type === 'value' && activeYear && !activeMonth && (
                      <div className="ColumnFilter-filter-list-wrapper">
                        <div className="ColumnFilter-breadcrumb">
                          <span className="ColumnFilter-breadcrumb-item" onClick={() => setActiveYear(null)}>
                            {activeYear}
                          </span>
                          <span className="ColumnFilter-breadcrumb-separator">/</span>
                          <span className="ColumnFilter-breadcrumb-item active">Месяц</span>
                        </div>
                        <div className="ColumnFilter-search-wrapper">
                          <Search size={14} className="ColumnFilter-search-icon" />
                          <input
                            type="text"
                            className="ColumnFilter-search-input"
                            placeholder="Поиск месяца..."
                            value={monthSearchTerm}
                            onChange={(e) => setMonthSearchTerm(e.target.value)}
                          />
                        </div>
                        {renderMonthList()}
                      </div>
                    )}

                    {currentSubFilter.type === 'value' && activeYear && activeMonth && (
                      <div className="ColumnFilter-filter-list-wrapper">
                        <div className="ColumnFilter-breadcrumb">
                          <span className="ColumnFilter-breadcrumb-item" onClick={() => setActiveYear(null)}>
                            {activeYear}
                          </span>
                          <span className="ColumnFilter-breadcrumb-separator">/</span>
                          <span className="ColumnFilter-breadcrumb-item" onClick={() => setActiveMonth(null)}>
                            {activeMonth}
                          </span>
                          <span className="ColumnFilter-breadcrumb-separator">/</span>
                          <span className="ColumnFilter-breadcrumb-item active">{currentSubFilter.label}</span>
                        </div>
                        <div className="ColumnFilter-search-wrapper">
                          <Search size={14} className="ColumnFilter-search-icon" />
                          <input
                            type="text"
                            className="ColumnFilter-search-input"
                            placeholder={`Поиск по ${currentSubFilter.label.toLowerCase()}...`}
                            value={valueSearchTerm}
                            onChange={(e) => setValueSearchTerm(e.target.value)}
                          />
                        </div>
                        {renderValueList(
                          currentValues.filter(([value]) => value.toLowerCase().includes(valueSearchTerm.toLowerCase()))
                        )}
                      </div>
                    )}

                    {currentSubFilter.type === 'direct' && (
                      <div className="ColumnFilter-filter-list-wrapper">
                        <div className="ColumnFilter-search-wrapper">
                          <Search size={14} className="ColumnFilter-search-icon" />
                          <input
                            type="text"
                            className="ColumnFilter-search-input"
                            placeholder="Поиск..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        {renderFilterList(
                          getFilterData(currentSubFilter.columnKey)
                            .filter(([value]) => value.toLowerCase().includes(searchTerm.toLowerCase())),
                          currentSubFilter.columnKey
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="ColumnFilter-menu-footer">
          <span>Всего: {data.length} ординаторов</span>
          <span>Активных фильтров: {activeFiltersCount}</span>
        </div>
      </div>
    </>
  );
};

export default ColumnFilter;