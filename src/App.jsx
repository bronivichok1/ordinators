import './App.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, Eye, EyeOff, LogIn, UserPlus,
  Mail, Users, Shield, ArrowLeft, LogOut,
  Edit, Trash2, Save, Table, KeyRound, XCircle,
  FileText, Settings
} from 'lucide-react';

const api = {
  async request(endpoint, options = {}) {
    const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include'
    });
    return response;
  },

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    return { ok: response.ok, data };
  },

  async register(userData, token) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  async getUsers(token) {
    const response = await this.request('/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async updateUser(id, userData, token) {
    const response = await this.request(`/users/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData)
    });
    return response.ok;
  },

  async deleteUser(id, token) {
    const response = await this.request(`/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  }
};

const Message = ({ text, type }) => {
  if (!text) return null;
  return <div className={`message ${type}`}>{text}</div>;
};

const PasswordInput = ({ value, onChange, placeholder, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field-wrapper">
      <div className="input-wrapper">
        <input 
          type={show ? 'text' : 'password'}
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
        />
      </div>
      <button type="button" className="password-toggle-button" onClick={() => setShow(!show)} disabled={disabled}>
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};

const UserTableRow = ({ user, onEdit, onDelete, loading }) => {
  const roleNames = {
    admin: 'Администратор',
    dispatcher: 'Диспетчер',
    passportist: 'Паспортист',
    supervisor: 'Руководитель'
  };

  return (
    <div className="table-row-app">
      <div>{user.id}</div>
      <div>{user.fio}</div>
      <div>{user.login}</div>
      <div className="role-div">
        <span className="role-badge-app">{roleNames[user.role] || 'Пользователь'}</span>
      </div>
      <div className="actions">
        <button className="action-button edit-button" onClick={() => onEdit(user)} disabled={loading}>
          <Edit size={16} /> Изменить
        </button>
        <button className="action-button delete-button" onClick={() => onDelete(user.id)} disabled={loading}>
          <Trash2 size={16} /> Удалить
        </button>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin, loading, message }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container"><div className="logo"><LogIn size={32} /></div></div>
          <h1 className="auth-title">Авторизация</h1>
        </div>

        <Message text={message.text} type={message.type} />

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label"><User size={18} /><span>Логин</span></label>
            <div className="input-wrapper">
              <input type="text" className="input-field" placeholder="Введите логин"
                value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                required disabled={loading} />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label"><Lock size={18} /><span>Пароль</span></label>
            <PasswordInput
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Введите пароль"
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="submitauth-button" disabled={loading}>
            <LogIn size={20} /><span>{loading ? 'Вход...' : 'Войти'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const RegisterPage = ({ onRegister, onBack, loading, message }) => {
  const [formData, setFormData] = useState({ fio: '', login: '', password: '', confirmPassword: '', role: 'user' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    if (formData.password.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }
    onRegister(formData);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container"><div className="logo"><UserPlus size={32} /></div></div>
          <h1 className="auth-title">Регистрация нового пользователя</h1>
        </div>

        <Message text={message.text} type={message.type} />

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label"><Users size={18} /><span>ФИО</span></label>
            <input type="text" className="input-field" placeholder="ФИО полностью"
              value={formData.fio} onChange={(e) => setFormData({...formData, fio: e.target.value})}
              required disabled={loading} />
          </div>

          <div className="input-group">
            <label className="input-label"><Mail size={18} /><span>Логин</span></label>
            <input type="text" className="input-field" placeholder="Логин"
              value={formData.login} onChange={(e) => setFormData({...formData, login: e.target.value})}
              required disabled={loading} />
          </div>

          <div className="input-group">
            <label className="input-label"><Lock size={18} /><span>Пароль</span></label>
            <PasswordInput
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Пароль (минимум 6 символов)"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label className="input-label"><Lock size={18} /><span>Подтверждение пароля</span></label>
            <PasswordInput
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Повторите пароль"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label className="input-label"><Shield size={18} /><span>Роль</span></label>
            <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} disabled={loading}>
              <option value="admin">Администратор</option>
              <option value="dispatcher">Диспетчер</option>
              <option value="passportist">Паспортист</option>
              <option value="supervisor">Руководитель</option>
            </select>
          </div>

          <button type="submit" className="submitauth-button" disabled={loading}>
            <UserPlus size={20} /><span>{loading ? 'Регистрация...' : 'Зарегистрировать'}</span>
          </button>
          
          <div className="auth-footer">
            <div className="register-actions">
              <button className="back-button" onClick={onBack} disabled={loading}>
                <ArrowLeft size={16} /><span>Назад к списку</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditUserModal = ({ user, onSave, onClose, loading, message }) => {
  const [formData, setFormData] = useState({ fio: '', login: '', role: 'user', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fio: user.fio || '',
        login: user.login || '',
        role: user.role || 'user',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }
    onSave(formData);
  };

  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="edit-user-modal">
        <div className="modal-header">
          <h2>Редактирование пользователя</h2>
          <button onClick={onClose} className="close-button"><XCircle size={24} /></button>
        </div>
        
        <div className="modal-content">
          <Message text={message.text} type={message.type} />
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label"><Users size={18} /><span>ФИО</span></label>
              <input type="text" className="input-field" placeholder="ФИО полностью"
                value={formData.fio} onChange={(e) => setFormData({...formData, fio: e.target.value})}
                required disabled={loading} />
            </div>

            <div className="input-group">
              <label className="input-label"><Mail size={18} /><span>Логин</span></label>
              <input type="text" className="input-field" placeholder="Логин"
                value={formData.login} onChange={(e) => setFormData({...formData, login: e.target.value})}
                required disabled={loading} />
            </div>

            <div className="input-group">
              <label className="input-label"><Shield size={18} /><span>Роль</span></label>
              <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} disabled={loading}>
                <option value="admin">Администратор</option>
                <option value="dispatcher">Диспетчер</option>
                <option value="passportist">Паспортист</option>
                <option value="supervisor">Руководитель</option>
              </select>
            </div>

            <div className="input-group">
              <div className="password-change-header">
                <label className="input-label"><KeyRound size={18} /><span>Сменить пароль</span></label>
                <button type="button" className="toggle-password-button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Скрыть' : 'Изменить пароль'}
                </button>
              </div>
              
              {showPassword && (
                <>
                  <PasswordInput
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Новый пароль"
                    disabled={loading}
                  />
                  <PasswordInput
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Повторите новый пароль"
                    disabled={loading}
                  />
                </>
              )}
            </div>

            <div className="modal-actions">
              <button type="submit" className="submit-button" disabled={loading}>
                <Save size={16} /> {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
              <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [adminToken, setAdminToken] = useState(null);

  const ADMIN_CREDENTIALS = {
    login: process.env.REACT_APP_ADMIN_LOGIN,
    password: process.env.REACT_APP_ADMIN_PASSWORD
  };

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }, []);

  const getAdminToken = useCallback(async () => {
    if (adminToken) return adminToken;
    
    try {
      const { ok, data } = await api.login(ADMIN_CREDENTIALS);
      if (ok) {
        setAdminToken(data.access_token);
        return data.access_token;
      }
      
      await api.register({
        fio: 'Администратор',
        login: ADMIN_CREDENTIALS.login,
        password: ADMIN_CREDENTIALS.password,
        role: 'admin'
      }, '');
      
      const { data: loginData } = await api.login(ADMIN_CREDENTIALS);
      setAdminToken(loginData.access_token);
      return loginData.access_token;
    } catch (error) {
      showMessage('Ошибка авторизации администратора', 'error');
    }
    return null;
  }, [adminToken, showMessage]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) return;
      const data = await api.getUsers(token);
      setUsers(data);
    } catch (error) {
      showMessage('Ошибка загрузки списка пользователей', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAdminToken, showMessage]);

  const handleLogin = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { ok, data } = await api.login({
        login: formData.username,
        password: formData.password
      });

      if (ok) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        showMessage('Вход выполнен! Перенаправление...', 'success');
        setTimeout(() => navigate('/main'), 1000);
      } else {
        showMessage(data.message || 'Ошибка входа', 'error');
      }
    } catch (error) {
      showMessage('Ошибка соединения', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showMessage]);

  const handleRegister = useCallback(async (formData) => {
    setLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) return;
      
      await api.register({
        fio: formData.fio,
        login: formData.login,
        password: formData.password,
        role: formData.role
      }, token);
      
      showMessage(`Пользователь ${formData.fio} зарегистрирован!`, 'success');
      await loadUsers();
      setCurrentPage('admin-panel');
    } catch (error) {
      showMessage('Ошибка регистрации', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAdminToken, loadUsers, showMessage]);

  const handleUpdateUser = useCallback(async (formData) => {
    setLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) return;

      const updateData = {
        fio: formData.fio,
        login: formData.login,
        role: formData.role
      };
      if (formData.password) updateData.password = formData.password;

      const success = await api.updateUser(editingUserId, updateData, token);
      if (success) {
        await loadUsers();
        setEditModalOpen(false);
        setEditingUserId(null);
        showMessage('Пользователь обновлен', 'success');
      } else {
        showMessage('Ошибка обновления пользователя', 'error');
      }
    } catch (error) {
      showMessage('Ошибка соединения', 'error');
    } finally {
      setLoading(false);
    }
  }, [editingUserId, getAdminToken, loadUsers, showMessage]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;
    
    setLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) return;
      
      const success = await api.deleteUser(userId, token);
      if (success) {
        await loadUsers();
        showMessage('Пользователь удален', 'success');
      }
    } catch (error) {
      showMessage('Ошибка удаления', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAdminToken, loadUsers, showMessage]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setAdminToken(null);
    navigate('/');
    showMessage('Вы вышли из системы', 'success');
  }, [navigate, showMessage]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      (user.fio && user.fio.toLowerCase().includes(term)) ||
      (user.login && user.login.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const openEditModal = useCallback((user) => {
    setEditingUserId(user.id);
    setEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingUserId(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      if (user.role === 'admin' || user.role === 'dispatcher') {
        setCurrentPage('admin-panel');
        loadUsers();
      }
    }
  }, [loadUsers]);

  const editingUser = useMemo(() => {
    return users.find(u => u.id === editingUserId);
  }, [users, editingUserId]);

  const renderAdminPanel = () => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const canViewLogs = userData.role === 'admin' || userData.role === 'dispatcher';

    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-container"><div className="logo"><Shield size={32} /></div></div>
            <h1 className="auth-title">Панель администратора</h1>
            <p className="auth-subtitle">Управление пользователями системы</p>
          </div>

          <Message text={message.text} type={message.type} />

          <div className="admin-controls">
            <input type="text" className="search-input-app" placeholder="Поиск по ФИО или логину..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={loading} />
            
            <div className="admin-stats">
              <div className="stat-item"><span className="stat-label">Всего пользователей:</span><span className="stat-value">{users.length}</span></div>
              <div className="stat-item"><span className="stat-label">Найдено:</span><span className="stat-value">{filteredUsers.length}</span></div>
            </div>
          </div>

          <div className="users-list-container">
            <div className="users-list-header">
              <h3>Список пользователей</h3>
              <button className="add-user-button" onClick={() => setCurrentPage('register')} disabled={loading}>
                <UserPlus size={16} /><span>Добавить нового пользователя</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-users">Загрузка пользователей...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">Пользователей нет</div>
            ) : (
              <div className="users-table">
                <div className="table-header">
                  <div>ID</div><div>ФИО</div><div>Логин</div><div>Роль</div><div>Действия</div>
                </div>
                {filteredUsers.map(user => (
                  <UserTableRow key={user.id} user={user} 
                    onEdit={openEditModal}
                    onDelete={handleDeleteUser} loading={loading} />
                ))}
              </div>
            )}
          </div>

          <div className="admin-footer">
            <div className="admin-footer-actions">
              <button className="table-button" onClick={() => navigate('/main')} disabled={loading}>
                <Table size={16} /><span>Перейти к таблице</span>
              </button>
              <button className="options-button" onClick={() => navigate('/options')} disabled={loading}>
                <Settings size={16} /><span>Списки</span>
              </button>
              {canViewLogs && (
                <button className="app-logs-button" onClick={() => navigate('/logs')} disabled={loading}>
                  <FileText size={16} /><span>Просмотр логов</span>
                </button>
              )}
              <button className="logout-button" onClick={handleLogout} disabled={loading}>
                <LogOut size={16} /><span>Выйти из системы</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const pages = {
    login: <LoginPage onLogin={handleLogin} loading={loading} message={message} />,
    register: <RegisterPage onRegister={handleRegister} onBack={() => setCurrentPage('admin-panel')} loading={loading} message={message} />,
    'admin-panel': renderAdminPanel()
  };

  return (
    <div className="body-div">
      <div className="App">
        {pages[currentPage] || pages.login}
      </div>
      {editModalOpen && (
        <EditUserModal 
          user={editingUser}
          onSave={handleUpdateUser} 
          onClose={closeEditModal}
          loading={loading} 
          message={message} 
        />
      )}
    </div>
  );
}

export default App;