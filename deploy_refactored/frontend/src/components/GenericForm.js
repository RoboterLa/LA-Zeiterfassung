import React, { useState, useEffect } from 'react';

const GenericForm = ({ 
  fields, 
  onSubmit, 
  initialData = {}, 
  title = 'Formular',
  submitText = 'Speichern',
  onCancel
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Initialisiere Formular mit initialData
    const initialFormData = {};
    fields.forEach(field => {
      initialFormData[field.name] = initialData[field.name] || '';
    });
    setFormData(initialFormData);
  }, [initialData, fields]);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      const value = formData[field.name];
      
      if (field.required && (!value || value.trim() === '')) {
        newErrors[field.name] = `${field.label} ist erforderlich`;
      }
      
      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        newErrors[field.name] = 'Ungültige E-Mail-Adresse';
      }
      
      if (field.type === 'number' && value && isNaN(Number(value))) {
        newErrors[field.name] = 'Ungültige Zahl';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      if (!initialData.id) {
        const resetData = {};
        fields.forEach(field => {
          resetData[field.name] = '';
        });
        setFormData(resetData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    
    const commonProps = {
      id: field.name,
      name: field.name,
      value: value,
      onChange: (e) => handleChange(field.name, e.target.value),
      className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
        error ? 'border-red-300' : ''
      }`,
      required: field.required,
      placeholder: field.placeholder || field.label,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 3}
          />
        );
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Bitte wählen...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );
      
      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        );
      
      case 'time':
        return (
          <input
            {...commonProps}
            type="time"
          />
        );
      
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      
      default:
        return (
          <input
            {...commonProps}
            type={field.type || 'text'}
          />
        );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {title}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              
              <div className="mt-1">
                {renderField(field)}
              </div>
              
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[field.name]}
                </p>
              )}
              
              {field.help && (
                <p className="mt-1 text-sm text-gray-500">
                  {field.help}
                </p>
              )}
            </div>
          ))}
          
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Abbrechen
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Speichern...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenericForm; 