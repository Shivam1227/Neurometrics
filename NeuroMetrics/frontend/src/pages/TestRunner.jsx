import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { Timer, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import DrawingCanvas from '../components/DrawingCanvas';
import './TestRunner.css';

const TestRunner = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800);
  
  const [responses, setResponses] = useState({}); // { questionId: selectedOptionId }

  useEffect(() => {
    const initTest = async () => {
      try {
        // Fetch test
        const res = await api.get(`/tests/${id}`);
        setTest(res.data);
        if(res.data.duration) setTimeLeft(res.data.duration);
        
        let allQs = [];
        res.data.sections?.forEach(s => {
          allQs = allQs.concat(s.questions);
        });
        setQuestions(allQs);

        // Start Attempt
        const attemptRes = await api.post('/attempts', { testId: id });
        setAttemptId(attemptRes.data._id);
        
      } catch (err) {
        console.error(err);
        alert(t('errLoadTest'));
        navigate('/tests');
      }
    };
    initTest();
  }, [id, navigate]);

  useEffect(() => {
    if (!test) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAttempt(); // auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (qId, optionId) => {
    setResponses(prev => ({ ...prev, [qId]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmitAttempt();
    }
  };

  const handleSubmitAttempt = async () => {
    try {
      const responsesArray = Object.keys(responses).map(qId => {
        const val = responses[qId];
        // Check if value is a valid 24-hex MongoDB ObjectId
        const isObjectId = typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
        
        return {
          questionId: qId,
          selectedOptionIds: isObjectId ? [val] : [], 
          answerText: !isObjectId ? String(val) : null
        };
      });
      
      await api.post(`/attempts/${attemptId}/submit`, { responses: responsesArray });
      navigate(`/feedback/${id}`);
    } catch (err) {
      console.error(err);
      alert(t('errorSubmitAttempt'));
    }
  };

  if (!test || questions.length === 0) return <div className="loading-engine">{t('loadingEngine')}</div>;

  const currentQ = questions[currentQuestion];

  return (
    <div className="runner-container">
      
      {/* Header & Progress */}
      <div className="runner-header">
        <div>
          <h2 className="runner-title">{t('question')} {currentQuestion + 1} <span className="runner-progress-text">/ {questions.length}</span></h2>
        </div>
        <div className="timer-badge">
          <Timer size={20} /> {formatTime(timeLeft)}
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
      </div>

      {/* Question Card */}
      <div className="glass-panel question-panel">
        <h1 className="question-text">
          {currentQ.text}
        </h1>

        {currentQ.mediaUrls && currentQ.mediaUrls.length > 0 && (
          <div className="media-container" style={{ margin: '20px 0', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentQ.mediaUrls.map((url, idx) => {
              const isAudio = url.match(/\.(mp3|wav|ogg)$/i) || url.includes('audio');
              if (isAudio) {
                return <audio key={idx} controls src={url} style={{ width: '100%', maxWidth: '400px' }} />;
              }
              return <img key={idx} src={url} alt="Question Media" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />;
            })}
          </div>
        )}

        <div className="options-container">
          {currentQ.type === 'scmcq' ? (
            currentQ.options?.map((opt) => {
              const isSelected = responses[currentQ._id] === opt._id;
              return (
                <div key={opt._id} 
                  className={`option-card ${isSelected ? 'option-card-selected' : 'option-card-idle'}`}
                  onClick={() => handleOptionSelect(currentQ._id, opt._id)}
                >
                  {opt.text}
                </div>
              );
            })
          ) : currentQ.type === 'drawing' ? (
            <DrawingCanvas 
              value={responses[currentQ._id] || ''}
              onChange={(dataUrl) => handleOptionSelect(currentQ._id, dataUrl)}
              backgroundTemplate={currentQ.config?.backgroundTemplate}
            />
          ) : (
            <textarea
              className="glass-input text-response-input"
              rows={6}
              placeholder={t('typeResponse')}
              value={responses[currentQ._id] || ''}
              onChange={(e) => handleOptionSelect(currentQ._id, e.target.value)}
            />
          )}
        </div>

        <div className="runner-actions">
          <button className="btn-secondary" style={{ visibility: currentQuestion === 0 ? 'hidden' : 'visible' }} onClick={() => setCurrentQuestion(prev => prev - 1)}>
            {t('previous')}
          </button>
          
          <button className="btn-primary next-action-btn" onClick={handleNext}>
            {currentQuestion === questions.length - 1 ? (
              <><CheckCircle size={20}/> {t('submitAttempt')}</>
            ) : (
              <>{t('next')} <ArrowRight size={20}/></>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default TestRunner;
