export const formatDateToDisplay = (dateString) => {
    if (!dateString) return '';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}.${month}.${year}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString.replace(/-/g, '.');
    return dateString;
  };
  
  export const formatDateToAPI = (dateString) => {
    if (!dateString) return null;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('.');
      return `${year}-${month}-${day}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    return null;
  };
  
  export const isValidDate = (dateString) => {
    if (!dateString) return true;
    const regex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!regex.test(dateString)) return false;
    const [day, month, year] = dateString.split('.');
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum > daysInMonth) return false;
    return true;
  };
  
  export const formatYearFromDate = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString.split('-')[0];
    }
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
      return dateString.split('.')[2];
    }
    if (/^\d{4}$/.test(dateString)) {
      return dateString;
    }
    return dateString;
  };
  
  export const formatPreparationForm = (formData) => {
    if (!formData) return '';
    
    if (Array.isArray(formData)) {
      return formData.join(', ');
    }
    
    if (typeof formData === 'string') {
      try {
        const parsed = JSON.parse(formData);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
        return String(parsed);
      } catch (e) {
        if (formData.includes(',') && !formData.startsWith('[')) {
          return formData;
        }
        return formData;
      }
    }
    
    return String(formData);
  };