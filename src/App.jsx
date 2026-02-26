import './App.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { 
  User, Lock, Eye, EyeOff, LogIn, UserPlus,
  Key, Mail, Users, Shield, ArrowLeft, LogOut,
  Edit, Trash2, Save, X, Search, Table, KeyRound, XCircle,
  FileText // Добавляем иконку для логов
} from 'lucide-react';

function App() {
  const navigate = useNavigate(); 
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [adminFormData, setAdminFormData] = useState({ adminLogin: '', adminPassword: '' });
  const [registerData, setRegisterData] = useState({
    fio: '', login: '', password: '', confirmPassword: '', role: 'user'
  });
  const [registerPasswordVisible, setRegisterPasswordVisible] = useState({
    password: false, confirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ 
    fio: '', 
    login: '', 
    role: 'user',
    password: '',
    confirmPassword: ''
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  const ADMIN_CREDENTIALS = {
    login: process.env.REACT_APP_ADMIN_LOGIN,
    password: process.env.REACT_APP_ADMIN_PASSWORD
  };

  const API_URL = process.env.REACT_APP_API_URL;

  // Функция для перехода к логам
  const goToLogs = () => {
    navigate('/logs');
  };

  const getAdminToken = async () => {
    try {
      console.log('Пытаюсь получить токен админа...');
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      });
      
      console.log('Ответ сервера:', response.status);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Токен получен успешно');
        return data.access_token;
      }
      
      console.log('Админ не найден, пытаюсь создать...');
      const registerResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fio: 'Администратор',
          login: ADMIN_CREDENTIALS.login,
          password: ADMIN_CREDENTIALS.password,
          role: 'admin'
        })
      });
      
      console.log('Регистрация админа:', registerResponse.status);
      if (registerResponse.ok) {
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        const loginData = await loginResponse.json();
        return loginData.access_token;
      }
    } catch (error) {
      console.error('Ошибка получения токена:', error);
    }
    return null;
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('Загружаю пользователей...');
      const adminToken = await getAdminToken();
      if (!adminToken) {
        setMessage({ text: 'Ошибка авторизации администратора', type: 'error' });
        return;
      }

      console.log('Токен получен, делаю запрос к /users');
      const response = await fetch(`${API_URL}/users`, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Ответ от /users:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Получены пользователи:', data);
        setUsers(data);
      } else {
        const errorText = await response.text();
        console.error('Ошибка загрузки пользователей:', errorText);
        setMessage({ text: 'Ошибка загрузки списка пользователей', type: 'error' });
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setMessage({ text: 'Ошибка соединения с сервером', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user.id);
    setEditFormData({
      fio: user.fio || '',
      login: user.login || '',
      role: user.role || 'user',
      password: '',
      confirmPassword: ''
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditFormData({ fio: '', login: '', role: 'user', password: '', confirmPassword: '' });
    setShowEditPassword(false);
  };

  const saveEditUser = async () => {
    if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
      setMessage({ text: 'Пароли не совпадают', type: 'error' });
      return;
    }

    if (editFormData.password && editFormData.password.length < 6) {
      setMessage({ text: 'Пароль должен быть не менее 6 символов', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const adminToken = await getAdminToken();
      if (!adminToken) return;

      const updateData = {
        fio: editFormData.fio,
        login: editFormData.login,
        role: editFormData.role
      };

      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const response = await fetch(`${API_URL}/users/${editingUser}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadUsers();
        closeEditModal();
        setMessage({ text: 'Пользователь обновлен', type: 'success' });
      } else {
        const errorText = await response.text();
        setMessage({ text: 'Ошибка обновления пользователя', type: 'error' });
      }
    } catch (error) {
      console.error('Ошибка обновления:', error);
      setMessage({ text: 'Ошибка соединения', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;
    
    setLoading(true);
    try {
      const adminToken = await getAdminToken();
      if (!adminToken) return;

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadUsers();
        setMessage({ text: 'Пользователь удален', type: 'success' });
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    !searchTerm || 
    (user.fio && user.fio.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.login && user.login.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const goToTable = () => {
    navigate('/main');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        setMessage({ text: 'Вход выполнен! Перенаправление...', type: 'success' });
        
        setTimeout(() => {
          navigate('/main'); 
        }, 1000);
      } else {
        setMessage({ text: data.message || 'Ошибка входа', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Ошибка соединения', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: adminFormData.adminLogin,
          password: adminFormData.adminPassword
        })
      });
  
      const data = await response.json();
      if (response.ok &&(data.user.role == 'dispatcher'||data.user.role == 'admin')) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        setMessage({ text: 'Доступ подтвержден!', type: 'success' });
        
        setTimeout(() => {
          setCurrentPage('admin-panel');
          loadUsers();
        }, 1000);
      } else {
        setMessage({ text: 'Неверные данные или недостаточно прав', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Ошибка соединения', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (registerData.password !== registerData.confirmPassword) {
      setMessage({ text: 'Пароли не совпадают', type: 'error' });
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setMessage({ text: 'Пароль должен быть не менее 6 символов', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const adminToken = await getAdminToken();
      if (!adminToken) {
        setMessage({ text: 'Ошибка авторизации администратора', type: 'error' });
        return;
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fio: registerData.fio,
          login: registerData.login,
          password: registerData.password,
          role: registerData.role
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: `Пользователь ${data.user.fio} зарегистрирован!`, type: 'success' });
        setRegisterData({ fio: '', login: '', password: '', confirmPassword: '', role: 'user' });
        await loadUsers();
        setTimeout(() => {
          setCurrentPage('admin-panel');
        }, 1500);
      } else {
        setMessage({ text: data.message || 'Ошибка регистрации', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Ошибка соединения', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      if (user.role == 'admin'||user.role =='dispatcher') {
        setCurrentPage('admin-panel');
        loadUsers();
      }
    }
  }, []);

  const renderLoginPage = () => (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo"><LogIn size={32} /></div>
          </div>
          <h1 className="auth-title">Авторизация</h1>
          <p className="auth-subtitle">Войдите в систему</p>
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <form onSubmit={handleLoginSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label"><User size={18} /><span>Логин</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Введите логин"
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label"><Lock size={18} /><span>Пароль</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="input-field" 
                  placeholder="Введите пароль"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
              <button 
                type="button" 
                className="password-toggle-button" 
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="submitauth-button" disabled={loading}>
            <LogIn size={20} /><span>{loading ? 'Вход...' : 'Войти'}</span>
          </button>
          
          <div className="auth-footer">
            <p className="register-link">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('admin-auth'); }}>
                <Shield size={16} /> Регистрация новых пользователей (только для администратора)
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  const renderAdminAuthPage = () => (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container"><div className="logo"><Shield size={32} /></div></div>
          <h1 className="auth-title">Авторизация администратора</h1>
          <p className="auth-subtitle">Для доступа к панели управления</p>
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <form onSubmit={handleAdminAuth} className="auth-form">
          <div className="input-group">
            <label className="input-label"><User size={18} /><span>Логин админа</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Введите логин"
                  value={adminFormData.adminLogin} 
                  onChange={(e) => setAdminFormData({...adminFormData, adminLogin: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label"><Key size={18} /><span>Пароль админа</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Введите пароль"
                  value={adminFormData.adminPassword} 
                  onChange={(e) => setAdminFormData({...adminFormData, adminPassword: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
            </div>
          </div>
          
          <button type="submit" className="submitauth-button" disabled={loading}>
            <Shield size={20} /><span>{loading ? 'Вход...' : 'Войти как админ'}</span>
          </button>
          
          <div className="auth-footer">
            <button 
              className="back-button" 
              onClick={() => setCurrentPage('login')}
              disabled={loading}
            >
              <ArrowLeft size={16} /><span>Назад к обычному входу</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderRegisterPage = () => (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container"><div className="logo"><UserPlus size={32} /></div></div>
          <h1 className="auth-title">Регистрация нового пользователя</h1>
          <p className="auth-subtitle">Заполните данные для регистрации</p>
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <form onSubmit={handleRegisterSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label"><Users size={18} /><span>ФИО</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="ФИО полностью"
                  value={registerData.fio} 
                  onChange={(e) => setRegisterData({...registerData, fio: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label"><Mail size={18} /><span>Логин</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Логин"
                  value={registerData.login} 
                  onChange={(e) => setRegisterData({...registerData, login: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label"><Lock size={18} /><span>Пароль</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type={registerPasswordVisible.password ? 'text' : 'password'} 
                  className="input-field" 
                  placeholder="Пароль (минимум 6 символов)"
                  value={registerData.password} 
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
              <button 
                type="button" 
                className="password-toggle-button" 
                onClick={() => setRegisterPasswordVisible({...registerPasswordVisible, password: !registerPasswordVisible.password})}
                disabled={loading}
              >
                {registerPasswordVisible.password ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label"><Lock size={18} /><span>Подтверждение пароля</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
                <input 
                  type={registerPasswordVisible.confirmPassword ? 'text' : 'password'} 
                  className="input-field" 
                  placeholder="Повторите пароль"
                  value={registerData.confirmPassword} 
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  required 
                  disabled={loading} 
                />
              </div>
              <button 
                type="button" 
                className="password-toggle-button" 
                onClick={() => setRegisterPasswordVisible({...registerPasswordVisible, confirmPassword: !registerPasswordVisible.confirmPassword})}
                disabled={loading}
              >
                {registerPasswordVisible.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label"><Shield size={18} /><span>Роль</span></label>
            <div className="password-field-wrapper">
              <div className="input-wrapper">
              <select 
                  className="input-field" 
                  value={registerData.role} 
                  onChange={(e) => setRegisterData({...registerData, role: e.target.value})} 
                  disabled={loading}
                >
                  <option value="admin">Администратор</option>
                  <option value="dispatcher">Диспетчер</option>
                  <option value="passportist">Паспортист</option>
                  <option value="supervisor">Руководитель</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="back-button" disabled={loading}>
            <UserPlus size={20} />{loading ? 'Регистрация...' : 'Зарегистрировать'}
          </button>
          
          <div className="auth-footer">
            <div className="register-actions">
              <button 
                className="back-button" 
                onClick={() => setCurrentPage('admin-panel')}
                disabled={loading}
              >
                <ArrowLeft size={16} /><span>Назад к списку</span>
              </button>
              
              <button 
                className="logout-button" 
                onClick={() => { 
                  localStorage.clear(); 
                  navigate('/'); 
                  setMessage({ text: 'Вы вышли из системы', type: 'success' });
                }}
                disabled={loading}
              >
                <LogOut size={16} /><span>Выйти</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderAdminPanel = () => {
    // Получаем данные пользователя для проверки роли
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

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          <div className="admin-controls">
              <input 
                type="text" 
                className="search-input-app" 
                placeholder="Поиск по ФИО или логину..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            
            <div className="admin-stats">
              <div className="stat-item">
                <span className="stat-label">Всего пользователей:</span>
                <span className="stat-value">{users.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Найдено:</span>
                <span className="stat-value">{filteredUsers.length}</span>
              </div>
            </div>
          </div>

          <div className="users-list-container">
            <div className="users-list-header">
              <h3>Список пользователей</h3>
              <button 
                className="add-user-button" 
                onClick={() => setCurrentPage('register')}
                disabled={loading}
              >
                <UserPlus size={16} /><span>Добавить нового пользователя</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-users">Загрузка пользователей...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">
                {users.length === 0 ? 'Пользователей нет' : 'Пользователи не найдены'}
                <br />
                <button 
                  className="add-user-button" 
                  onClick={() => setCurrentPage('register')}
                  style={{ marginTop: '10px' }}
                >
                  <UserPlus size={16} /><span>Добавить первого пользователя</span>
                </button>
              </div>
            ) : (
              <div className="users-table">
                <div className="table-header">
                  <div>ID</div>
                  <div>ФИО</div>
                  <div>Логин</div>
                  <div className='div-role'>Роль</div>
                  <div className='div-action'>Действия</div>
                </div>
                
                {filteredUsers.map(user => (
                  <div key={user.id} className="table-row-app">
                    <div>{user.id}</div>
                    <div>{user.fio}</div>
                    <div>{user.login}</div>
                    <div className='role-div'>
                      <span className={`role-badge-app role-${user.role}`}>
                        {user.role === 'admin' ? 'Администратор' : 
                        user.role === 'dispatcher' ? 'Диспетчер' :
                        user.role === 'passportist' ? 'Паспортист' :
                        user.role === 'supervisor' ? 'Руководитель' : 'Пользователь'}
                      </span>
                    </div>
                    <div className="actions">
                      <button 
                        className="action-button edit-button" 
                        onClick={() => openEditModal(user)}
                        disabled={loading}
                      >
                        <Edit size={16} /> Изменить
                      </button>
                      <button 
                        className="action-button delete-button" 
                        onClick={() => deleteUser(user.id)}
                        disabled={loading}
                      >
                        <Trash2 size={16} /> Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-footer">
            <div className="admin-footer-actions">
              <button 
                className="table-button" 
                onClick={goToTable}
                disabled={loading}
              >
                <Table size={16} /><span>Перейти к таблице</span>
              </button>
              
              {/* Кнопка просмотра логов - доступна только админам и диспетчерам */}
              {canViewLogs && (
                <button 
                  className="logs-button" 
                  onClick={goToLogs}
                  disabled={loading}
                  style={{
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <FileText size={16} /><span>Просмотр логов</span>
                </button>
              )}
              
              <button 
                className="logout-button" 
                onClick={() => { 
                  localStorage.clear(); 
                  navigate('/');
                  window.location.reload()
                  setMessage({ text: 'Вы вышли из системы', type: 'success' });
                }}
                disabled={loading}
              >
                <LogOut size={16} /><span>Выйти из системы</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Роутинг
  let page;
  switch(currentPage) {
    case 'admin-auth': page = renderAdminAuthPage(); break;
    case 'register': page = renderRegisterPage(); break;
    case 'admin-panel': page = renderAdminPanel(); break;
    default: page = renderLoginPage();
  }

  return (
    <>
      <div className='body-div'>
        <div className='App'>{page}</div>
      </div>

      {/* Модальное окно редактирования пользователя */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal edit-user-modal">
            <div className="modal-header">
              <h2>Редактирование пользователя</h2>
              <button onClick={closeEditModal} className="close-button">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

              <form className="auth-form">
                <div className="input-group">
                  <label className="input-label"><Users size={18} /><span>ФИО</span></label>
                  <div className="password-field-wrapper">
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="ФИО полностью"
                        value={editFormData.fio} 
                        onChange={(e) => setEditFormData({...editFormData, fio: e.target.value})}
                        required 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label"><Mail size={18} /><span>Логин</span></label>
                  <div className="password-field-wrapper">
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Логин"
                        value={editFormData.login} 
                        onChange={(e) => setEditFormData({...editFormData, login: e.target.value})}
                        required 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label"><Shield size={18} /><span>Роль</span></label>
                  <div className="password-field-wrapper">
                    <div className="input-wrapper">
                    <select 
                      className="input-field" 
                      value={editFormData.role} 
                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} 
                      disabled={loading}
                    >
                      <option value="admin">Администратор</option>
                      <option value="dispatcher">Диспетчер</option>
                      <option value="passportist">Паспортист</option>
                      <option value="supervisor">Руководитель</option>
                    </select>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <div className="password-change-header">
                    <label className="input-label"><KeyRound size={18} /><span>Сменить пароль</span></label>
                    <button 
                      type="button" 
                      className="toggle-password-button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                    >
                      {showEditPassword ? 'Скрыть' : 'Изменить пароль'}
                    </button>
                  </div>
                  
                  {showEditPassword && (
                    <>
                      <div className="password-field-wrapper">
                        <div className="input-wrapper">
                          <input 
                            type="password" 
                            className="input-field" 
                            placeholder="Новый пароль"
                            value={editFormData.password} 
                            onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                            disabled={loading} 
                          />
                        </div>
                      </div>

                      <div className="password-field-wrapper">
                        <div className="input-wrapper">
                          <input 
                            type="password" 
                            className="input-field" 
                            placeholder="Повторите новый пароль"
                            value={editFormData.confirmPassword} 
                            onChange={(e) => setEditFormData({...editFormData, confirmPassword: e.target.value})}
                            disabled={loading} 
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-actions">
                  <button 
                      type="button" 
                      className="submit-button" 
                      onClick={saveEditUser}
                      disabled={loading}
                    >
                    <Save size={16} /> {loading ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={closeEditModal}
                    disabled={loading}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;