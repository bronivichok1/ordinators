import React, { useState, useRef, useEffect } from 'react';
import { X, Move } from 'lucide-react';
import '../styles/FloatingPanel.css';

const FloatingPanel = ({ 
  children, 
  title, 
  isOpen, 
  onClose,
  initialPosition = { x: 100, y: 100 },
  onPositionChange,
  width = 'auto',
  height = 'auto',
  minWidth = 1200,
  maxWidth = '95vw',
  maxHeight = '80vh',
  padding = '20px'
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const panelRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && isOpen) {
      const updateSize = () => {
        const contentRect = contentRef.current.getBoundingClientRect();
        const headerHeight = 60;
        const paddingValue = typeof padding === 'number' ? padding : parseInt(padding) || 20;
        
        const maxAllowedHeight = window.innerHeight * 0.8;
        const contentHeight = contentRect.height + headerHeight + paddingValue * 2;
        
        const newWidth = Math.max(
          minWidth,
          Math.min(contentRect.width + paddingValue * 2, window.innerWidth * 0.95)
        );
        
        const newHeight = Math.min(contentHeight, maxAllowedHeight);
        
        setPanelSize({
          width: newWidth,
          height: newHeight
        });
      };

      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(contentRef.current);
      updateSize();

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [children, isOpen, minWidth, padding]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const panelWidth = panelSize.width || panelRef.current?.offsetWidth || minWidth;
      const panelHeight = panelSize.height || panelRef.current?.offsetHeight || 400;
      const maxX = window.innerWidth - panelWidth - 10;
      const maxY = window.innerHeight - panelHeight - 10;

      const finalPosition = {
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      };

      setPosition(finalPosition);

      if (onPositionChange) {
        onPositionChange(finalPosition);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onPositionChange) {
          onPositionChange(position);
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange, position, panelSize, minWidth]);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        const newY = Math.max(10, window.innerHeight - rect.height - 10);
        setPosition(prev => ({ ...prev, y: newY }));
      }
      if (rect.right > window.innerWidth) {
        const newX = Math.max(10, window.innerWidth - rect.width - 10);
        setPosition(prev => ({ ...prev, x: newX }));
      }
    }
  }, [panelSize, isOpen]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button, input, select, textarea, label')) {
      return;
    }

    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  if (!isOpen) return null;

  const panelWidth = width === 'auto' ? (panelSize.width || minWidth) : width;
  const panelHeight = height === 'auto' ? (panelSize.height || 'auto') : height;

  return (
    <div 
      ref={panelRef}
      className={`floating-panel ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: typeof panelWidth === 'number' ? `${panelWidth}px` : panelWidth,
        height: panelHeight === 'auto' ? 'auto' : `${panelHeight}px`,
        minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
        maxWidth: maxWidth,
        maxHeight: maxHeight
      }}
    >
      <div 
        className="floating-panel-header"
        onMouseDown={handleMouseDown}
      >
        <div className="floating-panel-title">
          <Move size={16} className="move-icon" />
          <span>{title}</span>
        </div>
        <button 
          className="floating-panel-close"
          onClick={onClose}
          title="Закрыть"
        >
          <X size={18} />
        </button>
      </div>
      <div 
        ref={contentRef}
        className="floating-panel-body"
        style={{ padding }}
      >
        {children}
      </div>
    </div>
  );
};

export default FloatingPanel;