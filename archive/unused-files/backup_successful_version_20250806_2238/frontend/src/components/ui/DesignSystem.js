import React from 'react';
import './DesignSystem.css';

// ============================================================================
// DESIGN SYSTEM - ZEITERFASSUNG APP
// ============================================================================

// 🎨 COLOR PALETTE
export const COLORS = {
  // Primary Brand Colors
  primary: '#1e40af',      // Lackner Blau
  primaryLight: '#3b82f6',
  primaryDark: '#1e3a8a',
  
  // Secondary Colors
  secondary: '#059669',     // Grün für Erfolg
  secondaryLight: '#10b981',
  secondaryDark: '#047857',
  
  // Accent Colors
  accent: '#f59e0b',       // Orange für Warnungen
  accentLight: '#fbbf24',
  accentDark: '#d97706',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral Colors
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',
  
  // Background Colors
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff'
};

// 📏 SPACING SYSTEM
export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  xxl: '3rem',      // 48px
  xxxl: '4rem'      // 64px
};

// 🔤 TYPOGRAPHY
export const TYPOGRAPHY = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace'
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem'  // 36px
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

// 📐 BORDER RADIUS
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',    // 2px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  full: '9999px'
};

// 🌟 SHADOWS
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

// ⚡ ANIMATIONS
export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// ============================================================================
// REUSABLE UI COMPONENTS
// ============================================================================

// 🎯 BUTTON COMPONENT
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'ui-button';
  const variantClasses = {
    primary: 'ui-button--primary',
    secondary: 'ui-button--secondary',
    outline: 'ui-button--outline',
    ghost: 'ui-button--ghost',
    danger: 'ui-button--danger'
  };
  const sizeClasses = {
    sm: 'ui-button--sm',
    md: 'ui-button--md',
    lg: 'ui-button--lg'
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loading && 'ui-button--loading',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button 
      className={classes} 
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="ui-button__spinner" />}
      {icon && <span className="ui-button__icon">{icon}</span>}
      {children}
    </button>
  );
};

// 📝 INPUT COMPONENT
export const Input = ({ 
  label, 
  error, 
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  ...props 
}) => {
  const classes = [
    'ui-input',
    error && 'ui-input--error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className="ui-input-wrapper">
      {label && <label className="ui-input__label">{label}</label>}
      <div className="ui-input__container">
        {leftIcon && <span className="ui-input__icon ui-input__icon--left">{leftIcon}</span>}
        <input className={classes} {...props} />
        {rightIcon && <span className="ui-input__icon ui-input__icon--right">{rightIcon}</span>}
      </div>
      {error && <span className="ui-input__error">{error}</span>}
      {helperText && <span className="ui-input__helper">{helperText}</span>}
    </div>
  );
};

// 📊 CARD COMPONENT
export const Card = ({ 
  children, 
  title, 
  subtitle,
  actions,
  padding = 'md',
  className = '',
  ...props 
}) => {
  const classes = [
    'ui-card',
    `ui-card--padding-${padding}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      {(title || subtitle || actions) && (
        <div className="ui-card__header">
          <div className="ui-card__title-section">
            {title && <h3 className="ui-card__title">{title}</h3>}
            {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="ui-card__actions">{actions}</div>}
        </div>
      )}
      <div className="ui-card__content">{children}</div>
    </div>
  );
};

// 🏷️ BADGE COMPONENT
export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const classes = [
    'ui-badge',
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

// 📋 TABLE COMPONENT
export const Table = ({ 
  children, 
  striped = false,
  hoverable = false,
  className = '',
  ...props 
}) => {
  const classes = [
    'ui-table',
    striped && 'ui-table--striped',
    hoverable && 'ui-table--hoverable',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className="ui-table-wrapper">
      <table className={classes} {...props}>
        {children}
      </table>
    </div>
  );
};

// 🔍 MODAL COMPONENT
export const Modal = ({ 
  children, 
  isOpen, 
  onClose, 
  title,
  size = 'md',
  className = '',
  ...props 
}) => {
  if (!isOpen) return null;
  
  const classes = [
    'ui-modal',
    `ui-modal--${size}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div className={classes} onClick={(e) => e.stopPropagation()} {...props}>
        {title && (
          <div className="ui-modal__header">
            <h2 className="ui-modal__title">{title}</h2>
            <button className="ui-modal__close" onClick={onClose}>×</button>
          </div>
        )}
        <div className="ui-modal__content">{children}</div>
      </div>
    </div>
  );
};

// 📊 LOADING COMPONENT
export const Loading = ({ 
  size = 'md', 
  text = 'Laden...',
  className = '',
  ...props 
}) => {
  const classes = [
    'ui-loading',
    `ui-loading--${size}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      <div className="ui-loading__spinner" />
      {text && <p className="ui-loading__text">{text}</p>}
    </div>
  );
};

// 🚨 ALERT COMPONENT
export const Alert = ({ 
  children, 
  type = 'info', 
  title,
  onClose,
  className = '',
  ...props 
}) => {
  const classes = [
    'ui-alert',
    `ui-alert--${type}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      <div className="ui-alert__content">
        {title && <h4 className="ui-alert__title">{title}</h4>}
        <div className="ui-alert__message">{children}</div>
      </div>
      {onClose && (
        <button className="ui-alert__close" onClick={onClose}>×</button>
      )}
    </div>
  );
};

// 📱 LAYOUT COMPONENTS
export const Container = ({ children, fluid = false, className = '', ...props }) => {
  const classes = [
    'ui-container',
    fluid && 'ui-container--fluid',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const Row = ({ children, className = '', ...props }) => {
  return (
    <div className={`ui-row ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Col = ({ children, size, className = '', ...props }) => {
  const colClass = size ? `ui-col--${size}` : 'ui-col';
  return (
    <div className={`${colClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// 🎨 UTILITY COMPONENTS
export const Divider = ({ className = '', ...props }) => {
  return <hr className={`ui-divider ${className}`} {...props} />;
};

export const Spacer = ({ size = 'md', className = '', ...props }) => {
  return <div className={`ui-spacer ui-spacer--${size} ${className}`} {...props} />;
};

// ============================================================================
// DESIGN SYSTEM EXPORT
// ============================================================================

export const DesignSystem = {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATIONS,
  Button,
  Input,
  Card,
  Badge,
  Table,
  Modal,
  Loading,
  Alert,
  Container,
  Row,
  Col,
  Divider,
  Spacer
};

export default DesignSystem; 