import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { BrainCircuit, LogOut, Globe } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo-link">
          <BrainCircuit color="var(--accent-primary)" size={28} />
          <h2 className="navbar-logo-text">
            {t('neurometrics')}
          </h2>
        </Link>
        
        <div className="navbar-right-section">
          <button onClick={toggleLanguage} className="navbar-lang-toggle" title="Switch Language">
            <Globe size={16} color="var(--text-secondary)" />
            <span className={`lang-text ${language === 'en' ? 'active-lang' : ''}`}>EN</span>
            <span className="lang-separator">/</span>
            <span className={`lang-text ${language === 'mr' ? 'active-lang' : ''}`}>MR</span>
          </button>

          {user && (
            <div className="navbar-links">
              <Link to="/" className="navbar-link">{t('dashboard')}</Link>
              <Link to="/tests" className="navbar-link">{t('tests')}</Link>
              {user.type === 'admin' && (
                <Link to="/admin" className="navbar-link" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{t('adminPanel')}</Link>
              )}
              <button onClick={handleLogout} className="btn-secondary navbar-logout-btn">
                <LogOut size={16} /> {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

