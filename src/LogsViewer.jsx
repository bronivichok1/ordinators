import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  ArrowLeft, 
  Trash2, 
  Download,
  Eye,
  FileSpreadsheet,
  CheckSquare,
  Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './LogsViewer.css';

const LogsViewer = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageSize] = useState(50);
  
  const [filters, setFilters] = useState({
    userId: '',
    actionType: '',
    userRole: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/');
        return;
      }

      const activeFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          activeFilters[key] = filters[key];
        }
      });

      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...activeFilters
      });

      const response = await fetch(`${API_URL}/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        navigate('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Ошибка загрузки логов');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
      setSelectedLogs(new Set());
      setSelectAll(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters.userId, filters.actionType, filters.userRole, filters.startDate, filters.endDate, filters.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.userId, filters.actionType, filters.userRole, filters.startDate, filters.endDate, filters.search]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      userId: '',
      actionType: '',
      userRole: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleSelectLog = (logId) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
    setSelectAll(newSelected.size === logs.length && logs.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLogs(new Set());
    } else {
      const newSelected = new Set(logs.map(log => log.id));
      setSelectedLogs(newSelected);
    }
    setSelectAll(!selectAll);
  };

  const handleCleanup = async () => {
    if (!window.confirm('Удалить логи старше 30 дней? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/logs/cleanup?days=30`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchLogs();
      }
    } catch (err) {
      alert('Ошибка при очистке логов');
    }
  };

  const exportToExcel = () => {
    try {
      // Определяем, какие логи экспортировать
      const logsToExport = selectedLogs.size > 0 
        ? logs.filter(log => selectedLogs.has(log.id))
        : logs;

      if (logsToExport.length === 0) {
        alert('Нет записей для экспорта');
        return;
      }

      const exportData = logsToExport.map(log => ({
        'ID': log.id,
        'Дата и время': new Date(log.timestamp).toLocaleString('ru-RU'),
        'Пользователь': log.userFio || log.userId || 'Аноним',
        'Роль': log.userRole === 'admin' ? 'Администратор' :
                log.userRole === 'dispatcher' ? 'Диспетчер' :
                log.userRole === 'passportist' ? 'Паспортист' :
                log.userRole === 'supervisor' ? 'Руководитель' : log.userRole || '-',
        'Действие': log.actionType,
        'Описание': log.description || '-',
        'IP адрес': log.ipAddress || '-',
        'Страница': log.page || '-',
        'Детали': log.details || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Логи');
      
      const fileName = `логи_${new Date().toISOString().split('T')[0]}${selectedLogs.size > 0 ? `_${selectedLogs.size}записей` : ''}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error);
      alert('Ошибка при экспорте в Excel');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRoleClass = (role) => {
    switch(role) {
      case 'admin': return 'role-admin';
      case 'dispatcher': return 'role-dispatcher';
      case 'passportist': return 'role-passportist';
      case 'supervisor': return 'role-supervisor';
      default: return '';
    }
  };

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isAdmin = userData.role === 'admin';

  return (
    <div className="logs-container">
      <div className="logs-header">
        <div className="logs-title">
          <h1>Просмотр логов системы</h1>
          <p>Журнал действий пользователей</p>
        </div>
        
        <div className="logs-actions">
          <button 
            className="back-button-logs"
            onClick={() => navigate('/main')}
            disabled={loading}
          >
            <ArrowLeft size={16} />
            Назад
          </button>
          
          <button 
            className="refresh-button-logs"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Обновить
          </button>
          
          <button 
            className="export-excel-button-logs"
            onClick={exportToExcel}
            disabled={logs.length === 0}
          >
            <FileSpreadsheet size={16} />
            Excel {selectedLogs.size > 0 ? `(${selectedLogs.size})` : ''}
          </button>
          
          {isAdmin && (
            <button 
              className="cleanup-button-logs"
              onClick={handleCleanup}
              disabled={loading}
            >
              <Trash2 size={16} />
              Очистить
            </button>
          )}
        </div>
      </div>

      <div className="filters-panel">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Поиск по описанию</label>
            <input
              type="text"
              placeholder="Поиск в описании..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Тип действия</label>
            <input
              type="text"
              placeholder="Например: CREATE_ORDINATOR"
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Роль пользователя</label>
            <select
              value={filters.userRole}
              onChange={(e) => handleFilterChange('userRole', e.target.value)}
            >
              <option value="">Все роли</option>
              <option value="admin">Администратор</option>
              <option value="dispatcher">Диспетчер</option>
              <option value="passportist">Паспортист</option>
              <option value="supervisor">Руководитель</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>ID пользователя</label>
            <input
              type="number"
              placeholder="ID пользователя"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Дата с</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Дата по</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button className="reset-filters-button" onClick={resetFilters}>
            Сбросить все фильтры
          </button>
        </div>
      </div>

      <div className="logs-info">
        <p>Найдено записей: {totalLogs}</p>
        {selectedLogs.size > 0 && (
          <p className="selected-count">Выбрано: {selectedLogs.size}</p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="logs-table-container">
        {loading ? (
          <div className="loading-spinner">Загрузка логов...</div>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <button 
                    className="select-all-button"
                    onClick={handleSelectAll}
                    title={selectAll ? 'Снять выделение' : 'Выделить все'}
                  >
                    {selectAll ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th>ID</th>
                <th>Дата и время</th>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Действие</th>
                <th>Описание</th>
                <th>Детали</th>
                <th>IP адрес</th>
                <th>Страница</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                    Логи не найдены
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr 
                    key={log.id} 
                    className={selectedLogs.has(log.id) ? 'selected-row' : ''}
                  >
                    <td className="checkbox-column">
                      <button 
                        className="select-row-button"
                        onClick={() => handleSelectLog(log.id)}
                      >
                        {selectedLogs.has(log.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td>{log.id}</td>
                    <td>{formatDate(log.timestamp)}</td>
                    <td>{log.userFio || log.userId || 'Аноним'}</td>
                    <td>
                      {log.userRole && (
                        <span className={`role-badge-log ${getRoleClass(log.userRole)}`}>
                          {log.userRole === 'admin' ? 'Админ' :
                           log.userRole === 'dispatcher' ? 'Диспетчер' :
                           log.userRole === 'passportist' ? 'Паспортист' :
                           log.userRole === 'supervisor' ? 'Руководитель' : log.userRole}
                        </span>
                      )}
                    </td>
                    <td className="action-type">{log.actionType}</td>
                    <td>{log.description || '-'}</td>
                    <td>
                      {log.details && (
                        <button
                          className="details-cell"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye size={16} />
                          Просмотр
                        </button>
                      )}
                    </td>
                    <td>{log.ipAddress || '-'}</td>
                    <td>{log.page || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
          >
            ←
          </button>
          <span>Страница {currentPage} из {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loading}
          >
            →
          </button>
        </div>
      )}

      {showDetailsModal && selectedLog && (
        <div className="details-modal" onClick={() => setShowDetailsModal(false)}>
          <div className="details-modal-content" onClick={e => e.stopPropagation()}>
            <div className="details-modal-header">
              <h3>Детали лога #{selectedLog.id}</h3>
              <button className="details-modal-close" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>
            <div className="details-modal-body">
              <p><strong>Дата:</strong> {formatDate(selectedLog.timestamp)}</p>
              <p><strong>Пользователь:</strong> {selectedLog.userFio || selectedLog.userId || 'Аноним'}</p>
              <p><strong>Роль:</strong> {selectedLog.userRole || '-'}</p>
              <p><strong>Действие:</strong> {selectedLog.actionType}</p>
              <p><strong>Описание:</strong> {selectedLog.description || '-'}</p>
              <p><strong>IP адрес:</strong> {selectedLog.ipAddress || '-'}</p>
              <p><strong>User Agent:</strong> {selectedLog.userAgent || '-'}</p>
              <p><strong>Страница:</strong> {selectedLog.page || '-'}</p>
              <p><strong>Детали:</strong></p>
              <pre>{JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsViewer;