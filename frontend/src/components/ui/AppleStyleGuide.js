import React from 'react';
import './AppleStyleGuide.css';

// ============================================================================
// APPLE-STYLE DESIGN SYSTEM - MODERN & MINIMALISTIC
// ============================================================================

// 🎨 DESIGN TOKENS
export const colors = {
  // Primary Colors (Background & Surfaces)
  white: '#FFFFFF',
  offWhite: '#F9F9F9',
  lightGray: '#FAFAFA',
  
  // Secondary Colors (Neutral Separations)
  gray: {
    50: '#F8F9FA',
    100: '#F1F3F4',
    200: '#E8EAED',
    300: '#DADCE0',
    400: '#BDC1C6',
    500: '#9AA0A6',
    600: '#80868B',
    700: '#5F6368',
    800: '#3C4043',
    900: '#202124'
  },
  
  // Accent Color
  blue: {
    50: '#E8F0FE',
    100: '#D2E3FC',
    200: '#AECBFA',
    300: '#8AB4F8',
    400: '#669DF6',
    500: '#4285F4',
    600: '#1A73E8',
    700: '#1967D2',
    800: '#185ABC',
    900: '#174EA6'
  },
  
  // Status Colors
  success: '#34A853',
  warning: '#FBBC04',
  error: '#EA4335',
  info: '#4285F4'
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  lg: '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
  xl: '0 8px 16px 0 rgba(0, 0, 0, 0.1)'
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};

// 🧩 MODULARE KOMPONENTEN

// Top Bar Component
export const TopBar = ({ 
  logo, 
  user, 
  onLogout,
  showDateTime = true,
  className = ''
}) => {
  const currentDateTime = new Date().toLocaleString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className={`top-bar ${className}`}>
      <div className="top-bar-left">
        {logo && <div className="logo">{logo}</div>}
      </div>
      
      {showDateTime && (
        <div className="top-bar-center">
          <span className="datetime">{currentDateTime}</span>
        </div>
      )}
      
      <div className="top-bar-right">
        {user && (
          <div className="user-section">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
            <button className="logout-button" onClick={onLogout}>
              Abmelden
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Navigation Component
export const Navigation = ({ 
  items = [], 
  activeItem, 
  onItemClick,
  className = ''
}) => {
  return (
    <nav className={`navigation ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={() => onItemClick(item.id)}
        >
          {item.icon && <span className="nav-icon">{item.icon}</span>}
          <span className="nav-text">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// Card Component
export const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`apple-card ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

// KPI Card Component
export const KPICard = ({ 
  title, 
  value, 
  subtitle,
  icon,
  trend,
  className = ''
}) => {
  return (
    <Card className={`kpi-card ${className}`}>
      <div className="kpi-content">
        {icon && <div className="kpi-icon">{icon}</div>}
        <div className="kpi-text">
          <div className="kpi-value">{value}</div>
          <div className="kpi-title">{title}</div>
          {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
        </div>
        {trend && <div className="kpi-trend">{trend}</div>}
      </div>
    </Card>
  );
};

// Form Component
export const Form = ({ 
  children, 
  onSubmit,
  title,
  className = ''
}) => {
  return (
    <div className={`form-container ${className}`}>
      {title && <h2 className="form-title">{title}</h2>}
      <form onSubmit={onSubmit} className="apple-form">
        {children}
      </form>
    </div>
  );
};

// Input Component
export const Input = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  error, 
  helperText,
  type = 'text',
  required = false,
  className = ''
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`apple-input ${error ? 'error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {error && <div className="input-error">{error}</div>}
      {helperText && <div className="input-helper">{helperText}</div>}
    </div>
  );
};

// Textarea Component
export const Textarea = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  error, 
  helperText,
  rows = 3,
  required = false,
  className = ''
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <textarea
        className={`apple-textarea ${error ? 'error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        required={required}
      />
      {error && <div className="input-error">{error}</div>}
      {helperText && <div className="input-helper">{helperText}</div>}
    </div>
  );
};

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  return (
    <button
      type={type}
      className={`apple-button apple-button-${variant} apple-button-${size} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Lädt...' : children}
    </button>
  );
};

// Table Component
export const Table = ({ 
  columns = [], 
  data = [], 
  onEdit,
  onDelete,
  className = ''
}) => {
  return (
    <div className={`table-container ${className}`}>
      <table className="apple-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="table-header">
                {column.label}
              </th>
            ))}
            <th className="table-header actions-header">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="table-row">
              {columns.map((column) => (
                <td key={column.key} className="table-cell">
                  {row[column.key]}
                </td>
              ))}
              <td className="table-cell actions-cell">
                <div className="action-buttons">
                  {onEdit && (
                    <button 
                      className="action-button edit-button"
                      onClick={() => onEdit(row)}
                    >
                      Bearbeiten
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      className="action-button delete-button"
                      onClick={() => onDelete(row)}
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Time Entry Card Component
export const TimeEntryCard = ({ 
  entry,
  onEdit,
  onDelete,
  className = ''
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}min`;
  };

  return (
    <Card className={`time-entry-card ${className}`}>
      <div className="entry-header">
        <div className="entry-date">
          <span className="date-label">Datum</span>
          <span className="date-value">{formatDate(entry.start_time)}</span>
        </div>
        <div className="entry-actions">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onEdit(entry)}
          >
            Bearbeiten
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => onDelete(entry.id)}
          >
            Löschen
          </Button>
        </div>
      </div>
      
      <div className="entry-content">
        <div className="entry-times">
          <div className="time-item">
            <span className="time-label">Start:</span>
            <span className="time-value">{formatTime(entry.start_time)}</span>
          </div>
          <div className="time-item">
            <span className="time-label">Ende:</span>
            <span className="time-value">{formatTime(entry.end_time)}</span>
          </div>
          <div className="time-item">
            <span className="time-label">Dauer:</span>
            <span className="time-value duration">{calculateDuration(entry.start_time, entry.end_time)}</span>
          </div>
        </div>
        
        {entry.description && (
          <div className="entry-description">
            <span className="description-label">Beschreibung:</span>
            <span className="description-value">{entry.description}</span>
          </div>
        )}
        
        {entry.order_id && (
          <div className="entry-order">
            <span className="order-label">Auftrag:</span>
            <span className="order-value">{entry.order_id}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1200px'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`apple-modal ${className}`}
        style={{ maxWidth: sizes[size] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Layout Components
export const Container = ({ children, className = '' }) => (
  <div className={`apple-container ${className}`}>
    {children}
  </div>
);

export const Row = ({ children, className = '' }) => (
  <div className={`apple-row ${className}`}>
    {children}
  </div>
);

export const Col = ({ children, size = 12, className = '' }) => (
  <div className={`apple-col apple-col-${size} ${className}`}>
    {children}
  </div>
);

export const Spacer = ({ size = 'md' }) => (
  <div className={`spacer spacer-${size}`} />
);

// Loading Component
export const Loading = ({ message = 'Lädt...', className = '' }) => {
  return (
    <div className={`loading-state ${className}`}>
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ 
  title, 
  description, 
  action,
  className = ''
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-icon">📝</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {action && (
        <div className="empty-action">
          {action}
        </div>
      )}
    </div>
  );
};

// Message Component
export const Message = ({ 
  type = 'info', 
  title, 
  children, 
  className = ''
}) => {
  return (
    <div className={`apple-message apple-message-${type} ${className}`}>
      {title && <h4 className="message-title">{title}</h4>}
      <div className="message-content">{children}</div>
    </div>
  );
};

// Export all components
export default {
  TopBar,
  Navigation,
  Card,
  KPICard,
  Form,
  Input,
  Textarea,
  Button,
  Table,
  TimeEntryCard,
  Modal,
  Container,
  Row,
  Col,
  Spacer,
  Loading,
  EmptyState,
  Message,
  colors,
  spacing,
  borderRadius,
  shadows,
  typography
}; 