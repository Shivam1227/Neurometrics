import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Activity, BarChart2, Award, Clock } from 'lucide-react';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState([]);
  const [totalTestsCount, setTotalTestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Group to get only the most recent attempt per unique test
  const uniqueAttempts = attempts.filter((v, i, a) =>
    a.findIndex(t => (t.testId?._id || t.testId) === (v.testId?._id || v.testId)) === i
  );

  useEffect(() => {
    Promise.all([
      api.get('/attempts/my-attempts'),
      api.get('/tests')
    ]).then(([attRes, testRes]) => {
      setAttempts(attRes.data);
      setTotalTestsCount(testRes.data.length);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const completedTestIds = new Set(attempts.filter(a => a.status === 'graded').map(a => a.testId?._id));
  
  const todayStr = new Date().toDateString();
  const testsCompletedToday = new Set(
    attempts
      .filter(a => a.status === 'graded' && new Date(a.createdAt).toDateString() === todayStr)
      .map(a => a.testId?._id)
  );
  const activeTestsCount = Math.max(0, totalTestsCount - testsCompletedToday.size);

  const recentActivity = [];
  const seenTestIds = new Set();
  attempts.forEach(a => {
    const tId = a.testId?._id;
    if (!seenTestIds.has(tId)) {
      if (a.status === 'graded' || !completedTestIds.has(tId)) {
        recentActivity.push(a);
        seenTestIds.add(tId);
      }
    }
  });

  const gradedAttempts = attempts.filter(a => a.status === 'graded' && a.totalScore != null);
  const globalScore = gradedAttempts.length > 0
    ? (gradedAttempts.reduce((sum, a) => sum + a.totalScore, 0) / gradedAttempts.length).toFixed(1)
    : 0;

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">{t('welcomeBack')}, <span className="dashboard-user-name">{user?.name}</span></h1>
        <p>{t('dashboardSubtitle')}</p>
      </div>

      {loading ? <p>{t('loadingStats')}</p> : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 dashboard-stats-grid">
            <div className="glass-card stat-card-content">
              <div className="stat-icon-wrapper stat-icon-emerald">
                <Activity color="var(--accent-primary)" size={24} />
              </div>
              <div>
                <h3 className="stat-title">{t('avgScore')}</h3>
                <p className="stat-value">{globalScore}%</p>
              </div>
            </div>

            <div className="glass-card stat-card-content">
              <div className="stat-icon-wrapper stat-icon-purple">
                <Award color="var(--accent-secondary)" size={24} />
              </div>
              <div>
                <h3 className="stat-title">{t('testsCompleted')}</h3>
                <p className="stat-value">
                  {gradedAttempts.length}
                </p>
              </div>
            </div>

            <div className="glass-card stat-card-content">
              <div className="stat-icon-wrapper stat-icon-blue">
                <Clock color="#38BDF8" size={24} />
              </div>
              <div>
                <h3 className="stat-title">{t('activeTests')}</h3>
                <p className="stat-value">
                  {activeTestsCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="glass-panel dashboard-panel">
              <h2 className="panel-title">
                <BarChart2 size={24} color="var(--accent-primary)" /> {t('scoreHistoryGraph')}
              </h2>
              <div className="graph-container">
                {[...gradedAttempts].slice(0, 5).reverse().map((a, idx) => (
                  <div key={idx} className={`graph-bar ${idx % 2 === 0 ? 'graph-bar-primary' : 'graph-bar-secondary'}`} style={{
                    height: `${a.totalScore}%`
                  }}>{a.totalScore}</div>
                ))}
                {gradedAttempts.length === 0 && <p className="empty-text">{t('noGradedAttempts')}</p>}
              </div>
            </div>

            <div className="glass-panel dashboard-panel">
              <h2 style={{ marginBottom: '24px' }}>{t('recentActivity')}</h2>
              <div className="activity-list">
                {recentActivity.length === 0 && <p className="empty-text">{t('noRecentActivity')}</p>}

                {recentActivity.slice(0, 3).map(a => (
                  <div key={a._id} className="activity-item">
                    <div>
                      <h4 className="activity-title">{a.testId?.title || t('unknownTest')}</h4>
                      <p className="activity-date">{a.status === 'graded' ? t('completed') : t('inProgress')} - {new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="activity-score">
                      {a.status === 'graded' ? `100%` : '-'}
                    </div>
                  </div>
                ))}

                <Link to="/tests" className="btn-primary take-test-btn">
                  {t('takeNewTest')}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
