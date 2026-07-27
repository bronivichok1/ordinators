import { formatDateToAPI, formatDateToDisplay, formatYearFromDate, formatPreparationForm } from './dateUtils';
import { COLUMN_NAMES } from './constants';

export const transformApiDataToTable = (apiData) => {
  return apiData.map((ordinator) => {
    const row = {};
    row.column1 = ordinator.fio || '';
    row.column2 = ordinator.fioEn || '';
    row.column3 = formatDateToDisplay(ordinator.enrollmentDate) || '';
    row.column4 = ordinator.gender || 'М';
    row.column5 = ordinator.country || '';
    row.column6 = formatDateToDisplay(ordinator.enrollmentDate) || '';
    row.column7 = formatDateToDisplay(ordinator.dismissalDate) || '';
    row.column8 = ordinator.dismissalReason || '';
    
    if (ordinator.socialLeaves && Array.isArray(ordinator.socialLeaves)) {
      row.column9 = JSON.stringify(ordinator.socialLeaves);
    } else {
      row.column9 = JSON.stringify([]);
    }
    
    row.column10 = ordinator.mobilePhone || '';
    
    if (ordinator.university) {
      row.column11 = ordinator.university.name || '';
      let graduationYear = ordinator.university.graduationYear;
      if (graduationYear) {
        if (typeof graduationYear === 'string') {
          graduationYear = graduationYear.split('-')[0];
        } else if (graduationYear instanceof Date) {
          graduationYear = graduationYear.getFullYear().toString();
        } else if (typeof graduationYear === 'number') {
          graduationYear = graduationYear.toString();
        }
      }
      row.column12 = graduationYear || '';
      row.column13 = ordinator.university.department || '';
      row.column14 = ordinator.university.specialtyProfile || '';
      row.column15 = ordinator.university.specialty || '';
      let prepForm = ordinator.university.preparationForm;
      if (prepForm && typeof prepForm === 'object') {
        prepForm = JSON.stringify(prepForm);
      } else if (!prepForm) {
        prepForm = JSON.stringify(['']);
      }
      row.column16 = prepForm;
    } else {
      row.column11 = '';
      row.column12 = '';
      row.column13 = '';
      row.column14 = '';
      row.column15 = '';
      row.column16 = JSON.stringify(['']);
    }
    
    row.column17 = ordinator.identityDocument || '';
    row.column18 = ordinator.documentNumber || '';
    row.column19 = ordinator.identNumber || '';
    row.column20 = ordinator.residenceAddress || '';
    row.column21 = ordinator.livingAddress || '';
    row.column22 = formatDateToDisplay(ordinator.registrationExpiry) || '';
    row.column23 = ordinator.enrollmentOrderNumber || '';
    row.column24 = formatDateToDisplay(ordinator.enrollmentOrderDate) || '';
    row.column25 = ordinator.dismissalOrderNumber || '';
    row.column26 = formatDateToDisplay(ordinator.dismissalOrderDate) || '';
    
    if (ordinator.extensions && Array.isArray(ordinator.extensions)) {
      row.column27 = JSON.stringify(ordinator.extensions);
    } else {
      row.column27 = JSON.stringify([]);
    }
    
    row.column28 = ordinator.contractInfo || '';
    row.column29 = ordinator.medicalCertificate || 'есть';
    
    if (ordinator.currentControl) {
      row.column30 = formatDateToDisplay(ordinator.currentControl.scores) || '';
    } else {
      row.column30 = '';
    }
    
    row.column31 = ordinator.login || '';
    row.column32 = ordinator.password || '';
    
    if (ordinator.supervisors && Array.isArray(ordinator.supervisors)) {
      row.column33 = JSON.stringify(ordinator.supervisors);
    } else {
      row.column33 = JSON.stringify([]);
    }
    
    if (ordinator.session) {
      row.column34 = formatDateToDisplay(ordinator.session.sessionStart) || '';
      row.column35 = formatDateToDisplay(ordinator.session.sessionEnd) || '';
    } else {
      row.column34 = '';
      row.column35 = '';
    }
    
    if (ordinator.allowances && Array.isArray(ordinator.allowances)) {
      row.column36 = JSON.stringify(ordinator.allowances);
    } else {
      row.column36 = JSON.stringify([]);
    }
    
    row.column38 = ordinator.rivshCertificate || 'нет';
    row.column39 = ordinator.entryByInvitation || 'нет';
    row.column40 = ordinator.distributionInfo || '';
    
    return {
      ...row,
      id: ordinator.id,
      originalData: ordinator
    };
  });
};

