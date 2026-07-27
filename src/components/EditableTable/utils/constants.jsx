export const ROWS_PER_PAGE = 250;

export const COLUMN_NAMES = {
  1: 'ФИО',
  2: 'ФИО(EN)',
  3: 'Дата рождения',
  4: 'Пол',
  5: 'Страна',
  6: 'Дата зачисления',
  7: 'Дата отчисления',
  8: 'Причина отчисления',
  9: 'Социальный отпуск',
  10: 'Мобильный телефон',
  11: 'ВУЗ',
  12: 'Год окончания',
  13: 'Кафедра',
  14: 'Профиль специальности',
  15: 'Специальность',
  16: 'Форма подготовки',
  17: 'Документ, удостоверяющий личность',
  18: 'Номер документа',
  19: 'Идентификационный номер',
  20: 'Место проживания, регистрации',
  21: 'Адрес проживания',
  22: 'Срок окончания регистрации',
  23: 'Номер приказа о зачислении',
  24: 'Дата приказа о зачислении',
  25: 'Номер приказа об отчислении',
  26: 'Дата приказа об отчислении',
  27: 'Номер приказа о продлении',
  28: 'Договор, дополнительное соглашение',
  29: 'Медицинская справка',
  30: 'Текущий контроль',
  31: 'Логин',
  32: 'Пароль',
  33: 'Руководители',
  34: 'Дата начала сессии(циклов)',
  35: 'Дата окончания сессии(циклов)',
  36: 'Надбавка',
  37: 'Наличие сертификата РИВШ',
  38: 'Въезд по приглашению',
  39: 'Распределение клинических ординаторов',
};

export const FIELD_TYPES = {
  TEXT: 'text',
  DATE: 'date',
  TEL: 'tel',
  PASSWORD: 'password',
  CREATABLE_GENDER: 'creatable-gender',
  CREATABLE_COUNTRY: 'creatable-country',
  CREATABLE_DEPARTMENT: 'creatable-department',
  CREATABLE_SPECIALTY: 'creatable-specialty',
  CREATABLE_SPECIALTY_PROFILE: 'creatable-specialty-profile',
  CREATABLE_DISMISSAL: 'creatable-dismissal',
  CREATABLE_UNIVERSITY: 'creatable-university',
  CREATABLE_PREPARATION: 'creatable-preparation',
  CREATABLE_DOCUMENT: 'creatable-document',
  CREATABLE_RESIDENCE: 'creatable-residence',
  CREATABLE_MEDICAL: 'creatable-medical',
  CREATABLE_RIVSH: 'creatable-rivsh',
  CREATABLE_ENTRY: 'creatable-entry',
  NESTED_SOCIAL_LEAVE: 'nested-social-leave',
  NESTED_SUPERVISORS: 'nested-supervisors',
};

export const DATE_COLUMNS = [3, 6, 7, 22, 24, 26, 30, 34, 35];
export const NUMBER_COLUMNS = [3, 12];
export const BOOLEAN_COLUMNS = [38, 39];

export const PASSPORTIST_ALLOWED_FIELDS = [
  'Срок окончания регистрации',
  'Документ, удостоверяющий личность',
  'Идентификационный номер',
  'Номер документа'
];

export const ALLOWED_ROLES = ['admin', 'dispatcher', 'passportist', 'supervisor'];

export const EXTENSION_TERMS = ['1 год', '2 года', '3 года'];