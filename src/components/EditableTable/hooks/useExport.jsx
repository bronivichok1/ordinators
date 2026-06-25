import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { prepareDataForExport } from '../utils/dataTransformers';

export const useExport = () => {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(new Set());
  const [exportFormats, setExportFormats] = useState({
    excel: true,
    word: false
  });

  const handleSelectAllColumns = () => {
    const allColumns = new Set();
    for (let i = 1; i <= 39; i++) {
      allColumns.add(i);
    }
    
    const isAllSelected = selectedColumns.size === allColumns.size;
    
    if (isAllSelected) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(allColumns);
    }
  };

  const handleSelectColumn = (columnIndex) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnIndex)) {
      newSelected.delete(columnIndex);
    } else {
      newSelected.add(columnIndex);
    }
    setSelectedColumns(newSelected);
  };

  const handleFormatChange = (format) => {
    setExportFormats(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const exportToExcel = (exportData) => {
    try {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ординаторы');
      const fileName = `ординаторы_${new Date().toISOString().split('T')[0]}_${exportData.length}записей.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error);
      throw error;
    }
  };

  const exportToWord = (exportData) => {
    try {
      let html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Экспорт ординаторов</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th { background-color: #f2f2f2; font-weight: bold; padding: 10px; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .info { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Список ординаторов</h1>
          <div class="info">
            <p>Дата экспорта: ${new Date().toLocaleString('ru-RU')}</p>
            <p>Всего записей: ${exportData.length}</p>
          </div>
          <table border="1">
            <thead>
              <tr>
      `;
      
      const headers = Object.keys(exportData[0]);
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      
      html += `<tr></thead><tbody>`;
      
      exportData.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
      });
      
      html += `</tbody></table></body></html>`;
      
      const blob = new Blob([html], { type: 'application/msword' });
      const fileName = `ординаторы_${new Date().toISOString().split('T')[0]}_${exportData.length}записей.doc`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Ошибка экспорта в Word:', error);
      throw error;
    }
  };

  const handleExport = (data, selectedRows) => {
    if (selectedRows.size === 0) {
      alert('Сначала выберите записи для экспорта');
      return { success: false, message: 'Нет выбранных записей' };
    }
    
    if (selectedColumns.size === 0) {
      alert('Выберите хотя бы одну колонку для экспорта');
      return { success: false, message: 'Нет выбранных колонок' };
    }

    if (!exportFormats.excel && !exportFormats.word) {
      alert('Выберите хотя бы один формат экспорта');
      return { success: false, message: 'Нет выбранных форматов' };
    }

    try {
      const exportData = prepareDataForExport(data, selectedRows, selectedColumns);
      if (!exportData) {
        return { success: false, message: 'Нет данных для экспорта' };
      }

      if (exportFormats.excel) {
        exportToExcel(exportData);
      }
      
      if (exportFormats.word) {
        exportToWord(exportData);
      }

      setShowExportPanel(false);
      
      let successMessage = '';
      if (exportFormats.excel && exportFormats.word) {
        successMessage = 'Экспорт выполнен успешно в форматах Excel и Word';
      } else if (exportFormats.excel) {
        successMessage = 'Экспорт в Excel выполнен успешно';
      } else if (exportFormats.word) {
        successMessage = 'Экспорт в Word выполнен успешно';
      }
      
      return { success: true, message: successMessage };
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      return { success: false, message: 'Ошибка при экспорте: ' + error.message };
    }
  };

  return {
    showExportPanel,
    setShowExportPanel,
    selectedColumns,
    setSelectedColumns,
    exportFormats,
    setExportFormats,
    handleSelectAllColumns,
    handleSelectColumn,
    handleFormatChange,
    handleExport,
  };
};