export const transformTableDataToApi = (tableData, mode = 'create', modalState = {}) => {
  let preparationFormValue = tableData.column16 || '';

  if (typeof preparationFormValue === 'string') {
    try {
      const parsed = JSON.parse(preparationFormValue);
      if (Array.isArray(parsed)) {
        preparationFormValue = JSON.stringify(parsed);
      } else {
        preparationFormValue = JSON.stringify([parsed]);
      }
    } catch {
      if (preparationFormValue) {
        preparationFormValue = JSON.stringify([preparationFormValue]);
      } else {
        preparationFormValue = JSON.stringify([]);
      }
    }
  } else if (Array.isArray(preparationFormValue)) {
    preparationFormValue = JSON.stringify(preparationFormValue);
  } else {
    preparationFormValue = JSON.stringify([]);
  }

  let socialLeavesValue = [];
  try {
    const parsed = JSON.parse(tableData.column9 || '[]');
    if (Array.isArray(parsed)) {
      socialLeavesValue = parsed.map(leave => ({
        startDate: leave.startDate ? new Date(formatDateToAPI(leave.startDate)) : null,
        endDate: leave.endDate ? new Date(formatDateToAPI(leave.endDate)) : null,
        reason: leave.reason || ''
      }));
    }
  } catch {
    socialLeavesValue = [];
  }

  let supervisorsValue = [];
  try {
    const parsed = JSON.parse(tableData.column33 || '[]');
    if (Array.isArray(parsed)) {
      supervisorsValue = parsed.map(sup => ({
        supervisorName: sup.supervisorName || '',
        position: sup.position || '',
        rank: sup.rank || '',
        startDate: sup.startDate ? new Date(formatDateToAPI(sup.startDate)) : null,
        endDate: sup.endDate ? new Date(formatDateToAPI(sup.endDate)) : null
      }));
    }
  } catch {
    supervisorsValue = [];
  }

  let extensionsValue = [];
  try {
    const parsed = JSON.parse(tableData.column27 || '[]');
    if (Array.isArray(parsed)) {
      extensionsValue = parsed.map(ext => ({
        orderNumber: ext.orderNumber || '',
        orderDate: ext.orderDate ? formatDateToAPI(ext.orderDate) : null,
        extensionTerm: ext.extensionTerm || '1 год'
      }));
    }
  } catch {
    extensionsValue = [];
  }

  let allowancesValue = [];
  try {
    const parsed = JSON.parse(tableData.column36 || '[]');
    if (Array.isArray(parsed)) {
      allowancesValue = parsed.map(item => ({
        orderNumber: item.orderNumber || '',
        startDate: item.startDate ? new Date(formatDateToAPI(item.startDate)) : null,
        endDate: item.endDate ? new Date(formatDateToAPI(item.endDate)) : null
      }));
    }
  } catch {
    allowancesValue = [];
  }

  // ИСПРАВЛЕНО: преобразуем дату рождения в строку для валидации
  let birthDateString = null;
  if (tableData.column3) {
    // Если дата в формате DD.MM.YYYY
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(tableData.column3)) {
      birthDateString = tableData.column3;
    } 
    // Если дата в формате YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(tableData.column3)) {
      const [year, month, day] = tableData.column3.split('-');
      birthDateString = `${day}.${month}.${year}`;
    }
    // Если только год
    else if (/^\d{4}$/.test(tableData.column3)) {
      birthDateString = `01.01.${tableData.column3}`;
    }
  }

  const apiData = {
    fio: tableData.column1 || '',
    fioEn: tableData.column2 || '',
    birthYear: formatDateToAPI(tableData.column3),
    gender: tableData.column4 || 'М',
    country: tableData.column5 || 'Беларусь',
    enrollmentDate: formatDateToAPI(tableData.column6),
    dismissalDate: formatDateToAPI(tableData.column7),
    dismissalReason: tableData.column8 === 'иное' ? modalState.otherDismissalReason : tableData.column8 || '',
    socialLeaves: socialLeavesValue,
    mobilePhone: tableData.column10 || '',
    universityName: tableData.column11 === 'другое' ? modalState.otherUniversity : tableData.column11 || 'БГМУ',
    graduationYear: tableData.column12 ? `${tableData.column12}-01-01` : null,
    department: tableData.column13 || '',
    specialtyProfile: tableData.column15 || '',
    specialty: tableData.column14 || '',
    preparationForm: preparationFormValue,
    identityDocument: tableData.column17 === 'иное' ? modalState.otherDocument : tableData.column17 || 'паспорт',
    documentNumber: tableData.column18 || '',
    identNumber: tableData.column19 || '',
    residenceAddress: tableData.column20 || '',
    livingAddress: tableData.column21 || '',
    registrationExpiry: formatDateToAPI(tableData.column22),
    enrollmentOrderNumber: tableData.column23 || '',
    enrollmentOrderDate: formatDateToAPI(tableData.column24),
    dismissalOrderNumber: tableData.column25 || '',
    dismissalOrderDate: formatDateToAPI(tableData.column26),
    extensions: extensionsValue,
    contractInfo: tableData.column28 || '',
    medicalCertificate: tableData.column29 || 'есть',
    scores: tableData.column30 || null,
    login: tableData.column31 || '',
    password: tableData.column32 || '',
    supervisors: supervisorsValue,
    sessionStart: formatDateToAPI(tableData.column34),
    sessionEnd: formatDateToAPI(tableData.column35),
    allowances: allowancesValue,
    rivshCertificate: tableData.column38 || 'нет',
    entryByInvitation: tableData.column39 || 'нет',
    distributionInfo: tableData.column40 || ''
  };

  Object.keys(apiData).forEach(key => apiData[key] === undefined && delete apiData[key]);
  return apiData;
};

