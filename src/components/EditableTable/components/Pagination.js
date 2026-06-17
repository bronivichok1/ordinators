import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(1)} 
        disabled={currentPage === 1} 
        className="page-button"
      >
        ««
      </button>
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1} 
        className="page-button"
      >
        «
      </button>
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`page-button ${currentPage === page ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages} 
        className="page-button"
      >
        »
      </button>
      <button 
        onClick={() => onPageChange(totalPages)} 
        disabled={currentPage === totalPages} 
        className="page-button"
      >
        »»
      </button>
    </div>
  );
};

export default Pagination;