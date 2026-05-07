import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Navigate } from 'react-router-dom';
import { Users, FileX, MessageSquare, Trash2, ShieldAlert, Plus } from 'lucide-react';
import api from '../utils/api';
import TestBuilder from '../components/TestBuilder';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('scores');
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  
  const [attempts, setAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    if (user?.type !== 'admin') return;
    fetchData();
  }, [user, isCreatingTest]);

  const fetchData = async () => {
    try {
      const [attRes, testRes, feedRes] = await Promise.all([
        api.get('/attempts'),
        api.get('/tests'),
        api.get('/reviews')
      ]);
      setAttempts(attRes.data);
      setTests(testRes.data);
      setFeedbacks(feedRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/tests/${id}`);
      setTests(tests.filter(t => t._id !== id));
    } catch (err) {
      alert("Failed to delete test.");
    }
  };

  if (user?.type !== 'admin') {
    return <Navigate to="/" />;
  }

  const renderScoresContent = () => {
    const completedKeys = new Set(attempts.filter(a => a.status === 'graded').map(a => `${a.userId?._id}-${a.testId?._id}`));
    const finalAttempts = attempts.filter(a => {
      if (a.status === 'in_progress') {
        const key = `${a.userId?._id}-${a.testId?._id}`;
        if (completedKeys.has(key)) return false;
      }
      return true;
    });

    return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>{t('user')}</th>
          <th>{t('testName')}</th>
          <th>{t('status')}</th>
          <th>{t('finalScore')}</th>
          <th>{t('date')}</th>
        </tr>
      </thead>
      <tbody>
        {finalAttempts.map(a => (
          <tr key={a._id}>
            <td>
              <div className="flex-col">
                <span className="bold block">{a.userId?.name || 'Unknown'}</span>
                <span className="small text-muted">{a.userId?.email}</span>
              </div>
            </td>
            <td>{a.testId?.title || <span className="warning">{t('deletedTestBtn')}</span>}</td>
            <td>
              <span className={`status-badge status-${a.status}`}>{a.status === 'in_progress' ? t('inProgress') : t('completed')}</span>
            </td>
            <td className="score-val">{a.totalScore != null ? `${a.totalScore}%` : '-'}</td>
            <td>{new Date(a.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
        {finalAttempts.length === 0 && <tr><td colSpan="5">{t('noAttempts')}</td></tr>}
      </tbody>
    </table>
    );
  };

  const renderTestsContent = () => {
    if (isCreatingTest) {
      return (
        <TestBuilder 
          onCancel={() => setIsCreatingTest(false)} 
          onSaved={() => {
            setIsCreatingTest(false);
            fetchData();
          }} 
        />
      );
    }

    return (
      <div className="manage-tests-view">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button className="btn-primary" onClick={() => setIsCreatingTest(true)}>
            <Plus size={18} style={{ display:'inline', marginRight:'8px', verticalAlign:'middle' }} /> {t('createNewTest')}
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('title')}</th>
              <th>{t('tagDifficulty')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(tData => (
              <tr key={tData._id}>
                <td>{tData.title} <span className="small text-muted block">ID: {tData._id}</span></td>
                <td>
                  <div>{tData.difficultyLevel}</div>
                  <div className="small text-muted">{(tData.tags || []).join(', ')}</div>
                </td>
                <td>{tData.isActive ? t('active') : t('draft')}</td>
                <td>
                  <button className="del-btn" onClick={() => handleDeleteTest(tData._id)}>
                    <Trash2 size={16} /> {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
            {tests.length === 0 && <tr><td colSpan="4">{t('noTestsConf')}</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFeedbackContent = () => (
    <div className="feedback-grid">
      {feedbacks.map(f => (
        <div key={f._id} className="feedback-card">
          <div className="fb-header">
            <h4 className="bold m-0">{f.testId?.title || t('unknownTest')}</h4>
            <div className="stars">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
          </div>
          <div className="fb-author text-muted small">{f.userId?.name} ({f.userId?.email})</div>
          <p className="fb-text mt-3">{f.feedback || <i>{t('noFeedbackText')}</i>}</p>
          <div className="small text-muted mt-2">{new Date(f.createdAt).toLocaleDateString()}</div>
        </div>
      ))}
      {feedbacks.length === 0 && <p className="text-muted">{t('noFeedbacksSubmit')}</p>}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>
          <ShieldAlert color="var(--accent-primary)" size={32} style={{ display:'inline', verticalAlign: 'bottom', marginRight: '10px' }} />
          {t('adminTitle')}
        </h1>
        <p>{t('adminSubtitle')}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          <Users size={20} /> {t('allScores')}
        </button>
        <button 
          className={`admin-tab ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('tests')}
        >
          <FileX size={20} /> {t('manageTests')}
        </button>
        <button 
          className={`admin-tab ${activeTab === 'feedbacks' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedbacks')}
        >
          <MessageSquare size={20} /> {t('feedbacks')}
        </button>
      </div>

      <div className="admin-content-panel">
        {activeTab === 'scores' && renderScoresContent()}
        {activeTab === 'tests' && renderTestsContent()}
        {activeTab === 'feedbacks' && renderFeedbackContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
