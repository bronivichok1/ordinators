import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import './Unauthorized.css';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <Shield size={80} className="unauthorized-icon" />
        <h1>403 - Доступ запрещен</h1>
        <p>У вас нет прав для просмотра этой страницы</p>
        <p className="unauthorized-details">
          Эта страница доступна только для администраторов и диспетчеров
        </p>
        <div className="unauthorized-actions">
          <button onClick={() => navigate(-1)} className="unauthorized-back-btn">
            ← Вернуться назад
          </button>
          <button onClick={() => navigate('/main')} className="unauthorized-home-btn">
            <Home size={18} />
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;