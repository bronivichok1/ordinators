import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export const useOptions = () => {
  const { apiRequest } = useApi();
  const [serverOptions, setServerOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [selectOptions, setSelectOptions] = useState({
    gender: [],
    dismissalReason: [],
    university: [],
    preparationForm: [],
    identityDocument: [],
    residence: [],
    medicalCertificate: [],
    rivshCertificate: [],
    entryByInvitation: [],
    country: [],
    supervisors: [],
    socialLeave: []
  });

  const [selectData, setSelectData] = useState({
    departments: [],
    specialtyProfiles: [],
    countries: [],
    gender: [],
    dismissalReason: [],
    university: [],
    preparationForm: [],
    identityDocument: [],
    residence: [],
    medicalCertificate: [],
    rivshCertificate: [],
    entryByInvitation: [],
    supervisors: [],
    socialLeave: []
  });

  const loadServerOptions = async () => {
    try {
      setOptionsLoading(true);
      const data = await apiRequest('/options');
      setServerOptions(data);
      
      const preparationForm = data.preparationForm || ['очная', 'заочная', 'платно', 'за счёт бюджета'];
      
      setSelectOptions({
        gender: data.gender || ['М', 'Ж'],
        dismissalReason: data.dismissalReason || [],
        university: data.university || [],
        preparationForm: preparationForm,
        identityDocument: data.identityDocument || [],
        residence: data.residence || [],
        medicalCertificate: data.medicalCertificate || [],
        rivshCertificate: data.rivshCertificate || [],
        entryByInvitation: data.entryByInvitation || [],
        country: data.country || [],
        supervisors: data.supervisors || [],
        socialLeave: data.socialLeave || []
      });

      setSelectData({
        departments: data.departments || [],
        specialties: data.specialties || [],
        specialtyProfiles: data.specialtyProfiles || [],
        countries: data.country || [],
        gender: data.gender || ['М', 'Ж'],
        dismissalReason: data.dismissalReason || [],
        university: data.university || [],
        preparationForm: preparationForm,
        identityDocument: data.identityDocument || [],
        residence: data.residence || [],
        medicalCertificate: data.medicalCertificate || [],
        rivshCertificate: data.rivshCertificate || [],
        entryByInvitation: data.entryByInvitation || [],
        supervisors: data.supervisors || [],
        socialLeave: data.socialLeave || []
      });
    } catch (error) {
      console.error('Error loading server options:', error);
    } finally {
      setOptionsLoading(false);
    }
  };

  const addCustomOption = async (field, value) => {
    try {
      await apiRequest(`/options/${field}/add`, 'POST', { value });
      await loadServerOptions();
    } catch (error) {
      console.error('Error adding custom option:', error);
    }
  };

  return {
    serverOptions,
    optionsLoading,
    selectOptions,
    selectData,
    loadServerOptions,
    addCustomOption,
  };
};