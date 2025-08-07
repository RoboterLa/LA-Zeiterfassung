import React, { useState } from 'react';
import './ZeiterfassungsFilter.css';

const ZeiterfassungsFilter = ({ onFilterChange }) => {
  const [filterType, setFilterType] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const handleFilterChange = (type, value = null) => {
    setFilterType(type);
    
    let filterData = { type };
    
    switch (type) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filterData = { type, startDate: today, endDate: today };
        break;
      case 'thisWeek':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        filterData = {
          type,
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0]
        };
        break;
      case 'thisMonth':
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
        filterData = {
          type,
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };
        break;
      case 'lastMonth':
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        const endOfLastMonth = new Date(startOfLastMonth.getFullYear(), startOfLastMonth.getMonth() + 1, 0);
        filterData = {
          type,
          startDate: startOfLastMonth.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0]
        };
        break;
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          filterData = {
            type,
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate
          };
        }
        break;
      default:
        break;
    }
    
    onFilterChange(filterData);
  };

  const handleCustomDateChange = (field, value) => {
    const newRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newRange);
    
    if (newRange.startDate && newRange.endDate) {
      handleFilterChange('custom');
    }
  };

  return (
    <div className="zeiterfassungs-filter">
      <h3>Filter</h3>
      
      <div className="filter-options">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'today' ? 'active' : ''}`}
            onClick={() => handleFilterChange('today')}
          >
            Heute
          </button>
          <button
            className={`filter-btn ${filterType === 'thisWeek' ? 'active' : ''}`}
            onClick={() => handleFilterChange('thisWeek')}
          >
            Diese Woche
          </button>
          <button
            className={`filter-btn ${filterType === 'thisMonth' ? 'active' : ''}`}
            onClick={() => handleFilterChange('thisMonth')}
          >
            Dieser Monat
          </button>
          <button
            className={`filter-btn ${filterType === 'lastMonth' ? 'active' : ''}`}
            onClick={() => handleFilterChange('lastMonth')}
          >
            Letzter Monat
          </button>
        </div>
        
        <div className="custom-date-range">
          <h4>Beliebiger Zeitraum</h4>
          <div className="date-inputs">
            <div className="date-input">
              <label>Von:</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              />
            </div>
            <div className="date-input">
              <label>Bis:</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
          {(customDateRange.startDate || customDateRange.endDate) && (
            <button
              className={`filter-btn ${filterType === 'custom' ? 'active' : ''}`}
              onClick={() => handleFilterChange('custom')}
              disabled={!customDateRange.startDate || !customDateRange.endDate}
            >
              Zeitraum anwenden
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZeiterfassungsFilter; 