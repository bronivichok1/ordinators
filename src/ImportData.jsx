import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './ImportData.css';

const API_URL = process.env.REACT_APP_API_URL;

const ImportData = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx'))) {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Пожалуйста, выберите файл Excel (.xls или .xlsx)');
      setFile(null);
    }
  };

  const parseExcelToJson = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        resolve(jsonData);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcelDate = (dateValue) => {
    if (!dateValue) return null;
    
    if (typeof dateValue === 'number') {
      const date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return null;
    }
    
    const dateStr = String(dateValue).trim();
    if (!dateStr) return null;
    
    let match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    
    match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return dateStr;
    
    match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
    if (match) {
      const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
      return `${year}-${match[2]}-${match[1]}`;
    }
    
    return null;
  };

  const parseBirthYear = (value) => {
    if (!value) return null;
    
    if (typeof value === 'string' || typeof value === 'object') {
      const str = String(value).trim();
      
      let match = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (match) {
        return `${match[3]}-01-01`;
      }
      
      match = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (match) {
        return `${match[3]}-01-01`;
      }
      
      match = str.match(/\b(19|20)\d{2}\b/);
      if (match) {
        return `${match[0]}-01-01`;
      }
    }
    
    if (typeof value === 'number') {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        if (year > 1900 && year < 2100) {
          return `${year}-01-01`;
        }
      }
      return null;
    }
    
    return null;
  };

  const parseUniversity = (universityStr) => {
    if (!universityStr) return { name: 'БГМУ', graduationYear: null };
    
    const str = String(universityStr);
    const yearMatch = str.match(/(\d{4})/);
    let graduationYear = yearMatch ? parseInt(yearMatch[1]) : null;
    
    let name = str.split(',')[0].trim();
    const uniMap = {
      'БГМУ': 'БГМУ',
      'Белорусский государственный медицинский университет': 'БГМУ',
      'ВГМУ': 'ВГМУ',
      'Витебский государственный медицинский университет': 'ВГМУ',
      'ГомГМУ': 'ГомГМУ',
      'Гомельский государственный медицинский университет': 'ГомГМУ',
      'ГрГМУ': 'ГрГМУ',
      'Гродненский государственный медицинский университет': 'ГрГМУ'
    };
    
    return { name: uniMap[name] || name, graduationYear };
  };

  const parsePreparationForm = (paymentForm, studyForm) => {
    let result = [];
    
    if (paymentForm === 'на платной основе') {
      result.push('платно');
    } else if (paymentForm === 'бюджет') {
      result.push('за счёт бюджета');
    }
    
    if (studyForm === 'заочная') {
      result.push('заочная');
    } else {
      result.push('очная');
    }
    
    return JSON.stringify(result);
  };

  const parseSupervisor = (supervisorStr) => {
    if (!supervisorStr) return [];
    
    const text = String(supervisorStr);
    const supervisors = [];
    
    let lines = text.split(/\r?\n/);
    
    if (lines.length === 1 && text.includes('  ')) {
      lines = text.split(/\s{2,}/);
    }
    
    lines = lines.filter(line => line.trim());
    
    let currentSupervisor = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const nameMatch = line.match(/^[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.(?:\s*[А-ЯЁ]\.)?/);
      const hasPosition = /(доцент|профессор|старший преподаватель|ассистент|зав\. кафедрой)/i.test(line);
      const hasRank = /(д\.м\.н\.|к\.м\.н\.|PhD|доктор медицинских наук|кандидат медицинских наук)/i.test(line);
      
      if (nameMatch && !hasPosition && !hasRank) {
        if (currentSupervisor && currentSupervisor.name) {
          supervisors.push({
            supervisorName: currentSupervisor.name,
            position: currentSupervisor.position || '',
            rank: currentSupervisor.rank || '',
            startDate: null,
            endDate: currentSupervisor.endDate || null
          });
        }
        
        currentSupervisor = {
          name: line,
          position: '',
          rank: '',
          endDate: null
        };
      } 
      else if (currentSupervisor) {
        if (hasPosition && !currentSupervisor.position) {
          currentSupervisor.position = line;
        }
        else if (hasRank && !currentSupervisor.rank) {
          currentSupervisor.rank = line;
        }
        else if (line.includes('по') && line.match(/\d{2}\.\d{2}\.\d{2,4}/)) {
          const dateMatch = line.match(/(\d{2}\.\d{2}\.\d{2,4})/);
          if (dateMatch) {
            currentSupervisor.endDate = parseExcelDate(dateMatch[1]);
          }
        }
        else if (!currentSupervisor.position && !currentSupervisor.rank) {
          if (line.includes('доцент')) currentSupervisor.position = line;
          else if (line.includes('профессор')) currentSupervisor.position = line;
          else if (line.includes('преподаватель')) currentSupervisor.position = line;
          else if (line.includes('д.м.н.') || line.includes('к.м.н.')) currentSupervisor.rank = line;
        }
      }
    }
    
    if (currentSupervisor && currentSupervisor.name) {
      supervisors.push({
        supervisorName: currentSupervisor.name,
        position: currentSupervisor.position || '',
        rank: currentSupervisor.rank || '',
        startDate: null,
        endDate: currentSupervisor.endDate || null
      });
    }
    
    return supervisors;
  };

  const normalizeDepartment = (dept) => {
    if (!dept) return '';
    const deptStr = String(dept);
    
    const deptMap = {
      'хирургических болезней': 'Кафедра хирургических болезней с курсом повышения квалификации и переподготовки',
      'акушерства и гинекологии': 'Кафедра акушерства и гинекологии с курсом повышения квалификации и переподготовки',
      'анестезиологии и реаниматологии': 'Кафедра анестезиологии и реаниматологии с курсом повышения квалификации и переподготовки',
      'дерматовенерологии': 'Кафедра дерматовенерологии и косметологии с курсом повышения квалификации и переподготовки',
      'детской хирургии': 'Кафедра детской хирургии с курсом повышения квалификации и переподготовки',
      'онкологии': 'Кафедра онкологии с курсом повышения квалификации и переподготовки',
      'оториноларингологии': 'Кафедра оториноларингологии с курсом повышения квалификации и переподготовки',
      'травматологии и ортопедии': 'Кафедра травматологии и ортопедии с курсом повышения квалификации и переподготовки',
      'урологии и нефрологии': 'Кафедра урологии и нефрологии с курсом повышения квалификации и переподготовки',
      'челюстно-лицевой': 'Кафедра челюстно-лицевой хирургии и пластической хирургии лица с курсом повышения квалификации и переподготовки',
      'глазных болезней': 'Кафедра глазных болезней',
      'педиатрии': 'Кафедра педиатрии',
      'кардиологии и внутренних болезней': 'Кафедра кардиологии и внутренних болезней',
      'нервных и нейрохирургических': 'Кафедра нервных и нейрохирургических болезней',
      'ортопедической стоматологии': 'Кафедра ортопедической стоматологии и ортодонтии',
      'хирургии и трансплантологии': 'Кафедра хирургии и трансплантологии с курсом повышения квалификации и переподготовки',
      'хирургии и эндоскопии': 'Кафедра хирургии и эндоскопии',
      'репродуктивного здоровья': 'Кафедра репродуктивного здоровья, перинатологии и медицинской генетики',
      'клинической микробиологии': 'Кафедра клинической микробиологии, лабораторной диагностики и эпидемиологии',
      'терапевтической стоматологии': 'Кафедра терапевтической стоматологии',
      'хирургической стоматологии': 'Кафедра хирургической стоматологии'
    };
    
    for (const [key, value] of Object.entries(deptMap)) {
      if (deptStr.includes(key)) {
        return value;
      }
    }
    
    return deptStr;
  };

  const parseSocialLeaves = (note) => {
    if (!note) return [];
    
    const text = String(note);
    const leaves = [];
    
    const patterns = [
      /(?:с\/о|а\/о|отп\.?)\s*по\s*уходу\s*с\s*(\d{2}\.\d{2}\.\d{4})\s*по\s*(\d{2}\.\d{2}\.\d{4})/i,
      /отп\.\s*по\s*бер\.\s*и\s*родам\s*с\s*(\d{2}\.\d{2}\.\d{4})\s*по\s*(\d{2}\.\d{2}\.\d{4})/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        leaves.push({
          type: 'childcare',
          startDate: parseExcelDate(match[1]),
          endDate: parseExcelDate(match[2]),
          orderNumber: ''
        });
      }
    }
    
    return leaves;
  };

  const parseExtensions = (row, colIndex) => {
    const extensions = [];
    
    for (let i = 1; i <= 4; i++) {
      const startKey = i === 1 ? 'Продление (зачисление)' : `Продление (зачисление)`;
      const endKey = i === 1 ? 'Продление (отчисление)' : `Продление (отчисление)`;
      
      let startDate = null;
      let endDate = null;
      
      if (colIndex[startKey] !== undefined) {
        startDate = parseExcelDate(row[colIndex[startKey]]);
      }
      if (colIndex[endKey] !== undefined) {
        endDate = parseExcelDate(row[colIndex[endKey]]);
      }
      
      if (startDate || endDate) {
        let term = '';
        if (startDate && endDate) {
          const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffYears = Math.floor(diffDays / 365);
          const diffMonths = Math.floor((diffDays % 365) / 30);
          if (diffYears > 0) term = `${diffYears} год`;
          else if (diffMonths > 0) term = `${diffMonths} мес`;
          else term = `${diffDays} дн`;
        }
        
        extensions.push({
          orderNumber: '',
          orderDate: startDate,
          extensionTerm: term
        });
      }
    }
    
    return extensions;
  };

  const parseForeignFile = (rows) => {
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const ordinators = [];
    
    const colIndex = {};
    headers.forEach((h, idx) => { colIndex[h] = idx; });
    
    for (const row of dataRows) {
      const fio = row[colIndex['ФИО']] || '';
      const fioEn = row[colIndex['ФИО на англ.языке']] || '';
      
      if (!fio && !fioEn) continue;
      
      const { name: uniName, graduationYear: uniGradYear } = parseUniversity(row[colIndex['какой ВВУЗ закончил']]);
      
      let medicalCertificate = 'нет';
      const medVal = String(row[colIndex['мед.спр.']] || '').toLowerCase();
      if (medVal === 'есть' || medVal === 'да') medicalCertificate = 'есть';
      
      let rivshCertificate = 'нет';
      const rivshVal = String(row[colIndex['РИВШ']] || '').toLowerCase();
      if (rivshVal === 'есть' || rivshVal === 'да' || rivshVal === 'справка') rivshCertificate = 'да';
      
      const livingAddress = row[colIndex['регистрация']] || '';
      let residenceAddress = 'общежитие';
      const addrLower = String(livingAddress).toLowerCase();
      if (addrLower.includes('квартир') || addrLower.includes('ул.') || addrLower.includes('пр-кт')) {
        residenceAddress = 'квартира';
      }
      
      let identityDocument = 'паспорт';
      const docVal = String(row[colIndex['вид на жительство']] || '').toLowerCase();
      if (docVal.includes('вид на жительство')) identityDocument = 'вид на жительство';
      else if (docVal.includes('паспорт')) identityDocument = 'паспорт ИГ';
      
      const countryMap = {
        'Туркменистан': 'Туркменистан', 'Грузия': 'Грузия', 'Ливан': 'Ливан',
        'Российская Федерация': 'Российская Федерация', 'Иран': 'Иран', 'Марокко': 'Марокко',
        'Таджикистан': 'Таджикистан', 'Шри-Ланка': 'Шри-Ланка', 'Азербайджан': 'Азербайджан',
        'Узбекистан': 'Узбекистан', 'Иордания': 'Иордания', 'Сирия': 'Сирия',
        'Ирак': 'Ирак', 'Китай': 'Китай', 'Казахстан': 'Казахстан', 'Йемен': 'Йемен',
        'Индия': 'Индия', 'Украина': 'Украина', 'Гана': 'Гана', 'Нигерия': 'Нигерия',
        'Пакистан': 'Пакистан', 'Египет': 'Египет', 'Палестина': 'Палестина', 'Судан': 'Судан',
        'Эстония': 'Эстония', 'Армения': 'Армения', 'Литва': 'Литва'
      };
      const country = countryMap[String(row[colIndex['Страна']] || '')] || String(row[colIndex['Страна']] || '');
      
      const ordinator = {
        fio: String(fio),
        fioEn: String(fioEn),
        birthYear: parseBirthYear(row[colIndex['год рождения']]),
        gender: row[colIndex['пол']] === 'ж' || row[colIndex['пол']] === 'Ж' ? 'Ж' : 'М',
        country: country,
        enrollmentDate: parseExcelDate(row[colIndex['Зачисление']]),
        dismissalDate: parseExcelDate(row[colIndex['Отчисление']]),
        dismissalReason: String(row[colIndex['примечание']] || ''),
        socialLeaves: parseSocialLeaves(row[colIndex['примечание']]),
        mobilePhone: String(row[colIndex['Моб.тел.']] || ''),
        universityName: uniName,
        graduationYear: uniGradYear ? `${uniGradYear}-01-01` : null,
        department: normalizeDepartment(row[colIndex['Название кафедры']]),
        specialtyProfile: String(row[colIndex['профили']] || ''),
        specialty: String(row[colIndex['Специальность']] || ''),
        preparationForm: JSON.stringify(['очная']),
        identityDocument: identityDocument,
        documentNumber: String(row[colIndex['номер паспорта']] || ''),
        identNumber: String(row[colIndex['идентификационный номер']] || ''),
        residenceAddress: residenceAddress,
        livingAddress: String(livingAddress),
        registrationExpiry: null,
        enrollmentOrderNumber: '',
        enrollmentOrderDate: null,
        dismissalOrderNumber: '',
        dismissalOrderDate: null,
        contractInfo: '',
        medicalCertificate: medicalCertificate,
        currentControl: parseExcelDate(row[colIndex['текущий контроль']]),
        login: String(row[colIndex['ЛОГИН']] || ''),
        password: String(row[colIndex['ПАРОЛЬ']] || ''),
        supervisors: parseSupervisor(row[colIndex['руководитель']]),
        sessionStart: null,
        sessionEnd: null,
        allowances: [],
        rivshCertificate: rivshCertificate,
        entryByInvitation: 'нет',
        distributionInfo: '',
        extensions: parseExtensions(row, colIndex),
        examDate: parseExcelDate(row[colIndex['итоговый экзамен']])
      };
      
      ordinators.push(ordinator);
    }
    
    return ordinators;
  };

  const parseBelarusFile = (rows) => {
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const ordinators = [];
    
    const colIndex = {};
    headers.forEach((h, idx) => { colIndex[h] = idx; });
    
    for (const row of dataRows) {
      const fio = row[colIndex['Ф.И.О.']];
      if (!fio) continue;
      
      const paymentForm = row[colIndex['форма обучения']] || '';
      const studyForm = headers[colIndex['форма обучения'] + 1] === '' ? row[colIndex['форма обучения'] + 1] : '';
      
      const ordinator = {
        fio: String(fio),
        fioEn: '',
        birthYear: null,
        gender: row[colIndex['пол']] === 'ж' || row[colIndex['пол']] === 'Ж' ? 'Ж' : 'М',
        country: 'Беларусь',
        enrollmentDate: parseExcelDate(row[colIndex['Зачисление']]),
        dismissalDate: parseExcelDate(row[colIndex['Отчисление']]),
        dismissalReason: String(row[colIndex['Примечание']] || ''),
        socialLeaves: [],
        mobilePhone: String(row[colIndex['Моб.тел.']] || ''),
        universityName: 'БГМУ',
        graduationYear: null,
        department: normalizeDepartment(row[colIndex['Название кафедры']]),
        specialtyProfile: row[colIndex['профиль']] || '',
        specialty: String(row[colIndex['Специальность']] || ''),
        preparationForm: parsePreparationForm(paymentForm, studyForm),
        identityDocument: 'паспорт',
        documentNumber: String(row[colIndex['номер диплома']] || ''),
        identNumber: String(row[colIndex['идентификационные номера']] || ''),
        residenceAddress: 'общежитие',
        livingAddress: String(row[colIndex['Домашний адрес']] || ''),
        registrationExpiry: null,
        enrollmentOrderNumber: '',
        enrollmentOrderDate: null,
        dismissalOrderNumber: '',
        dismissalOrderDate: null,
        contractInfo: '',
        medicalCertificate: 'есть',
        currentControl: parseExcelDate(row[colIndex['Текущий контроль']]),
        login: String(row[colIndex['ЛОГИН']] || ''),
        password: String(row[colIndex['ПАРОЛЬ']] || ''),
        supervisors: parseSupervisor(row[colIndex['руководитель ']] || row[colIndex['руководитель']]),
        sessionStart: null,
        sessionEnd: null,
        allowances: [],
        rivshCertificate: 'нет',
        entryByInvitation: 'нет',
        distributionInfo: '',
        extensions: [],
        examDate: parseExcelDate(row[colIndex['Итоговый экзамен']])
      };
      
      ordinators.push(ordinator);
    }
    
    return ordinators;
  };

  const detectFileType = (rows) => {
    const headers = rows[0];
    if (headers.includes('ФИО на англ.языке') || headers.includes('Страна')) {
      return 'foreign';
    }
    if (headers.includes('Ф.И.О.') && headers.includes('номер диплома')) {
      return 'belarus';
    }
    return 'unknown';
  };

  const sendToServer = async (ordinators) => {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < ordinators.length; i++) {
      const ord = ordinators[i];
      setProgress({
        current: i + 1,
        total: ordinators.length,
        status: `Обработка: ${ord.fio || ord.fioEn || `запись ${i + 1}`}`
      });

      try {
        const token = localStorage.getItem('auth_token');
        
        const apiData = {
          fio: ord.fio,
          fioEn: ord.fioEn || '',
          birthYear: ord.birthYear,
          gender: ord.gender,
          country: ord.country,
          enrollmentDate: ord.enrollmentDate,
          dismissalDate: ord.dismissalDate,
          dismissalReason: ord.dismissalReason || '',
          socialLeaves: ord.socialLeaves || [],
          mobilePhone: ord.mobilePhone || '',
          universityName: ord.universityName,
          graduationYear: ord.graduationYear,
          department: ord.department,
          specialtyProfile: ord.specialtyProfile || '',
          specialty: ord.specialty || '',
          preparationForm: ord.preparationForm,
          identityDocument: ord.identityDocument,
          documentNumber: ord.documentNumber || '',
          identNumber: ord.identNumber || '',
          residenceAddress: ord.residenceAddress,
          livingAddress: ord.livingAddress || '',
          registrationExpiry: ord.registrationExpiry,
          enrollmentOrderNumber: ord.enrollmentOrderNumber || '',
          enrollmentOrderDate: ord.enrollmentOrderDate,
          dismissalOrderNumber: ord.dismissalOrderNumber || '',
          dismissalOrderDate: ord.dismissalOrderDate,
          contractInfo: ord.contractInfo || '',
          medicalCertificate: ord.medicalCertificate,
          currentControl: ord.currentControl,
          login: ord.login || '',
          password: ord.password || '',
          supervisors: ord.supervisors || [],
          sessionStart: ord.sessionStart,
          sessionEnd: ord.sessionEnd,
          allowances: ord.allowances || [],
          rivshCertificate: ord.rivshCertificate,
          entryByInvitation: ord.entryByInvitation,
          distributionInfo: ord.distributionInfo || '',
          extensions: ord.extensions || [],
          examDate: ord.examDate
        };

        Object.keys(apiData).forEach(key => {
          if (apiData[key] === null || apiData[key] === undefined) delete apiData[key];
          if (Array.isArray(apiData[key]) && apiData[key].length === 0) delete apiData[key];
        });

        const response = await fetch(`${API_URL}/ordinators`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiData)
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          errorCount++;
          errors.push({ name: ord.fio || ord.fioEn || `запись ${i + 1}`, error: errorData.message || `HTTP ${response.status}` });
        }
      } catch (error) {
        errorCount++;
        errors.push({ name: ord.fio || ord.fioEn || `запись ${i + 1}`, error: error.message });
      }
    }

    return { successCount, errorCount, errors };
  };

  const handleImport = async () => {
    if (!file) {
      alert('Выберите файл для импорта');
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: 0, status: 'Чтение файла...' });
    setResult(null);

    try {
      const rows = await parseExcelToJson(file);
      if (rows.length < 2) throw new Error('Файл не содержит данных');

      const fileType = detectFileType(rows);
      let ordinators = [];

      if (fileType === 'belarus') {
        setProgress({ current: 0, total: 0, status: 'Обработка белорусских ординаторов...' });
        ordinators = parseBelarusFile(rows);
      } else if (fileType === 'foreign') {
        setProgress({ current: 0, total: 0, status: 'Обработка иностранных ординаторов...' });
        ordinators = parseForeignFile(rows);
      } else {
        throw new Error('Не удалось определить тип файла. Убедитесь, что вы загружаете файл "ординаторы ИГ" или "ординаторы РБ"');
      }

      if (ordinators.length === 0) throw new Error('Не найдено данных для импорта');

      setProgress({ current: 0, total: ordinators.length, status: 'Отправка на сервер...' });
      const { successCount, errorCount, errors } = await sendToServer(ordinators);

      setResult({ success: successCount, errors: errorCount, total: ordinators.length, errorDetails: errors });
    } catch (error) {
      setResult({ success: 0, errors: 1, total: 0, errorDetails: [{ name: 'Ошибка', error: error.message }] });
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, status: '' });
    }
  };

  const downloadErrorReport = () => {
    if (!result?.errorDetails?.length) return;
    const report = result.errorDetails.map(err => `Запись: ${err.name}\nОшибка: ${err.error}\n${'-'.repeat(50)}`).join('\n');
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="import-data-container">
      <div className="import-header">
        <h1>Импорт данных из Excel</h1>
        <p>Загрузите файл "ординаторы ИГ.xls" (иностранцы) или "ординаторы РБ.xls" (белорусы)</p>
      </div>

      <div className="import-card">
        <div className="file-upload-area">
          <label className="file-label">
            <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} disabled={loading} className="file-input" />
            <div className="file-button">📁 Выберите файл Excel</div>
          </label>
          {file && <div className="file-info">📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</div>}
        </div>

        <button onClick={handleImport} disabled={!file || loading} className={`import-button ${loading ? 'loading' : ''}`}>
          {loading ? 'Импорт...' : '🚀 Начать импорт'}
        </button>

        {loading && progress.total > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
            <div className="progress-text">{progress.status} ({progress.current}/{progress.total})</div>
          </div>
        )}

        {result && (
          <div className={`result-card ${result.errors > 0 ? 'has-errors' : 'success'}`}>
            <div className="result-header">
              <h3>Результат импорта</h3>
              <span className={`result-badge ${result.errors > 0 ? 'error' : 'success'}`}>
                {result.errors > 0 ? 'Частично успешно' : 'Успешно'}
              </span>
            </div>
            <div className="result-stats">
              <div className="stat"><span className="stat-value">{result.total}</span><span className="stat-label">Всего</span></div>
              <div className="stat success"><span className="stat-value">{result.success}</span><span className="stat-label">Успешно</span></div>
              <div className="stat error"><span className="stat-value">{result.errors}</span><span className="stat-label">Ошибок</span></div>
            </div>
            
            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="error-details">
                <div className="error-header">
                  <span>⚠️ Детали ошибок:</span>
                  <button onClick={downloadErrorReport} className="download-report">📥 Скачать отчёт</button>
                </div>
                <div className="error-list">
                  {result.errorDetails.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="error-item"><strong>{err.name}</strong>: {err.error}</div>
                  ))}
                  {result.errorDetails.length > 10 && <div className="error-more">... и ещё {result.errorDetails.length - 10} ошибок</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="info-section">
        <h3>📋 Инструкция</h3>
        <ul>
          <li><strong>ординаторы ИГ.xls</strong> — файл с иностранными ординаторами</li>
          <li><strong>ординаторы РБ.xls</strong> — файл с белорусскими ординаторами</li>
          <li>Система автоматически определит тип файла по заголовкам</li>
          <li>Для белорусов: колонка "форма обучения" (бюджет/платно), следующая пустая колонка (заочная/очная)</li>
          <li>Для иностранцев: все основные данные импортируются из соответствующих колонок</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportData;