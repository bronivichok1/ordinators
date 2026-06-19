import React from 'react';
import { CERTIFICATE_TYPES } from '../utils/certificateGenerator';

const CertificatePanel = ({
  selectedCertificateTypes,
  generatingCertificates,
  handleCertificateTypeChange,
  handleGenerateCertificates,
  setShowCertificatePanel,
}) => {
  return (
    <div className="certificate-panel">
      <div className="certificate-panel-header">
        <h3>Выберите типы справок</h3>
      </div>
      
      <div className="certificate-types">
        {CERTIFICATE_TYPES.map(type => (
          <label key={type.id} className="certificate-type-checkbox">
            <input
              type="checkbox"
              checked={selectedCertificateTypes.has(type.id)}
              onChange={() => handleCertificateTypeChange(type.id)}
              disabled={generatingCertificates}
            />
            <span className="certificate-type-name">{type.name}</span>
          </label>
        ))}
      </div>
      
      <div className="certificate-actions">
        <button 
          onClick={handleGenerateCertificates}
          className="export-confirm-button"
          disabled={selectedCertificateTypes.size === 0 || generatingCertificates}
        >
          {generatingCertificates ? 'Генерация...' : 'Сгенерировать справки'}
        </button>
        <button 
          onClick={() => {
            setShowCertificatePanel(false);
            selectedCertificateTypes.clear();
          }}
          className="certificate-cancel-button"
          disabled={generatingCertificates}
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default CertificatePanel;