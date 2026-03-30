import React from 'react';
import { Link } from 'react-router-dom';
import './404.css';

const NotFound = () => {
  return (
    <div className="style_404_container">
      <div className="style_404_decoration"></div>
      <div className="style_404_content">
        <div className="style_404_code">404</div>
        <h1 className="style_404_title">Страница не найдена</h1>
        <p className="style_404_message">
          Извините, запрашиваемая страница не существует или была перемещена.
        </p>
        <Link to="/" className="style_404_link">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default NotFound;