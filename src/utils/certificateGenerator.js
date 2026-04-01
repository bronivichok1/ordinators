import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const TEMPLATE_FILES = {
  1: 'Справка1.docx',
  2: 'Справка2.docx',
  3: 'Справка3.docx'
};

export const CERTIFICATE_TYPES = [
  { id: 1, name: 'Справка 1 (с приказом и договором)' },
  { id: 2, name: 'Справка 2 (простая, без приказа)' },
  { id: 3, name: 'Справка 3 (с графиком работы)' }
];

const numberToWords = (num) => {
  const words = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];
  return words[num] || num;
};

const getYearWord = (years) => {
  if (years === 1) return 'год';
  if (years >= 2 && years <= 4) return 'года';
  return 'лет';
};

const getMonthWord = (months) => {
  if (months === 1) return 'месяц';
  if (months >= 2 && months <= 4) return 'месяца';
  return 'месяцев';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}.${month}.${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
};

const formatStudyForm = (preparationForm) => {
  if (!preparationForm) return 'очная форма подготовки на платной основе';
  try {
    const forms = JSON.parse(preparationForm);
    if (Array.isArray(forms)) {
      let studyType = 'очная';
      let paymentType = 'на платной основе';
      
      if (forms.includes('очная')) studyType = 'очная';
      else if (forms.includes('заочная')) studyType = 'заочная';
      
      if (forms.includes('платно')) paymentType = 'на платной основе';
      else if (forms.includes('бюджет')) paymentType = 'за счёт бюджета';
      
      return `${studyType} форма подготовки ${paymentType}`;
    }
    return preparationForm;
  } catch {
    return preparationForm;
  }
};

const formatStudyPeriod = (years, months) => {
  const yearPart = years ? `${years} (${numberToWords(years)}) ${getYearWord(years)}` : '';
  const monthPart = months ? `${months} (${numberToWords(months)}) ${getMonthWord(months)}` : '';
  return [yearPart, monthPart].filter(Boolean).join(' ');
};

const parseContractInfo = (contractStr) => {
  if (!contractStr) return { date: '', number: '' };
  
  const dateMatch = contractStr.match(/(\d{2}\.\d{2}\.\d{4})/);
  const numberMatch = contractStr.match(/№\s*([^\s,]+)/);
  
  return {
    date: dateMatch ? dateMatch[1] : '',
    number: numberMatch ? numberMatch[1] : ''
  };
};

const getContactInfo = (userData) => {
  const contactMap = {
    'Бакей С.Л.': { name: 'Бакей', phone: '311 27 44' },
    'Буяк О.Ю.': { name: 'Буяк', phone: '311 27 49' },
    'Калечиц С.К.': { name: 'Калечиц', phone: '311 27 36' },
    'Лацепова Т.Л.': { name: 'Лацепова', phone: '311 27 44' },
    'Пензикова Л.В.': { name: 'Пензикова', phone: '311 27 49' }
  };
  
  if (!userData) {
    return { contactPerson: 'Бакей', contactPhone: '311 27 44' };
  }
  
  const userFio = userData.fio || userData.login || '';
  
  for (const [fullName, info] of Object.entries(contactMap)) {
    if (userFio.includes(fullName.split(' ')[0]) || userFio === fullName) {
      return { contactPerson: info.name, contactPhone: info.phone };
    }
  }
  
  return { contactPerson: 'Бакей', contactPhone: '311 27 44' };
};

