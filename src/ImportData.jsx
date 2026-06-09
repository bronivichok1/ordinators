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

  const detectFileType = (headers) => {
    // Файл с иностранными ординаторами
    const isForeignFile = headers.some(h => 
      h === 'ФИО на англ.языке' || 
      h === 'вид на жительство' || 
      h === 'номер паспорта' ||
      h === 'Страна'
    );
    
    // Файл с белорусскими ординаторами
    const isBelarusFile = headers.some(h => 
      h === 'номер диплома' || 
      h === 'идентификационные номера' ||
      h === 'Ф.И.О.'
    );
    
    if (isForeignFile) return 'foreign';
    if (isBelarusFile) return 'belarus';
    return 'unknown';
  };

  const formatDateToAPI = (dateValue) => {
    if (!dateValue) return null;
    
    if (typeof dateValue === 'number') {
      const date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return null;
    }
    
    const dateStr = String(dateValue).trim();
    
    // Формат ДД.ММ.ГГГГ
    const dotMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dotMatch) {
      const [_, day, month, year] = dotMatch;
      return `${year}-${month}-${day}`;
    }
    
    // Формат ГГГГ-ММ-ДД
    const dashMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dashMatch) {
      return dateStr;
    }
    
    // Пробуем стандартный парсинг
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };

  const parseBirthYear = (yearValue) => {
    if (!yearValue) return null;
    if (typeof yearValue === 'number') {
      return String(Math.floor(yearValue));
    }
    const yearStr = String(yearValue);
    const match = yearStr.match(/\d{4}/);
    return match ? match[0] : null;
  };

  const parseUniversityAndYear = (universityStr) => {
    if (!universityStr) return { universityName: 'БГМУ', graduationYear: null };
    
    const str = String(universityStr);
    const parts = str.split(',').map(p => p.trim());
    
    let universityName = parts[0] || 'БГМУ';
    let graduationYear = null;
    
    for (let i = 1; i < parts.length; i++) {
      const yearMatch = parts[i].match(/\d{4}/);
      if (yearMatch) {
        graduationYear = parseInt(yearMatch[0]);
        break;
      }
    }
    
    // Нормализация названий вузов
    const universityMap = {
      'БГМУ': 'БГМУ',
      'Белорусский государственный медицинский университет': 'БГМУ',
      'ВГМУ': 'ВГМУ',
      'Витебский государственный медицинский университет': 'ВГМУ',
      'ГомГМУ': 'ГомГМУ',
      'Гомельский государственный медицинский университет': 'ГомГМУ',
      'ГрГМУ': 'ГрГМУ',
      'Гродненский государственный медицинский университет': 'ГрГМУ'
    };
    
    return {
      universityName: universityMap[universityName] || universityName,
      graduationYear
    };
  };

  const formatPreparationForm = (formValue) => {
    if (!formValue) return JSON.stringify(['очная']);
    
    const formStr = String(formValue).toLowerCase();
    if (formStr.includes('очная') || formStr === 'очно' || formStr === 'оч') {
      return JSON.stringify(['очная']);
    }
    if (formStr.includes('заочная') || formStr === 'заочно') {
      return JSON.stringify(['заочная']);
    }
    if (formStr.includes('платная') || formStr.includes('платно')) {
      return JSON.stringify(['платно']);
    }
    if (formStr.includes('бюджет')) {
      return JSON.stringify(['за счёт бюджета']);
    }
    
    return JSON.stringify(['очная']);
  };

  const normalizeDepartment = (department) => {
    if (!department) return '';
    const dept = String(department).trim();
    
    // Сопоставление коротких названий с полными
    const departmentMap = {
      'Кафедра акушерства и гинекологии': 'Кафедра акушерства и гинекологии с курсом повышения квалификации и переподготовки',
      'Кафедра анестезиологии и реаниматологии': 'Кафедра анестезиологии и реаниматологии с курсом повышения квалификации и переподготовки',
      'Кафедра внутренних болезней': 'Кафедра внутренних болезней, гастроэнтерологии и нутрициологии с курсом повышения квалификации и переподготовки',
      'Кафедра дерматовенерологии и косметологии': 'Кафедра дерматовенерологии и косметологии с курсом повышения квалификации и переподготовки',
      'Кафедра детской хирургии': 'Кафедра детской хирургии с курсом повышения квалификации и переподготовки',
      'Кафедра инфекционных болезней': 'Кафедра инфекционных болезней с курсом повышения квалификации и переподготовки',
      'Кафедра онкологии': 'Кафедра онкологии с курсом повышения квалификации и переподготовки',
      'Кафедра оториноларингологии': 'Кафедра оториноларингологии с курсом повышения квалификации и переподготовки',
      'Кафедра травматологии и ортопедии': 'Кафедра травматологии и ортопедии с курсом повышения квалификации и переподготовки',
      'Кафедра урологии и нефрологии': 'Кафедра урологии и нефрологии с курсом повышения квалификации и переподготовки',
      'Кафедра хирургии': 'Кафедра хирургии и трансплантологии с курсом повышения квалификации и переподготовки',
      'Кафедра хирургических болезней': 'Кафедра хирургических болезней с курсом повышения квалификации и переподготовки',
      'Кафедра челюстно-лицевой хирургии': 'Кафедра челюстно-лицевой хирургии и пластической хирургии лица с курсом повышения квалификации и переподготовки'
    };
    
    for (const [key, value] of Object.entries(departmentMap)) {
      if (dept.includes(key) || key.includes(dept)) {
        return value;
      }
    }
    
    return dept;
  };

  const parseSupervisors = (supervisorStr) => {
    if (!supervisorStr) return [];
    
    const supervisorText = String(supervisorStr).trim();
    if (!supervisorText) return [];
    
    const supervisors = [];
    
    // Извлекаем имя (до должности или звания)
    let name = supervisorText;
    let position = '';
    let rank = '';
    
    // Пытаемся извлечь должность и звание
    const positionMatch = supervisorText.match(/(доцент|профессор|старший преподаватель|ассистент|зав\. кафедрой)/i);
    if (positionMatch) {
      position = positionMatch[0];
      name = supervisorText.replace(positionMatch[0], '').trim();
    }
    
    const rankMatch = name.match(/(к\.м\.н\.|д\.м\.н\.|PhD)/i);
    if (rankMatch) {
      rank = rankMatch[0];
      name = name.replace(rankMatch[0], '').trim();
    }
    
    // Убираем лишние символы
    name = name.replace(/^\s*[-–]\s*/, '').trim();
    
    if (name) {
      supervisors.push({
        supervisorName: name,
        position: position,
        rank: rank,
        startDate: null,
        endDate: null
      });
    }
    
    return supervisors;
  };

  const parseForeignFile = (rows) => {
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const ordinators = [];

    const colIndex = {
      fio: headers.findIndex(h => h === 'ФИО'),
      fioEn: headers.findIndex(h => h === 'ФИО на англ.языке'),
      birthYear: headers.findIndex(h => h === 'год рождения'),
      gender: headers.findIndex(h => h === 'пол'),
      country: headers.findIndex(h => h === 'Страна'),
      enrollmentDate: headers.findIndex(h => h === 'Зачисление'),
      dismissalDate: headers.findIndex(h => h === 'Отчисление'),
      dismissalReason: headers.findIndex(h => h === 'Причина отчисления'),
      mobilePhone: headers.findIndex(h => h === 'Моб.тел.'),
      university: headers.findIndex(h => h === 'какой ВВУЗ закончил'),
      department: headers.findIndex(h => h === 'Название кафедры'),
      specialtyProfile: headers.findIndex(h => h === 'профили'),
      specialty: headers.findIndex(h => h === 'Специальность'),
      identityDocument: headers.findIndex(h => h === 'вид на жительство'),
      documentNumber: headers.findIndex(h => h === 'номер паспорта'),
      identNumber: headers.findIndex(h => h === 'идентификационный номер'),
      residenceAddress: headers.findIndex(h => h === 'регистрация'),
      livingAddress: headers.findIndex(h => h === 'Адрес проживания'),
      registrationExpiry: headers.findIndex(h => h === 'Срок окончания регистрации'),
      enrollmentOrderNumber: headers.findIndex(h => h === 'Номер приказа о зачислении'),
      enrollmentOrderDate: headers.findIndex(h => h === 'Дата приказа о зачислении'),
      dismissalOrderNumber: headers.findIndex(h => h === 'Номер приказа об отчислении'),
      dismissalOrderDate: headers.findIndex(h => h === 'Дата приказа об отчислении'),
      contractInfo: headers.findIndex(h => h === 'Договор, дополнительное соглашение'),
      medicalCertificate: headers.findIndex(h => h === 'мед.спр.'),
      login: headers.findIndex(h => h === 'ЛОГИН'),
      password: headers.findIndex(h => h === 'ПАРОЛЬ'),
      supervisor: headers.findIndex(h => h === 'руководитель'),
      sessionStart: headers.findIndex(h => h === 'Дата начала сессии(циклов)'),
      sessionEnd: headers.findIndex(h => h === 'Дата окончания сессии(циклов)'),
      rivshCertificate: headers.findIndex(h => h === 'РИВШ'),
      entryByInvitation: headers.findIndex(h => h === 'Въезд по приглашению'),
      distributionInfo: headers.findIndex(h => h === 'Распределение клинических ординаторов'),
    };

    for (const row of dataRows) {
      if (!row[colIndex.fio] && !row[colIndex.fioEn]) continue;

      const genderValue = row[colIndex.gender] || '';
      let gender = 'М';
      if (genderValue === 'ж' || genderValue === 'Ж' || genderValue === 'женский') gender = 'Ж';

      const medicalValue = String(row[colIndex.medicalCertificate] || '').toLowerCase();
      let medicalCertificate = 'нет';
      if (medicalValue === 'есть' || medicalValue === 'да' || medicalValue === '1') medicalCertificate = 'есть';

      const rivshValue = String(row[colIndex.rivshCertificate] || '').toLowerCase();
      let rivshCertificate = 'нет';
      if (rivshValue === 'есть' || rivshValue === 'да' || rivshValue === '1' || rivshValue === 'справка') rivshCertificate = 'да';

      const { universityName, graduationYear } = parseUniversityAndYear(row[colIndex.university]);

      let department = normalizeDepartment(row[colIndex.department]);
      let specialtyProfile = row[colIndex.specialtyProfile] || '';
      let specialty = row[colIndex.specialty] || '';

      let livingAddress = row[colIndex.livingAddress] || '';
      if (!livingAddress && row[colIndex.residenceAddress]) {
        livingAddress = row[colIndex.residenceAddress];
      }

      let residenceAddress = 'общежитие';
      const residenceValue = String(row[colIndex.residenceAddress] || '').toLowerCase();
      if (residenceValue.includes('квартир') || residenceValue.includes('ул.') || residenceValue.includes('пр-кт')) {
        residenceAddress = 'квартира';
      }

      let identityDocument = 'паспорт';
      const docValue = String(row[colIndex.identityDocument] || '').toLowerCase();
      if (docValue.includes('иностран') || docValue.includes('иг')) identityDocument = 'паспорт ИГ';
      if (docValue.includes('вид')) identityDocument = 'вид на жительство';

      // Форма подготовки (по умолчанию очная)
      const preparationForm = formatPreparationForm('очная');

      const supervisors = parseSupervisors(row[colIndex.supervisor]);

      const ordinator = {
        fio: String(row[colIndex.fio] || ''),
        fioEn: String(row[colIndex.fioEn] || ''),
        birthYear: parseBirthYear(row[colIndex.birthYear]),
        gender: gender,
        country: String(row[colIndex.country] || 'Беларусь'),
        enrollmentDate: formatDateToAPI(row[colIndex.enrollmentDate]),
        dismissalDate: formatDateToAPI(row[colIndex.dismissalDate]),
        dismissalReason: String(row[colIndex.dismissalReason] || ''),
        socialLeaves: [],
        mobilePhone: String(row[colIndex.mobilePhone] || ''),
        universityName: universityName,
        graduationYear: graduationYear,
        department: department,
        specialtyProfile: specialtyProfile,
        specialty: specialty,
        preparationForm: preparationForm,
        identityDocument: identityDocument,
        documentNumber: String(row[colIndex.documentNumber] || ''),
        identNumber: String(row[colIndex.identNumber] || ''),
        residenceAddress: residenceAddress,
        livingAddress: livingAddress,
        registrationExpiry: formatDateToAPI(row[colIndex.registrationExpiry]),
        enrollmentOrderNumber: String(row[colIndex.enrollmentOrderNumber] || ''),
        enrollmentOrderDate: formatDateToAPI(row[colIndex.enrollmentOrderDate]),
        dismissalOrderNumber: String(row[colIndex.dismissalOrderNumber] || ''),
        dismissalOrderDate: formatDateToAPI(row[colIndex.dismissalOrderDate]),
        contractInfo: String(row[colIndex.contractInfo] || ''),
        medicalCertificate: medicalCertificate,
        currentControl: null,
        login: String(row[colIndex.login] || ''),
        password: String(row[colIndex.password] || ''),
        supervisors: supervisors,
        sessionStart: formatDateToAPI(row[colIndex.sessionStart]),
        sessionEnd: formatDateToAPI(row[colIndex.sessionEnd]),
        allowances: [],
        rivshCertificate: rivshCertificate,
        entryByInvitation: String(row[colIndex.entryByInvitation] || 'нет'),
        distributionInfo: String(row[colIndex.distributionInfo] || ''),
      };

      if (ordinator.fio || ordinator.fioEn) {
        ordinators.push(ordinator);
      }
    }

    return ordinators;
  };

  const parseBelarusFile = (rows) => {
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const ordinators = [];

    const colIndex = {
      fio: headers.findIndex(h => h === 'Ф.И.О.'),
      gender: headers.findIndex(h => h === 'пол'),
      department: headers.findIndex(h => h === 'Название кафедры'),
      specialty: headers.findIndex(h => h === 'Специальность'),
      supervisor: headers.findIndex(h => h === 'руководитель'),
      mobilePhone: headers.findIndex(h => h === 'Моб.тел.'),
      livingAddress: headers.findIndex(h => h === 'Домашний адрес'),
      diplomaNumber: headers.findIndex(h => h === 'номер диплома'),
      identNumber: headers.findIndex(h => h === 'идентификационные номера'),
      enrollmentDate: headers.findIndex(h => h === 'Зачисление'),
      dismissalDate: headers.findIndex(h => h === 'Отчисление'),
      currentControl: headers.findIndex(h => h === 'Текущий контроль'),
      login: headers.findIndex(h => h === 'ЛОГИН'),
      password: headers.findIndex(h => h === 'ПАРОЛЬ'),
      preparationForm: headers.findIndex(h => h === 'форма обучения'),
    };

    for (const row of dataRows) {
      if (!row[colIndex.fio]) continue;

      const genderValue = row[colIndex.gender] || '';
      let gender = 'М';
      if (genderValue === 'ж' || genderValue === 'Ж') gender = 'Ж';

      let department = normalizeDepartment(row[colIndex.department]);
      let specialty = row[colIndex.specialty] || '';
      
      const preparationForm = formatPreparationForm(row[colIndex.preparationForm]);

      const supervisors = parseSupervisors(row[colIndex.supervisor]);

      const ordinator = {
        fio: String(row[colIndex.fio] || ''),
        fioEn: '',
        birthYear: null,
        gender: gender,
        country: 'Беларусь',
        enrollmentDate: formatDateToAPI(row[colIndex.enrollmentDate]),
        dismissalDate: formatDateToAPI(row[colIndex.dismissalDate]),
        dismissalReason: '',
        socialLeaves: [],
        mobilePhone: String(row[colIndex.mobilePhone] || ''),
        universityName: 'БГМУ',
        graduationYear: null,
        department: department,
        specialtyProfile: '',
        specialty: specialty,
        preparationForm: preparationForm,
        identityDocument: 'паспорт',
        documentNumber: String(row[colIndex.diplomaNumber] || ''),
        identNumber: String(row[colIndex.identNumber] || ''),
        residenceAddress: 'общежитие',
        livingAddress: String(row[colIndex.livingAddress] || ''),
        registrationExpiry: null,
        enrollmentOrderNumber: '',
        enrollmentOrderDate: null,
        dismissalOrderNumber: '',
        dismissalOrderDate: null,
        contractInfo: '',
        medicalCertificate: 'есть',
        currentControl: null,
        login: String(row[colIndex.login] || ''),
        password: String(row[colIndex.password] || ''),
        supervisors: supervisors,
        sessionStart: null,
        sessionEnd: null,
        allowances: [],
        rivshCertificate: 'нет',
        entryByInvitation: 'нет',
        distributionInfo: '',
      };

      ordinators.push(ordinator);
    }

    return ordinators;
  };

  const sendToServer = async (ordinators) => {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < ordinators.length; i++) {
      const ordinator = ordinators[i];
      setProgress({
        current: i + 1,
        total: ordinators.length,
        status: `Обработка: ${ordinator.fio || `запись ${i + 1}`}`
      });

      try {
        const token = localStorage.getItem('auth_token');
        
        const apiData = {
          fio: ordinator.fio,
          fioEn: ordinator.fioEn,
          birthYear: ordinator.birthYear ? `${ordinator.birthYear}-01-01` : null,
          gender: ordinator.gender,
          country: ordinator.country,
          enrollmentDate: ordinator.enrollmentDate,
          dismissalDate: ordinator.dismissalDate,
          dismissalReason: ordinator.dismissalReason,
          socialLeaves: ordinator.socialLeaves,
          mobilePhone: ordinator.mobilePhone,
          university: {
            name: ordinator.universityName,
            graduationYear: ordinator.graduationYear ? `${ordinator.graduationYear}-01-01` : null,
            department: ordinator.department,
            specialtyProfile: ordinator.specialtyProfile,
            specialty: ordinator.specialty,
            preparationForm: ordinator.preparationForm
          },
          identityDocument: ordinator.identityDocument,
          documentNumber: ordinator.documentNumber,
          identNumber: ordinator.identNumber,
          residenceAddress: ordinator.residenceAddress,
          livingAddress: ordinator.livingAddress,
          registrationExpiry: ordinator.registrationExpiry,
          enrollmentOrderNumber: ordinator.enrollmentOrderNumber,
          enrollmentOrderDate: ordinator.enrollmentOrderDate,
          dismissalOrderNumber: ordinator.dismissalOrderNumber,
          dismissalOrderDate: ordinator.dismissalOrderDate,
          extensions: [],
          contractInfo: ordinator.contractInfo,
          medicalCertificate: ordinator.medicalCertificate,
          currentControl: ordinator.currentControl ? { scores: ordinator.currentControl } : null,
          login: ordinator.login,
          password: ordinator.password,
          supervisors: ordinator.supervisors,
          session: (ordinator.sessionStart || ordinator.sessionEnd) ? {
            sessionStart: ordinator.sessionStart,
            sessionEnd: ordinator.sessionEnd
          } : null,
          allowances: ordinator.allowances,
          rivshCertificate: ordinator.rivshCertificate,
          entryByInvitation: ordinator.entryByInvitation,
          distributionInfo: ordinator.distributionInfo
        };

        // Удаляем null и undefined поля
        Object.keys(apiData).forEach(key => {
          if (apiData[key] === null || apiData[key] === undefined) {
            delete apiData[key];
          }
        });
        
        if (apiData.university) {
          Object.keys(apiData.university).forEach(key => {
            if (apiData.university[key] === null || apiData.university[key] === undefined) {
              delete apiData.university[key];
            }
          });
        }

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
          errors.push({
            name: ordinator.fio || `запись ${i + 1}`,
            error: errorData.message || `HTTP ${response.status}`
          });
        }
      } catch (error) {
        errorCount++;
        errors.push({
          name: ordinator.fio || `запись ${i + 1}`,
          error: error.message
        });
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
      if (rows.length < 2) {
        throw new Error('Файл не содержит данных');
      }

      const fileType = detectFileType(rows[0]);
      let ordinators = [];

      if (fileType === 'foreign') {
        setProgress({ current: 0, total: 0, status: 'Обработка файла иностранных ординаторов...' });
        ordinators = parseForeignFile(rows);
      } else if (fileType === 'belarus') {
        setProgress({ current: 0, total: 0, status: 'Обработка файла белорусских ординаторов...' });
        ordinators = parseBelarusFile(rows);
      } else {
        throw new Error('Не удалось определить тип файла. Убедитесь, что вы загружаете файл "ординаторы ИГ" или "ординаторы РБ"');
      }

      if (ordinators.length === 0) {
        throw new Error('Не найдено данных для импорта');
      }

      setProgress({ current: 0, total: ordinators.length, status: 'Отправка данных на сервер...' });
      const { successCount, errorCount, errors } = await sendToServer(ordinators);

      setResult({
        success: successCount,
        errors: errorCount,
        total: ordinators.length,
        errorDetails: errors,
        fileType: fileType
      });

    } catch (error) {
      setResult({
        success: 0,
        errors: 1,
        total: 0,
        errorDetails: [{ name: 'Ошибка', error: error.message }],
        fileType: 'error'
      });
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, status: '' });
    }
  };

  const downloadErrorReport = () => {
    if (!result?.errorDetails?.length) return;

    const report = result.errorDetails.map(err => 
      `Запись: ${err.name || 'Неизвестно'}\nОшибка: ${err.error}\n${'-'.repeat(50)}`
    ).join('\n');

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
        <p>Загрузите файл "ординаторы ИГ.xls" или "ординаторы РБ.xls" для автоматического импорта</p>
      </div>

      <div className="import-card">
        <div className="file-upload-area">
          <label className="file-label">
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
            <div className="file-button">
              📁 Выберите файл Excel
            </div>
          </label>
          {file && (
            <div className="file-info">
              <span className="file-name">📄 {file.name}</span>
              <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className={`import-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Импорт...' : '🚀 Начать импорт'}
        </button>

        {loading && progress.total > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              {progress.status} ({progress.current}/{progress.total})
            </div>
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
              <div className="stat">
                <span className="stat-value">{result.total}</span>
                <span className="stat-label">Всего записей</span>
              </div>
              <div className="stat success">
                <span className="stat-value">{result.success}</span>
                <span className="stat-label">Успешно</span>
              </div>
              <div className="stat error">
                <span className="stat-value">{result.errors}</span>
                <span className="stat-label">С ошибками</span>
              </div>
            </div>
            
            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="error-details">
                <div className="error-header">
                  <span>⚠️ Детали ошибок:</span>
                  <button onClick={downloadErrorReport} className="download-report">
                    📥 Скачать отчёт
                  </button>
                </div>
                <div className="error-list">
                  {result.errorDetails.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="error-item">
                      <strong>{err.name || 'Неизвестная запись'}</strong>: {err.error}
                    </div>
                  ))}
                  {result.errorDetails.length > 10 && (
                    <div className="error-more">
                      ... и ещё {result.errorDetails.length - 10} ошибок
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="info-section">
        <h3>📋 Инструкция по импорту</h3>
        <ul>
          <li><strong>Файл иностранных ординаторов (ординаторы ИГ)</strong> - содержит данные о студентах из других стран</li>
          <li><strong>Файл белорусских ординаторов (ординаторы РБ)</strong> - содержит данные о белорусских ординаторах</li>
          <li>Система автоматически определит тип файла</li>
          <li>Все обязательные поля заполняются значениями по умолчанию</li>
          <li>Данные будут добавлены в базу (дубликаты не проверяются автоматически)</li>
          <li>После импорта вы можете продолжить редактирование в основной таблице</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportData;