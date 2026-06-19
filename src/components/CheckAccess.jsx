import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckAccess = ({ allowedRoles, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    const token = localStorage.getItem('auth_token');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    if (!allowedRoles.includes(userData.role)) {
      navigate('/unauthorized');
      return;
    }
  }, [allowedRoles, navigate]);

  return children;
};

export default CheckAccess;