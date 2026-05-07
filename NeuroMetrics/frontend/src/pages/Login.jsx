import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/');
    } catch (error) {
      alert(t('authFailed'));
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-panel">
        <h2 className="login-title">{isLogin ? t('welcomeBackLogin') : t('createAccount')}</h2>
        <p className="login-subtitle">
          {isLogin ? t('loginSubtitle') : t('joinToday')}
        </p>
        
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <input 
              type="text" 
              className="glass-input" 
              placeholder={t('fullName')}
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
            />
          )}
          <input 
            type="email" 
            className="glass-input" 
            placeholder={t('emailAddr')}
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required
          />
          <input 
            type="password" 
            className="glass-input" 
            placeholder={t('password')}
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
          />
          <button type="submit" className="btn-primary login-submit-btn">
            {isLogin ? t('signIn') : t('signUp')}
          </button>
        </form>

        <p className="login-footer-text">
          {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            className="login-toggle-link"
          >
            {isLogin ? t('registerHere') : t('loginHere')}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
