import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'open':
        return {
          label: 'Offen',
          className: 'status-open',
          color: '#f59e0b'
        };
      case 'pending':
        return {
          label: 'Zur Freigabe',
          className: 'status-pending',
          color: '#3b82f6'
        };
      case 'approved':
        return {
          label: 'Freigegeben',
          className: 'status-approved',
          color: '#10b981'
        };
      case 'rejected':
        return {
          label: 'Abgelehnt',
          className: 'status-rejected',
          color: '#ef4444'
        };
      case 'active':
        return {
          label: 'Aktiv',
          className: 'status-active',
          color: '#10b981'
        };
      case 'completed':
        return {
          label: 'Abgeschlossen',
          className: 'status-completed',
          color: '#6b7280'
        };
      case 'break':
        return {
          label: 'Pause',
          className: 'status-break',
          color: '#f59e0b'
        };
      default:
        return {
          label: status || 'Unbekannt',
          className: 'status-default',
          color: '#6b7280'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge; 