const prepareData = (row, userData) => {
  const isMale = row.column4 === 'М';
  const country = row.column5;
  const contractInfo = parseContractInfo(row.column29 || '');
  
  let years = 2;
  let months = 0;
  
  const enrollmentDate = formatDate(row.column6);
  const dismissalDate = formatDate(row.column7);
  
  const getCountryInGenitive = (countryName) => {
    if (!countryName) return '';
    
    const countryExceptions = {
      'Беларусь': 'Беларуси',
      'Россия': 'России',
      'Украина': 'Украины',
      'Молдова': 'Молдовы',
      'Грузия': 'Грузии',
      'Армения': 'Армении',
      'Казахстан': 'Казахстана',
      'Узбекистан': 'Узбекистана',
      'Таджикистан': 'Таджикистана',
      'Туркменистан': 'Туркменистана',
      'Кыргызстан': 'Кыргызстана',
      'Азербайджан': 'Азербайджана',
      'Литва': 'Литвы',
      'Латвия': 'Латвии',
      'Эстония': 'Эстонии',
      'Польша': 'Польши',
      'Германия': 'Германии',
      'Франция': 'Франции',
      'Италия': 'Италии',
      'Испания': 'Испании',
      'США': 'США',
      'Китай': 'Китая',
      'Индия': 'Индии',
      'Турция': 'Турции'
    };
    
    return countryExceptions[countryName] || countryName;
  };
  
  const replaceKafedra = (text) => {
    if (!text) return '';
    return text.replace(/Кафедра|кафедра/g, 'кафедре');
  };
  
  const countryGenitive = getCountryInGenitive(country);
  const citizenPhrase = `${isMale ? 'гражданин' : 'гражданка'} ${countryGenitive}`;
  const { contactPerson, contactPhone } = getContactInfo(userData);

  return {
    fio: row.column1 || '',
    citizenPhrase: citizenPhrase,
    department: replaceKafedra(row.column15), 
    specialty: row.column17 || '',
    studyForm: formatStudyForm(row.column18),
    genderEnding: isMale ? '' : 'а',
    orderDate: formatDate(row.column26),
    orderNumber: row.column25 || '',
    paymentType: row.column18?.includes('бюджет') ? 'за счёт бюджета' : 'на платной основе',
    contractDate: contractInfo.date,
    contractNumber: contractInfo.number,
    studyPeriod: formatStudyPeriod(years, months),
    startDate: enrollmentDate,
    endDate: dismissalDate,
    contactPerson: contactPerson,
    contactPhone: contactPhone
  };
};

const loadTemplate = async (templateFile) => {
  const response = await fetch(`/templates/${encodeURIComponent(templateFile)}`);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить шаблон: ${templateFile}`);
  }
  return await response.arrayBuffer();
};

export const generateCertificate = async (certificateTypeId, rowData, userData, outputFileName = null) => {
  try {
    const templateFile = TEMPLATE_FILES[certificateTypeId];
    if (!templateFile) {
      throw new Error(`Неизвестный тип справки: ${certificateTypeId}`);
    }
    
    const data = prepareData(rowData, userData);
    const templateContent = await loadTemplate(templateFile);
    
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });
    
    doc.setData(data);
    doc.render();
    
    const generatedDoc = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE'
    });
    
    const certificateType = CERTIFICATE_TYPES.find(t => t.id === certificateTypeId);
    const fileName = outputFileName || 
      `${rowData.column1 || 'ординатор'}_${certificateType?.name || 'справка'}.docx`;
    
    saveAs(generatedDoc, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Ошибка генерации справки:', error);
    throw error;
  }
};

export const generateMultipleCertificates = async (selectedRows, selectedTypeIds, userData) => {
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of selectedRows) {
    for (const typeId of selectedTypeIds) {
      try {
        const certificateType = CERTIFICATE_TYPES.find(t => t.id === typeId);
        const fileName = `${row.column1 || 'ординатор'}_${certificateType?.name || 'справка'}.docx`;
        
        await generateCertificate(typeId, row, userData, fileName);
        
        successCount++;
        results.push({ 
          success: true, 
          fio: row.column1, 
          type: certificateType?.name,
          fileName 
        });
      } catch (error) {
        errorCount++;
        results.push({ 
          success: false, 
          fio: row.column1, 
          type: CERTIFICATE_TYPES.find(t => t.id === typeId)?.name,
          error: error.message 
        });
      }
    }
  }
  
  return { successCount, errorCount, results };
};