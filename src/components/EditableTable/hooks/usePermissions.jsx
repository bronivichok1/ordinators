import { ALLOWED_ROLES, PASSPORTIST_ALLOWED_FIELDS } from '../utils/constants';

export const usePermissions = (userData) => {
  const canEditTable = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };
  
  const canCreateRow = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };
  
  const canEditRow = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher', 'passportist'].includes(userData.role);
  };
  
  const canDeleteRow = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };
  
  const canViewTable = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher', 'passportist', 'supervisor'].includes(userData.role);
  };
  
  const canExport = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher', 'passportist', 'supervisor'].includes(userData.role);
  };
  
  const canGenerateCertificates = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };
  
  const canViewAdminPanel = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };

  const canEditField = (fieldName) => {
    if (!userData) return false;
    if (userData.role === 'admin' || userData.role === 'dispatcher') return true;
    if (userData.role === 'passportist') {
      return PASSPORTIST_ALLOWED_FIELDS.includes(fieldName);
    }
    return false;
  };

  const canEditNested = () => {
    if (!userData) return false;
    return ['admin', 'dispatcher'].includes(userData.role);
  };

  return {
    canEditTable,
    canCreateRow,
    canEditRow,
    canDeleteRow,
    canViewTable,
    canExport,
    canGenerateCertificates,
    canViewAdminPanel,
    canEditField,
    canEditNested,
  };
};