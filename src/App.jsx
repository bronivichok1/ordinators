import './App.css';
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Данные для авторизации:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
  <div className='body-div'>
    <div className='App'>
      <div className='auth-container'>
        <div className='auth-card'>
          <div className='auth-header'>
            <div className='logo-container'>
              <div className='logo'>
                <LogIn size={32} />
              </div>
            </div>
            <h1 className='auth-title'>Авторизация</h1>
            <p className='auth-subtitle'>Введите свои данные для входа в систему</p>
          </div>

          <form onSubmit={handleSubmit} className='auth-form'>
            <div className='input-group'>
              <label htmlFor='username' className='input-label'>
                <User size={18} />
                <span>Логин</span>
              </label>
              <div className='input-wrapper'>
                <input
                  id='username'
                  name='username'
                  type='text'
                  className='input-field'
                  placeholder='Введите логин'
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className='input-group'>
              <label htmlFor='password' className='input-label'>
                <Lock size={18} />
                <span>Пароль</span>
              </label>
              <div className='input-wrapper'>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  className='input-field'
                  placeholder='Введите пароль'
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='password-options'>
                <label className='remember-me'>
                  <input type='checkbox' />
                  <span>Запомнить меня</span>
                </label>
                <a href='#' className='forgot-password'>Забыли пароль?</a>
              </div>
            </div>
            <button type='submit' className='submit-button'>
              <LogIn size={20} />
              <span>Войти</span>
            </button>
            <div className='auth-footer'>
              <p className='register-link'>
                Нет аккаунта? <a href='#'>Зарегистрироваться</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;