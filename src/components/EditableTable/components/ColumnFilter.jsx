import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, X, Filter, Search, Users, Columns, ChevronLeft } from 'lucide-react';
import '../styles/ColumnFilter.css';

const ColumnFilter = ({
  data,
  onFilterChange,
  currentFilters,
  columns
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null); // 'ordinators', 'columns'
  const [activeSubSubMenu, setActiveSubSubMenu] = useState(null); // 'rb', 'in'
  const [activeColumn, setActiveColumn] = useState(null);
  const [columnStats, setColumnStats] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const stats = new Map();
    
    columns.forEach(col => {
      const colStats = new Map();
      data.forEach(row => {
        let value = row[col.key] || 'Не указано';
        if (col.key === 'column16') {
          value = formatPreparationForm(value);
        }
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        const strValue = String(value).trim() || 'Не указано';
        colStats.set(strValue, (colStats.get(strValue) || 0) + 1);
      });
      stats.set(col.key, colStats);
    });
    
    setColumnStats(stats);
  }, [data, columns]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubMenu(null);
        setActiveSubSubMenu(null);
        setActiveColumn(null);
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

  const handleColumnClick = (columnKey) => {
    setActiveColumn(activeColumn === columnKey ? null : columnKey);
    setFilterSearchTerm('');
  };

  const handleValueClick = (columnKey, value) => {
    const currentFilter = currentFilters.get(columnKey);
    if (currentFilter === value) {
      onFilterChange(columnKey, null);
    } else {
      onFilterChange(columnKey, value);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    currentFilters.forEach((value) => {
      if (value) count++;
    });
    return count;
  };

  const clearAllFilters = () => {
    currentFilters.forEach((_, key) => {
      onFilterChange(key, null);
    });
  };

  const formatPreparationForm = (value) => {
    if (!value) return '';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      const yearMatch = value.match(/\d{4}/);
      return yearMatch ? yearMatch[0] : value;
    }
    return String(value);
  };

  // Фильтрация колонок по поиску
  const filteredColumns = columns.filter(col => 
    col.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ПОЛУЧЕНИЕ СТРАНЫ ИЗ 5-Й КОЛОНКИ (column5)
  const getCountryFromRow = (row) => {
    const countryValue = row.column5 || '';
    const countryStr = String(countryValue).trim();
    
    if (!countryStr) return 'Не указана';
    
    // Проверяем на Беларусь (разные варианты написания)
    if (countryStr.toLowerCase().includes('беларусь') || 
        countryStr.toLowerCase().includes('belarus') || 
        countryStr === 'рб' ||
        countryStr === 'республика беларусь') {
      return 'Беларусь';
    }
    
    // Все остальные страны
    return countryStr;
  };

  // Проверка является ли ординатор из Беларуси
  const isBelarus = (row) => {
    return getCountryFromRow(row) === 'Беларусь';
  };

  // Проверка является ли ординатор иностранцем (не Беларусь)
  const isForeign = (row) => {
    const country = getCountryFromRow(row);
    return country !== 'Беларусь' && country !== 'Не указана';
  };

  // Получение списка ординаторов по типу
  const getOrdinatorsByType = (type) => {
    if (type === 'rb') {
      return data.filter(row => isBelarus(row));
    } else if (type === 'in') {
      // Все, кто не из Беларуси (включая все другие страны)
      return data.filter(row => !isBelarus(row) && getCountryFromRow(row) !== 'Не указана');
    }
    return data;
  };

  // Получение уникальных стран (для отображения в статистике)
  const getUniqueCountries = (groupData) => {
    const countries = new Set();
    groupData.forEach(row => {
      const country = getCountryFromRow(row);
      if (country !== 'Беларусь' && country !== 'Не указана') {
        countries.add(country);
      }
    });
    return Array.from(countries).sort();
  };

  // Получение уникальных кафедр для определенной группы
  const getDepartmentsForGroup = (groupData) => {
    const depts = new Map();
    groupData.forEach(row => {
      const dept = row.column30 || 'Не указана';
      depts.set(dept, (depts.get(dept) || 0) + 1);
    });
    return Array.from(depts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const activeFiltersCount = getActiveFiltersCount();
  const rbOrdinators = getOrdinatorsByType('rb');
  const inOrdinators = getOrdinatorsByType('in');
  const uniqueCountries = getUniqueCountries(inOrdinators);

  // Обработчик выбора подменю
  const handleSubMenuOpen = (menu) => {
    setActiveSubMenu(activeSubMenu === menu ? null : menu);
    setActiveSubSubMenu(null);
    setActiveColumn(null);
  };

  // Обработчик выбора под-подменю (РБ или ИН)
  const handleSubSubMenuOpen = (subMenu) => {
    setActiveSubSubMenu(activeSubSubMenu === subMenu ? null : subMenu);
    setActiveColumn(null);
  };

  // Применение фильтра по стране
  const applyCountryFilter = (type) => {
    if (type === 'rb') {
      const current = currentFilters.get('column5');
      if (current === 'Беларусь') {
        onFilterChange('column5', null);
      } else {
        onFilterChange('column5', 'Беларусь');
      }
    } else if (type === 'in') {
      // Для иностранцев - показываем всех, у кого страна не Беларусь
      // Используем специальный фильтр "Не Беларусь"
      const current = currentFilters.get('column5');
      if (current === 'Иностранцы') {
        onFilterChange('column5', null);
      } else {
        onFilterChange('column5', 'Иностранцы');
      }
    }
  };

  // Проверка активного фильтра по стране
  const isCountryFilterActive = (type) => {
    if (type === 'rb') {
      return currentFilters.get('column5') === 'Беларусь';
    } else if (type === 'in') {
      return currentFilters.get('column5') === 'Иностранцы';
    }
    return false;
  };

  return (
    <>
      {/* Кнопка-триггер */}
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

      {/* Затемнение фона */}
      {isOpen && (
        <div 
          className="ColumnFilter-overlay"
          onClick={() => {
            setIsOpen(false);
            setActiveSubMenu(null);
            setActiveSubSubMenu(null);
            setActiveColumn(null);
          }}
        />
      )}

      {/* Боковое меню */}
      <div 
        ref={menuRef}
        className={`ColumnFilter-side-menu ${isOpen ? 'open' : ''}`}
      >
        {/* Заголовок */}
        <div className="ColumnFilter-menu-header">
          <div className="ColumnFilter-menu-title">
            <Filter size={20} />
            <h3>Фильтры</h3>
          </div>
          <button 
            className="ColumnFilter-close-button"
            onClick={() => {
              setIsOpen(false);
              setActiveSubMenu(null);
              setActiveSubSubMenu(null);
              setActiveColumn(null);
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Информация о фильтрах */}
        {activeFiltersCount > 0 && (
          <div className="ColumnFilter-active-info">
            <span className="ColumnFilter-active-count">
              Активных фильтров: {activeFiltersCount}
            </span>
            <button 
              className="ColumnFilter-clear-all-btn"
              onClick={clearAllFilters}
            >
              Сбросить все
            </button>
          </div>
        )}

        {/* Основное меню */}
        <div className="ColumnFilter-main-menu">
          {/* Пункт 1: Ординаторы */}
          <div className="ColumnFilter-main-item">
            <div 
              className={`ColumnFilter-main-item-header ${activeSubMenu === 'ordinators' ? 'active' : ''}`}
              onClick={() => handleSubMenuOpen('ordinators')}
            >
              <div className="ColumnFilter-main-item-info">
                <Users size={18} className="ColumnFilter-main-item-icon" />
                <span className="ColumnFilter-main-item-label">Ординаторы</span>
                <span className="ColumnFilter-main-item-badge">{data.length}</span>
              </div>
              <ChevronRight size={18} className="ColumnFilter-main-item-arrow" />
            </div>
          </div>

          {/* Пункт 2: Колонки */}
          <div className="ColumnFilter-main-item">
            <div 
              className={`ColumnFilter-main-item-header ${activeSubMenu === 'columns' ? 'active' : ''}`}
              onClick={() => handleSubMenuOpen('columns')}
            >
              <div className="ColumnFilter-main-item-info">
                <Columns size={18} className="ColumnFilter-main-item-icon" />
                <span className="ColumnFilter-main-item-label">Колонки</span>
                <span className="ColumnFilter-main-item-badge">{columns.length}</span>
              </div>
              <ChevronRight size={18} className="ColumnFilter-main-item-arrow" />
            </div>
          </div>
        </div>

        {/* Подменю */}
        {activeSubMenu && (
          <div className="ColumnFilter-sub-menu">
            {/* Кнопка назад */}
            <div 
              className="ColumnFilter-sub-menu-back"
              onClick={() => {
                setActiveSubMenu(null);
                setActiveSubSubMenu(null);
              }}
            >
              <ChevronLeft size={18} />
              <span>Назад</span>
            </div>

            {/* Подменю: Ординаторы */}
            {activeSubMenu === 'ordinators' && (
              <div className="ColumnFilter-sub-menu-content">
                {/* Подпункт 1: Ординаторы РБ */}
                <div 
                  className={`ColumnFilter-sub-sub-item ${activeSubSubMenu === 'rb' ? 'active' : ''}`}
                  onClick={() => handleSubSubMenuOpen('rb')}
                >
                  <div className="ColumnFilter-sub-sub-info">
                    <span className="ColumnFilter-sub-sub-label">Ординаторы РБ</span>
                    <span className="ColumnFilter-sub-sub-badge">{rbOrdinators.length}</span>
                  </div>
                  <ChevronRight size={16} className="ColumnFilter-sub-sub-arrow" />
                </div>

                {/* Подпункт 2: Ординаторы ИН (все остальные страны) */}
                <div 
                  className={`ColumnFilter-sub-sub-item ${activeSubSubMenu === 'in' ? 'active' : ''}`}
                  onClick={() => handleSubSubMenuOpen('in')}
                >
                  <div className="ColumnFilter-sub-sub-info">
                    <span className="ColumnFilter-sub-sub-label">Ординаторы ИН</span>
                    <span className="ColumnFilter-sub-sub-badge">{inOrdinators.length}</span>
                  </div>
                  <ChevronRight size={16} className="ColumnFilter-sub-sub-arrow" />
                </div>

                {/* Под-подменю: РБ */}
                {activeSubSubMenu === 'rb' && (
                  <div className="ColumnFilter-sub-sub-menu">
                    <div 
                      className="ColumnFilter-sub-sub-back"
                      onClick={() => setActiveSubSubMenu(null)}
                    >
                      <ChevronLeft size={16} />
                      <span>Назад к ординаторам</span>
                    </div>
                    <div className="ColumnFilter-sub-sub-content">
                      <div className="ColumnFilter-sub-sub-header">
                        <h4>Ординаторы РБ</h4>
                        <span className="ColumnFilter-sub-sub-count">{rbOrdinators.length}</span>
                      </div>

                      {/* Кнопка показать всех */}
                      <button 
                        className={`ColumnFilter-quick-filter ${isCountryFilterActive('rb') ? 'active' : ''}`}
                        onClick={() => applyCountryFilter('rb')}
                      >
                        {isCountryFilterActive('rb') ? '✓ ' : ''}Показать всех ординаторов РБ
                      </button>

                      {/* Статистика */}
                      <div className="ColumnFilter-stats-grid">
                        <div className="ColumnFilter-stat-card">
                          <span className="ColumnFilter-stat-label">Всего</span>
                          <span className="ColumnFilter-stat-number">{rbOrdinators.length}</span>
                        </div>
                        <div className="ColumnFilter-stat-card">
                          <span className="ColumnFilter-stat-label">На кафедрах</span>
                          <span className="ColumnFilter-stat-number">
                            {rbOrdinators.filter(row => row.column30 && row.column30 !== '').length}
                          </span>
                        </div>
                      </div>

                      {/* Список кафедр */}
                      <div className="ColumnFilter-sub-menu-divider">Кафедры</div>
                      <div className="ColumnFilter-department-list">
                        {getDepartmentsForGroup(rbOrdinators).map(([dept, count]) => {
                          const isActive = currentFilters.get('column30') === dept;
                          return (
                            <div 
                              key={dept}
                              className={`ColumnFilter-department-item ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                if (isActive) {
                                  onFilterChange('column30', null);
                                } else {
                                  onFilterChange('column30', dept);
                                }
                              }}
                            >
                              <span className="ColumnFilter-department-name">{dept}</span>
                              <span className="ColumnFilter-department-count">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Под-подменю: ИН (все остальные страны) */}
                {activeSubSubMenu === 'in' && (
                  <div className="ColumnFilter-sub-sub-menu">
                    <div 
                      className="ColumnFilter-sub-sub-back"
                      onClick={() => setActiveSubSubMenu(null)}
                    >
                      <ChevronLeft size={16} />
                      <span>Назад к ординаторам</span>
                    </div>
                    <div className="ColumnFilter-sub-sub-content">
                      <div className="ColumnFilter-sub-sub-header">
                        <h4>Ординаторы ИН</h4>
                        <span className="ColumnFilter-sub-sub-count">{inOrdinators.length}</span>
                      </div>

                      {/* Кнопка показать всех */}
                      <button 
                        className={`ColumnFilter-quick-filter ${isCountryFilterActive('in') ? 'active' : ''}`}
                        onClick={() => applyCountryFilter('in')}
                      >
                        {isCountryFilterActive('in') ? '✓ ' : ''}Показать всех иностранцев
                      </button>

                      {/* Статистика по странам */}
                      <div className="ColumnFilter-sub-menu-divider">Страны</div>
                      <div className="ColumnFilter-country-list">
                        {uniqueCountries.map(country => {
                          const count = inOrdinators.filter(row => getCountryFromRow(row) === country).length;
                          const isActive = currentFilters.get('column5') === country;
                          return (
                            <div 
                              key={country}
                              className={`ColumnFilter-country-item ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                if (isActive) {
                                  onFilterChange('column5', null);
                                } else {
                                  onFilterChange('column5', country);
                                }
                              }}
                            >
                              <span className="ColumnFilter-country-name">{country}</span>
                              <span className="ColumnFilter-country-count">{count}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Статистика */}
                      <div className="ColumnFilter-stats-grid">
                        <div className="ColumnFilter-stat-card">
                          <span className="ColumnFilter-stat-label">Всего иностранцев</span>
                          <span className="ColumnFilter-stat-number">{inOrdinators.length}</span>
                        </div>
                        <div className="ColumnFilter-stat-card">
                          <span className="ColumnFilter-stat-label">На кафедрах</span>
                          <span className="ColumnFilter-stat-number">
                            {inOrdinators.filter(row => row.column30 && row.column30 !== '').length}
                          </span>
                        </div>
                      </div>

                      {/* Список кафедр */}
                      <div className="ColumnFilter-sub-menu-divider">Кафедры</div>
                      <div className="ColumnFilter-department-list">
                        {getDepartmentsForGroup(inOrdinators).map(([dept, count]) => {
                          const isActive = currentFilters.get('column30') === dept;
                          return (
                            <div 
                              key={dept}
                              className={`ColumnFilter-department-item ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                if (isActive) {
                                  onFilterChange('column30', null);
                                } else {
                                  onFilterChange('column30', dept);
                                }
                              }}
                            >
                              <span className="ColumnFilter-department-name">{dept}</span>
                              <span className="ColumnFilter-department-count">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Подменю: Колонки */}
            {activeSubMenu === 'columns' && (
              <div className="ColumnFilter-sub-menu-content">
                <div className="ColumnFilter-sub-menu-title">
                  <Columns size={18} />
                  <h4>Фильтр по колонкам</h4>
                </div>

                {/* Поиск по колонкам */}
                <div className="ColumnFilter-search-wrapper">
                  <Search size={16} className="ColumnFilter-search-icon" />
                  <input
                    type="text"
                    className="ColumnFilter-search-input"
                    placeholder="Поиск колонки..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Список колонок */}
                <div className="ColumnFilter-columns-list">
                  {filteredColumns.length === 0 ? (
                    <div className="ColumnFilter-no-results">Колонки не найдены</div>
                  ) : (
                    filteredColumns.map((col) => {
                      const stats = columnStats.get(col.key);
                      const activeFilter = currentFilters.get(col.key);
                      const isActive = activeColumn === col.key;
                      const totalValues = stats ? stats.size : 0;

                      return (
                        <div key={col.key} className="ColumnFilter-column-item">
                          <div 
                            className={`ColumnFilter-column-header ${activeFilter ? 'has-filter' : ''}`}
                            onClick={() => handleColumnClick(col.key)}
                          >
                            <div className="ColumnFilter-column-info">
                              <span className="ColumnFilter-column-name">{col.label}</span>
                              {activeFilter && (
                                <span className="ColumnFilter-column-active-value">
                                  {activeFilter.length > 20 ? activeFilter.substring(0, 20) + '...' : activeFilter}
                                </span>
                              )}
                              <span className="ColumnFilter-column-count">{totalValues} значений</span>
                            </div>
                            <ChevronRight 
                              size={16} 
                              className={`ColumnFilter-column-chevron ${isActive ? 'rotated' : ''}`}
                            />
                          </div>

                          {isActive && stats && (
                            <div className="ColumnFilter-column-values">
                              <div className="ColumnFilter-value-search-wrapper">
                                <input
                                  type="text"
                                  className="ColumnFilter-value-search"
                                  placeholder="Поиск значений..."
                                  value={filterSearchTerm}
                                  onChange={(e) => setFilterSearchTerm(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="ColumnFilter-values-list">
                                {Array.from(stats.entries())
                                  .filter(([value]) => 
                                    value.toLowerCase().includes(filterSearchTerm.toLowerCase())
                                  )
                                  .sort((a, b) => a[0].localeCompare(b[0]))
                                  .map(([value, count]) => {
                                    const isSelected = activeFilter === value;
                                    return (
                                      <div 
                                        key={value}
                                        className={`ColumnFilter-value-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleValueClick(col.key, value)}
                                      >
                                        <span className="ColumnFilter-value-name">{value}</span>
                                        <span className="ColumnFilter-value-count">{count}</span>
                                        {isSelected && (
                                          <span className="ColumnFilter-value-check">✓</span>
                                        )}
                                      </div>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="ColumnFilter-menu-footer">
          <span>Всего: {data.length} ординаторов</span>
          <span>Активных фильтров: {activeFiltersCount}</span>
        </div>
      </div>
    </>
  );
};

export default ColumnFilter;