export const prepareDataForExport = (data, selectedRows, selectedColumns) => {
  const selectedData = data.filter(row => selectedRows.has(row.id));
  
  if (selectedData.length === 0) {
    return null;
  }

  return selectedData.map(row => {
    const exportRow = {};
    exportRow['ID'] = row.id;
    selectedColumns.forEach(colIndex => {
      const columnKey = `column${colIndex}`;
      if (row[columnKey] !== undefined) {
        let value = row[columnKey] || '';
        
        if (colIndex === 16) {
          value = formatPreparationForm(value);
        }
        
        if (colIndex === 9) {
          try {
            const leaves = JSON.parse(value);
            if (Array.isArray(leaves)) {
              value = leaves.map(l => `${l.startDate || ''} - ${l.endDate || ''} (${l.reason || ''})`).join('; ');
            } else {
              value = '';
            }
          } catch {
            value = '';
          }
        }
        
        if (colIndex === 27) {
          try {
            const extensions = JSON.parse(value);
            if (Array.isArray(extensions) && extensions.length > 0) {
              value = extensions.map(ext => 
                `${ext.orderNumber || ''} (${ext.orderDate || ''}, срок: ${ext.extensionTerm || '1 год'})`
              ).join('; ');
            } else {
              value = '';
            }
          } catch {
            value = '';
          }
        }
        
        if (colIndex === 36) {
          try {
            const allowances = JSON.parse(value);
            if (Array.isArray(allowances) && allowances.length > 0) {
              value = allowances.map(allow => 
                `${allow.orderNumber || ''} (${allow.startDate || ''} - ${allow.endDate || ''})`
              ).join('; ');
            } else {
              value = '';
            }
          } catch {
            value = '';
          }
        }
        
        if (colIndex === 33) {
          try {
            const supervisors = JSON.parse(value);
            if (Array.isArray(supervisors) && supervisors.length > 0) {
              value = supervisors.map(sup => {
                let name = sup.supervisorName || '—';
                if (sup.position) name += `, ${sup.position}`;
                if (sup.rank) name += ` (${sup.rank})`;
                if (sup.startDate) name += ` с ${formatDateToDisplay(sup.startDate)}`;
                if (sup.endDate) name += ` по ${formatDateToDisplay(sup.endDate)}`;
                return name;
              }).join('; ');
            } else {
              value = '';
            }
          } catch {
            value = '';
          }
        }
        
        exportRow[COLUMN_NAMES[colIndex]] = value;
      }      
    });
    return exportRow;
  });
};