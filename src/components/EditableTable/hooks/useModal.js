import { useState } from 'react';
import { COLUMN_NAMES } from '../utils/constants';

export const useModal = (selectOptions) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create',
    selectedRow: null,
    rowData: [],
    otherUniversity: '',
    otherDocument: '',
    otherDismissalReason: '',
    otherCountry: '',
    selectedPreparationForm: selectOptions?.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['']
  });
  
  const [newRowData, setNewRowData] = useState({});
  const [dateErrors, setDateErrors] = useState({});

  const initCreateRow = (options) => {
    const initialRowData = {};
    for (let i = 1; i <= 40; i++) {
      const columnKey = `column${i}`;
      const fieldName = COLUMN_NAMES[i];
      switch(fieldName) {
        case 'Пол':
          initialRowData[columnKey] = options.gender[0] || '';
          break;
        case 'Причина отчисления':
          initialRowData[columnKey] = options.dismissalReason[0] || '';
          break;
        case 'Социальный отпуск':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        case 'ВУЗ':
          initialRowData[columnKey] = options.university[0] || '';
          break;
        case 'Форма подготовки':
          const defaultPrepForm = modalState.selectedPreparationForm;
          initialRowData[columnKey] = JSON.stringify(defaultPrepForm);
          break;
        case 'Документ, удостоверяющий личность':
          initialRowData[columnKey] = options.identityDocument[0] || '';
          break;
        case 'Место проживания, регистрации':
          initialRowData[columnKey] = options.residence[0] || '';
          break;
        case 'Медицинская справка':
          initialRowData[columnKey] = options.medicalCertificate[0] || '';
          break;
        case 'Наличие сертификата РИВШ':
          initialRowData[columnKey] = options.rivshCertificate[0] || 'нет';
          break;
        case 'Въезд по приглашению':
          initialRowData[columnKey] = options.entryByInvitation[0] || 'нет';
          break;
        case 'Страна':
          initialRowData[columnKey] = options.country[0] || '';
          break;
        case 'Руководители':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        case 'Номер приказа о продлении':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        case 'Надбавка':
          initialRowData[columnKey] = JSON.stringify([]);
          break;
        default:
          initialRowData[columnKey] = '';
      }
    }
    setNewRowData(initialRowData);
    setModalState({
      isOpen: true,
      mode: 'create',
      selectedRow: null,
      rowData: [],
      otherUniversity: '',
      otherDocument: '',
      otherDismissalReason: '',
      otherCountry: '',
      selectedPreparationForm: options.preparationForm?.length ? [options.preparationForm[0]] : ['']
    });
  };

  const openEditModal = (row, rowIndex, options, getOrdinatorById) => {
    const loadRowData = async () => {
      try {
        const response = await getOrdinatorById(row.id);
        const rowValues = [];
        for (let i = 1; i <= 40; i++) {
          const columnKey = `column${i}`;
          const value = row[columnKey] || '';
          rowValues.push({
            id: i,
            columnName: columnKey,
            value: value,
            columnNumber: i
          });
        }
        
        let otherUni = '';
        let otherDoc = '';
        let otherDismissal = '';
        let prepForm = options.preparationForm?.length ? [options.preparationForm[0]] : [''];
        
        if (row['column11'] && !options.university.includes(row['column11'])) {
          otherUni = row['column11'];
        }
        if (row['column17'] && !options.identityDocument.includes(row['column17'])) {
          otherDoc = row['column17'];
        }
        if (row['column8'] && !options.dismissalReason.includes(row['column8'])) {
          otherDismissal = row['column8'];
        }
        
        try {
          if (row['column16']) {
            const parsed = JSON.parse(row['column16']);
            prepForm = Array.isArray(parsed) ? parsed : (options.preparationForm?.length ? [options.preparationForm[0]] : ['']);
          }
        } catch (e) {
          console.error('Ошибка парсинга данных:', e);
          prepForm = options.preparationForm?.length ? [options.preparationForm[0]] : [''];
        }
        
        setModalState({
          isOpen: true,
          mode: 'edit',
          selectedRow: {
            index: rowIndex,
            id: row.id,
            originalIndex: rowIndex
          },
          rowData: rowValues,
          otherUniversity: otherUni,
          otherDocument: otherDoc,
          otherDismissalReason: otherDismissal,
          otherCountry: '',
          selectedPreparationForm: prepForm
        });
        setNewRowData({ ...row });
      } catch (error) {
        console.error('Error fetching ordinator details:', error);
        alert('Не удалось загрузить данные');
      }
    };
    
    loadRowData();
  };

  const handleModalChange = (column, value) => {
    const valueToSet = value && typeof value === 'object' && value.value !== undefined 
      ? value.value 
      : value;

    if (modalState.mode === 'create') {
      setNewRowData({
        ...newRowData,
        [column]: valueToSet
      });
    } else {
      const updatedRowData = [...modalState.rowData];
      const itemIndex = updatedRowData.findIndex(item => item.columnName === column);
      if (itemIndex !== -1) {
        updatedRowData[itemIndex].value = valueToSet;
        setModalState(prev => ({
          ...prev,
          rowData: updatedRowData
        }));
        setNewRowData({
          ...newRowData,
          [column]: valueToSet
        });
      }
    }
  };

  const handleCancel = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      selectedRow: null,
      rowData: [],
      otherUniversity: '',
      otherDocument: '',
      otherDismissalReason: '',
      otherCountry: '',
      selectedPreparationForm: selectOptions?.preparationForm?.length ? [selectOptions.preparationForm[0]] : ['']
    });
    setNewRowData({});
    setDateErrors({});
  };

  const handleSave = async (createOrdinator, updateOrdinator, fetchOrdinators) => {
    try {
      if (modalState.mode === 'create') {
        await createOrdinator(newRowData, modalState);
        alert('Ординатор успешно создан');
      } else {
        const rowDataObj = {};
        modalState.rowData.forEach(item => {
          rowDataObj[item.columnName] = item.value;
        });
        await updateOrdinator(modalState.selectedRow.id, rowDataObj, modalState);
        alert('Данные успешно обновлены');
      }
      await fetchOrdinators();
      handleCancel();
      return { success: true };
    } catch (error) {
      console.error('Error saving ordinator:', error);
      alert(`Ошибка сохранения: ${error.message || 'Неизвестная ошибка'}`);
      return { success: false, error: error.message };
    }
  };

  return {
    modalState,
    setModalState,
    newRowData,
    setNewRowData,
    dateErrors,
    setDateErrors,
    initCreateRow,
    openEditModal,
    handleModalChange,
    handleCancel,
    handleSave,
  };
};