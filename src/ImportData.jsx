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
    const isForeignFile = headers.some(h => 
      h === 'ФИО на англ.языке' || 
      h === 'вид на жительство' || 
      h === 'номер паспорта'
    );
    const isBelarusFile = headers.some(h => 
      h === 'номер диплома' || 
      h === 'идентификационные номера'
    );
    
    if (isForeignFile) return 'foreign';
    if (isBelarusFile) return 'belarus';
    return 'unknown';
  };

  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === 'number') {
      const date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
      return date;
    }
    const dateStr = String(dateValue);
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
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
      socialLeave: headers.findIndex(h => h === 'Социальный отпуск'),
      socialLeaveStart: headers.findIndex(h => h === 'Дата начала социального отпуска'),
      socialLeaveEnd: headers.findIndex(h => h === 'Дата окончания социального отпуска'),
      mobilePhone: headers.findIndex(h => h === 'Моб.тел.'),
      university: headers.findIndex(h => h === 'какой ВВУЗ закончил'),
      department: headers.findIndex(h => h === 'Название кафедры'),
      specialtyProfile: headers.findIndex(h => h === 'профили'),
      specialty: headers.findIndex(h => h === 'Специальность'),
      preparationForm: headers.findIndex(h => h === 'форма обучения'),
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
      currentControl: headers.findIndex(h => h === 'Текущий контроль'),
      login: headers.findIndex(h => h === 'ЛОГИН'),
      password: headers.findIndex(h => h === 'ПАРОЛЬ'),
      supervisorName: headers.findIndex(h => h === 'руководитель'),
      sessionStart: headers.findIndex(h => h === 'Дата начала сессии(циклов)'),
      sessionEnd: headers.findIndex(h => h === 'Дата окончания сессии(циклов)'),
      allowanceStartDate: headers.findIndex(h => h === 'Дата установки надбавки'),
      allowanceEndDate: headers.findIndex(h => h === 'Дата окончания надбавки'),
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

      let preparationFormArray = [];
      const formValue = row[colIndex.preparationForm];
      if (formValue) {
        const formStr = String(formValue).toLowerCase();
        if (formStr.includes('очн')) preparationFormArray.push('очная');
        if (formStr.includes('заочн')) preparationFormArray.push('заочная');
      }
      const nextColIndex = colIndex.preparationForm + 1;
      const nextFormValue = row[nextColIndex];
      if (nextFormValue) {
        const nextFormStr = String(nextFormValue).toLowerCase();
        if (nextFormStr.includes('платн') || nextFormStr.includes('платно')) preparationFormArray.push('платно');
        if (nextFormStr.includes('бюджет')) preparationFormArray.push('за счёт бюджета');
      }

      let universityName = '';
      let graduationYear = null;
      const universityStr = row[colIndex.university] || '';
      const uniMatch = universityStr.match(/(.+?)(?:,\s*(\d{4}))?$/);
      if (uniMatch) {
        universityName = uniMatch[1].trim();
        if (uniMatch[2]) graduationYear = parseInt(uniMatch[2]);
      }

      if (universityName === 'БГМУ' || universityName === 'Белорусский государственный медицинский университет') universityName = 'БГМУ';
      if (universityName === 'ВГМУ' || universityName === 'Витебский государственный медицинский университет') universityName = 'ВГМУ';
      if (universityName === 'ГомГМУ' || universityName === 'Гомельский государственный медицинский университет') universityName = 'ГомГМУ';
      if (universityName === 'ГрГМУ' || universityName === 'Гродненский государственный медицинский университет') universityName = 'ГрГМУ';

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

      const ordinator = {
        fio: row[colIndex.fio] || '',
        fioEn: row[colIndex.fioEn] || '',
        birthYear: parseBirthYear(row[colIndex.birthYear]),
        gender: gender,
        country: row[colIndex.country] || '',
        enrollmentDate: parseDate(row[colIndex.enrollmentDate]),
        dismissalDate: parseDate(row[colIndex.dismissalDate]),
        dismissalReason: row[colIndex.dismissalReason] || '',
        socialLeave: row[colIndex.socialLeave] || '',
        socialLeaveStart: parseDate(row[colIndex.socialLeaveStart]),
        socialLeaveEnd: parseDate(row[colIndex.socialLeaveEnd]),
        mobilePhone: String(row[colIndex.mobilePhone] || ''),
        universityName: universityName || 'БГМУ',
        graduationYear: graduationYear,
        department: row[colIndex.department] || '',
        specialtyProfile: row[colIndex.specialtyProfile] || '',
        specialty: row[colIndex.specialty] || '',
        preparationForm: preparationFormArray.length > 0 ? JSON.stringify(preparationFormArray) : '',
        identityDocument: identityDocument,
        documentNumber: row[colIndex.documentNumber] || '',
        identNumber: row[colIndex.identNumber] || '',
        residenceAddress: residenceAddress,
        livingAddress: livingAddress,
        registrationExpiry: parseDate(row[colIndex.registrationExpiry]),
        enrollmentOrderNumber: row[colIndex.enrollmentOrderNumber] || '',
        enrollmentOrderDate: parseDate(row[colIndex.enrollmentOrderDate]),
        dismissalOrderNumber: row[colIndex.dismissalOrderNumber] || '',
        dismissalOrderDate: parseDate(row[colIndex.dismissalOrderDate]),
        contractInfo: row[colIndex.contractInfo] || '',
        medicalCertificate: medicalCertificate,
        currentControl: row[colIndex.currentControl] || '',
        login: row[colIndex.login] || '',
        password: String(row[colIndex.password] || ''),
        supervisorName: row[colIndex.supervisorName] || '',
        sessionStart: parseDate(row[colIndex.sessionStart]),
        sessionEnd: parseDate(row[colIndex.sessionEnd]),
        allowanceStartDate: parseDate(row[colIndex.allowanceStartDate]),
        allowanceEndDate: parseDate(row[colIndex.allowanceEndDate]),
        rivshCertificate: rivshCertificate,
        entryByInvitation: row[colIndex.entryByInvitation] || 'нет',
        distributionInfo: row[colIndex.distributionInfo] || '',
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
      preparationForm: headers.findIndex(h => h === 'форма обучения'),
      department: headers.findIndex(h => h === 'Название кафедры'),
      specialty: headers.findIndex(h => h === 'Специальность'),
      supervisorName: headers.findIndex(h => h === 'руководитель'),
      mobilePhone: headers.findIndex(h => h === 'Моб.тел.'),
      livingAddress: headers.findIndex(h => h === 'Домашний адрес'),
      diplomaNumber: headers.findIndex(h => h === 'номер диплома'),
      identNumber: headers.findIndex(h => h === 'идентификационные номера'),
      enrollmentDate: headers.findIndex(h => h === 'Зачисление'),
      dismissalDate: headers.findIndex(h => h === 'Отчисление'),
      currentControl: headers.findIndex(h => h === 'Текущий контроль'),
      login: headers.findIndex(h => h === 'ЛОГИН'),
      password: headers.findIndex(h => h === 'ПАРОЛЬ'),
    };

    for (const row of dataRows) {
      if (!row[colIndex.fio]) continue;

      let preparationFormArray = [];
      const formValue = row[colIndex.preparationForm];
      if (formValue) {
        const formStr = String(formValue).toLowerCase();
        if (formStr.includes('очн')) preparationFormArray.push('очная');
        if (formStr.includes('заочн')) preparationFormArray.push('заочная');
      }
      const nextColIndex = colIndex.preparationForm + 1;
      const nextFormValue = row[nextColIndex];
      if (nextFormValue) {
        const nextFormStr = String(nextFormValue).toLowerCase();
        if (nextFormStr.includes('платн') || nextFormStr.includes('платно')) preparationFormArray.push('платно');
        if (nextFormStr.includes('бюджет')) preparationFormArray.push('за счёт бюджета');
      }

      const genderValue = row[colIndex.gender] || '';
      let gender = 'М';
      if (genderValue === 'ж' || genderValue === 'Ж') gender = 'Ж';

      const ordinator = {
        fio: row[colIndex.fio] || '',
        fioEn: '',
        birthYear: null,
        gender: gender,
        country: 'Беларусь',
        enrollmentDate: parseDate(row[colIndex.enrollmentDate]),
        dismissalDate: parseDate(row[colIndex.dismissalDate]),
        dismissalReason: '',
        socialLeave: '',
        socialLeaveStart: null,
        socialLeaveEnd: null,
        mobilePhone: String(row[colIndex.mobilePhone] || ''),
        universityName: 'БГМУ',
        graduationYear: null,
        department: row[colIndex.department] || '',
        specialtyProfile: '',
        specialty: row[colIndex.specialty] || '',
        preparationForm: preparationFormArray.length > 0 ? JSON.stringify(preparationFormArray) : '',
        identityDocument: 'паспорт',
        documentNumber: row[colIndex.diplomaNumber] || '',
        identNumber: row[colIndex.identNumber] || '',
        residenceAddress: 'общежитие',
        livingAddress: row[colIndex.livingAddress] || '',
        registrationExpiry: null,
        enrollmentOrderNumber: '',
        enrollmentOrderDate: null,
        dismissalOrderNumber: '',
        dismissalOrderDate: null,
        contractInfo: '',
        medicalCertificate: 'есть',
        currentControl: row[colIndex.currentControl] || '',
        login: row[colIndex.login] || '',
        password: String(row[colIndex.password] || ''),
        supervisorName: row[colIndex.supervisorName] || '',
        sessionStart: null,
        sessionEnd: null,
        allowanceStartDate: null,
        allowanceEndDate: null,
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
        status: `Обработка: ${ordinator.fio || ordinator.fioEn || `запись ${i + 1}`}`
      });

      try {
        const token = localStorage.getItem('auth_token');
        
        const ordinatorData = {
          fio: String(ordinator.fio || ''),
          fioEn: String(ordinator.fioEn || ''),
          birthYear: ordinator.birthYear || null,
          gender: String(ordinator.gender || 'М'),
          country: String(ordinator.country || 'Беларусь'),
          enrollmentDate: ordinator.enrollmentDate,
          dismissalDate: ordinator.dismissalDate,
          dismissalReason: String(ordinator.dismissalReason || ''),
          socialLeave: String(ordinator.socialLeave || ''),
          socialLeaveStart: ordinator.socialLeaveStart,
          socialLeaveEnd: ordinator.socialLeaveEnd,
          mobilePhone: String(ordinator.mobilePhone || ''),
          universityName: String(ordinator.universityName || 'БГМУ'),
          graduationYear: ordinator.graduationYear ? String(ordinator.graduationYear) : null,
          department: String(ordinator.department || ''),
          specialtyProfile: String(ordinator.specialtyProfile || ''),
          specialty: String(ordinator.specialty || ''),
          preparationForm: ordinator.preparationForm || '',
          identityDocument: String(ordinator.identityDocument || 'паспорт'),
          documentNumber: String(ordinator.documentNumber || ''),
          identNumber: String(ordinator.identNumber || ''),
          residenceAddress: String(ordinator.residenceAddress || 'общежитие'),
          livingAddress: String(ordinator.livingAddress || ''),
          registrationExpiry: ordinator.registrationExpiry,
          enrollmentOrderNumber: String(ordinator.enrollmentOrderNumber || ''),
          enrollmentOrderDate: ordinator.enrollmentOrderDate,
          dismissalOrderNumber: String(ordinator.dismissalOrderNumber || ''),
          dismissalOrderDate: ordinator.dismissalOrderDate,
          contractInfo: String(ordinator.contractInfo || ''),
          medicalCertificate: String(ordinator.medicalCertificate || 'есть'),
          currentControl: String(ordinator.currentControl || ''),
          login: String(ordinator.login || ''),
          password: String(ordinator.password || ''),
          supervisorName: String(ordinator.supervisorName || ''),
          sessionStart: ordinator.sessionStart,
          sessionEnd: ordinator.sessionEnd,
          allowanceStartDate: ordinator.allowanceStartDate,
          allowanceEndDate: ordinator.allowanceEndDate,
          rivshCertificate: String(ordinator.rivshCertificate || 'нет'),
          entryByInvitation: String(ordinator.entryByInvitation || 'нет'),
          distributionInfo: String(ordinator.distributionInfo || ''),
        };

        Object.keys(ordinatorData).forEach(key => {
          if (ordinatorData[key] === null) {
            delete ordinatorData[key];
          }
        });

        const response = await fetch(`${API_URL}/ordinators`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(ordinatorData)
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          errorCount++;
          errors.push({
            name: ordinator.fio || ordinator.fioEn || `запись ${i + 1}`,
            error: errorData.message || `HTTP ${response.status}`
          });
        }
      } catch (error) {
        errorCount++;
        errors.push({
          name: ordinator.fio || ordinator.fioEn || `запись ${i + 1}`,
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