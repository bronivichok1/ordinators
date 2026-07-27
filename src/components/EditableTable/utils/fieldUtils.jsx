import { COLUMN_NAMES } from './constants';

export const getFieldType = (columnNumber) => {
  const fieldName = COLUMN_NAMES[columnNumber];
  
  switch(fieldName) {
    case 'Пол':
      return 'creatable-gender';
    case 'Страна':
      return 'creatable-country';
    case 'Кафедра':
      return 'creatable-department';
    case 'Специальность':
      return 'creatable-specialty';
    case 'Профиль специальности':
      return 'creatable-specialty-profile';
    case 'Причина отчисления':
      return 'creatable-dismissal';
    case 'ВУЗ':
      return 'creatable-university';
    case 'Форма подготовки':
      return 'creatable-preparation';
    case 'Документ, удостоверяющий личность':
      return 'creatable-document';
    case 'Место проживания, регистрации':
      return 'creatable-residence';
    case 'Медицинская справка':
      return 'creatable-medical';
    case 'Наличие сертификата РИВШ':
      return 'creatable-rivsh';
    case 'Въезд по приглашению':
      return 'creatable-entry';
    case 'Социальный отпуск':
      return 'nested-social-leave';
    case 'Руководители':
      return 'nested-supervisors';
    case 'Дата рождения':
    case 'Дата зачисления':
    case 'Дата отчисления':
    case 'Дата приказа о зачислении':
    case 'Дата приказа об отчислении':
    case 'Срок окончания регистрации':
    case 'Дата начала сессии(циклов)':
    case 'Дата окончания сессии(циклов)':
      return 'date';
    case 'Мобильный телефон':
      return 'tel';
    case 'Пароль':
      return 'password';
    case 'Текущий контроль':
      return 'date';
    case 'Распределение клинических ординаторов':
    case 'Адрес проживания':
      return 'text';
    default:
      return 'text';
  }
};