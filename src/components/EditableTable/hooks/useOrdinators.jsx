import { useState } from 'react';
import { useApi } from './useApi';
import { transformApiDataToTable, transformTableDataToApi } from '../utils/dataTransformers';

export const useOrdinators = () => {
  const { apiRequest } = useApi();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  const fetchOrdinators = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('/ordinators');
      const transformedData = transformApiDataToTable(response);
      setData(transformedData);
      setPendingChanges({});
      return transformedData;
    } catch (error) {
      console.error('Error fetching ordinators:', error);
      setError('Не удалось загрузить данные. Проверьте соединение с сервером.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createOrdinator = async (rowData, modalState) => {
    const apiData = transformTableDataToApi(rowData, 'create', modalState);
    const result = await apiRequest('/ordinators', 'POST', apiData);
    await fetchOrdinators();
    return result;
  };

  const updateOrdinator = async (id, rowData, modalState) => {
    const apiData = transformTableDataToApi(rowData, 'update', modalState);
    const result = await apiRequest(`/ordinators/${id}`, 'PATCH', apiData);
    await fetchOrdinators();
    return result;
  };

  const deleteOrdinator = async (id) => {
    const result = await apiRequest(`/ordinators/${id}`, 'DELETE');
    await fetchOrdinators();
    return result;
  };

  const bulkDeleteOrdinators = async (ids) => {
    let successCount = 0;
    let errorCount = 0;
    const failedIds = [];
    
    for (const id of ids) {
      try {
        await apiRequest(`/ordinators/${id}`, 'DELETE');
        successCount++;
      } catch (error) {
        console.error(`Ошибка удаления записи ${id}:`, error);
        errorCount++;
        failedIds.push(id);
      }
    }
    
    await fetchOrdinators();
    return { successCount, errorCount, failedIds };
  };

  const getOrdinatorById = async (id) => {
    return await apiRequest(`/ordinators/${id}`);
  };

  return {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
    pendingChanges,
    setPendingChanges,
    fetchOrdinators,
    createOrdinator,
    updateOrdinator,
    deleteOrdinator,
    bulkDeleteOrdinators,
    getOrdinatorById,
  };
};