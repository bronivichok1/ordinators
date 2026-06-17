import { useState } from 'react';
import { generateMultipleCertificates } from '../utils/certificateGenerator';

export const useCertificates = (userData) => {
  const [showCertificatePanel, setShowCertificatePanel] = useState(false);
  const [selectedCertificateTypes, setSelectedCertificateTypes] = useState(new Set());
  const [generatingCertificates, setGeneratingCertificates] = useState(false);

  const handleCertificateTypeChange = (typeId) => {
    const newSelected = new Set(selectedCertificateTypes);
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId);
    } else {
      newSelected.add(typeId);
    }
    setSelectedCertificateTypes(newSelected);
  };

  const handleGenerateCertificates = async (data, selectedRows) => {
    if (selectedRows.size === 0) {
      alert('Выберите записи для генерации справок');
      return { success: false, message: 'Нет выбранных записей' };
    }
    
    if (selectedCertificateTypes.size === 0) {
      alert('Выберите хотя бы один тип справки');
      return { success: false, message: 'Нет выбранных типов справок' };
    }
  
    setGeneratingCertificates(true);
    
    try {
      const selectedData = data.filter(row => selectedRows.has(row.id));
      const { successCount, errorCount, results } = await generateMultipleCertificates(
        selectedData, 
        selectedCertificateTypes, 
        userData
      );
      
      let message = '';
      let success = true;
      
      if (successCount > 0 && errorCount === 0) {
        message = `✅ Успешно сгенерировано ${successCount} справок`;
      } else if (successCount > 0 && errorCount > 0) {
        success = false;
        message = `⚠️ Сгенерировано: ${successCount} успешно, ${errorCount} с ошибками`;
        
        const errors = results.filter(r => !r.success);
        if (errors.length > 0 && errors.length <= 5) {
          message += `\n\nОшибки:\n${errors.map(e => `${e.fio} - ${e.type}: ${e.error}`).join('\n')}`;
        } else if (errors.length > 5) {
          message += `\n\nОшибки у ${errors.length} справок. Подробности в консоли.`;
          console.error('Ошибки генерации:', errors);
        }
      } else {
        success = false;
        message = `❌ Ошибка: не удалось сгенерировать ни одной справки`;
      }
      
      alert(message);
      
      setShowCertificatePanel(false);
      setSelectedCertificateTypes(new Set());
      
      return { success, message };
    } catch (error) {
      console.error('Ошибка генерации справок:', error);
      const errorMessage = 'Ошибка при генерации справок: ' + error.message;
      alert(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setGeneratingCertificates(false);
    }
  };

  const resetCertificates = () => {
    setSelectedCertificateTypes(new Set());
    setShowCertificatePanel(false);
  };

  return {
    showCertificatePanel,
    setShowCertificatePanel,
    selectedCertificateTypes,
    generatingCertificates,
    handleCertificateTypeChange,
    handleGenerateCertificates,
    resetCertificates,
  };
};