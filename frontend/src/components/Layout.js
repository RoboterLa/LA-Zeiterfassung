import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ user, onLogout, children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/arbeitszeit')) return 'arbeitszeit';
    if (path.includes('/zeiterfassung')) return 'zeiterfassung';
    if (path.includes('/auftraege')) return 'auftraege';
    if (path.includes('/profil')) return 'profil';
    return 'dashboard';
  };

  const handleTabChange = (tab) => {
    if (tab === 'arbeitszeit') {
      navigate('/monteur/arbeitszeit');
    } else if (tab === 'zeiterfassung') {
      navigate('/monteur/zeiterfassung');
    } else if (tab === 'auftraege') {
      navigate('/monteur/auftraege');
    } else if (tab === 'profil') {
      navigate('/monteur/profil');
    } else {
      navigate('/monteur/dashboard');
    }
  };

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="logo">Lackner Aufzüge</div>
        </div>
        
        <div className="top-bar-center">
          <div className="datetime">
            {new Date().toLocaleString('de-DE')}
          </div>
        </div>
        
        <div className="top-bar-right">
          <div className="user-section">
            <div>
              <div className="user-name">{user?.name || 'Monteur'}</div>
              <div className="user-role">Monteur</div>
            </div>
            <button 
              className="logout-button"
              onClick={onLogout}
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="navigation">
        <button 
          className={`nav-item ${getActiveTab() === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <span className="nav-text">Dashboard</span>
        </button>
        
        <button 
          className={`nav-item ${getActiveTab() === 'arbeitszeit' ? 'active' : ''}`}
          onClick={() => handleTabChange('arbeitszeit')}
        >
          <span className="nav-text">Arbeitszeit</span>
        </button>
        
        <button 
          className={`nav-item ${getActiveTab() === 'zeiterfassung' ? 'active' : ''}`}
          onClick={() => handleTabChange('zeiterfassung')}
        >
          <span className="nav-text">Zeiterfassung</span>
        </button>

        <button 
          className={`nav-item ${getActiveTab() === 'auftraege' ? 'active' : ''}`}
          onClick={() => handleTabChange('auftraege')}
        >
          <span className="nav-text">Aufträge</span>
        </button>

        <button 
          className={`nav-item ${getActiveTab() === 'profil' ? 'active' : ''}`}
          onClick={() => handleTabChange('profil')}
        >
          <span className="nav-text">Profil</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="container">
        {children}
      </div>
    </div>
  );
};

export default Layout;
