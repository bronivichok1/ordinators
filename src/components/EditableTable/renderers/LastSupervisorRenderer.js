import React, { useState, useRef } from 'react';
import { formatDateToDisplay } from '../utils/dateUtils';

const LastSupervisorRenderer = ({ value }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const cellRef = useRef(null);
  
  const supervisors = (() => {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const getLastSupervisor = () => {
    if (supervisors.length === 0) return null;
    
    const sorted = [...supervisors].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
      return dateB - dateA;
    });
    
    return sorted[0];
  };

  const lastSupervisor = getLastSupervisor();

  const getAllSupervisorsList = () => {
    if (supervisors.length === 0) return 'Нет руководителей';
    
    return supervisors.map((s, idx) => {
      let name = s.supervisorName || '—';
      if (s.position) name += `, ${s.position}`;
      if (s.rank) name += ` (${s.rank})`;
      if (s.startDate) name += `\n   с ${formatDateToDisplay(s.startDate)}`;
      if (s.endDate) name += ` по ${formatDateToDisplay(s.endDate)}`;
      return `${idx + 1}. ${name}`;
    }).join('\n\n');
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  if (!lastSupervisor || !lastSupervisor.supervisorName) {
    return <span className="no-supervisor">—</span>;
  }

  let displayName = lastSupervisor.supervisorName;
  if (lastSupervisor.position) displayName += `, ${lastSupervisor.position}`;
  if (lastSupervisor.rank) displayName += ` (${lastSupervisor.rank})`;

  return (
    <>
      <span
        ref={cellRef}
        className="last-supervisor-name"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayName}
      </span>
      {showTooltip && (
        <div className="supervisors-tooltip">
          <div className="supervizor-label">
            Все руководители ({supervisors.length}):
          </div>
          <div>{getAllSupervisorsList()}</div>
          <div className="supervizor-all"/>
        </div>
      )}
    </>
  );
};

export default LastSupervisorRenderer;