import React, { useState } from 'react';
import { Plus, Trash2, Save, FilePlus, X } from 'lucide-react';
import api from '../utils/api';
import './TestBuilder.css';

const TestBuilder = ({ onCancel, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState({
    title: '',
    description: '',
    duration: 30, // Default 30 mins
    difficultyLevel: 'medium',
    tags: '',
    sections: [
      {
        title: 'Section 1',
        orderIndex: 0,
        questions: []
      }
    ]
  });

  // Basic Input Handlers
  const handleMetaChange = (e) => {
    setTest({ ...test, [e.target.name]: e.target.value });
  };

  // Section Handlers
  const addSection = () => {
    setTest(prev => ({
      ...prev,
      sections: [
        ...prev.sections, 
        { title: `Section ${prev.sections.length + 1}`, orderIndex: prev.sections.length, questions: [] }
      ]
    }));
  };

  const removeSection = (sIndex) => {
    setTest(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sIndex)
    }));
  };

  const updateSectionTitle = (sIndex, title) => {
    const newSections = [...test.sections];
    newSections[sIndex].title = title;
    setTest({ ...test, sections: newSections });
  };

  // Question Handlers
  const addQuestion = (sIndex, type) => {
    const newSections = [...test.sections];
    const newQ = {
      text: '',
      type: type, // 'scmcq' or 'text'
      options: type === 'scmcq' ? [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
      ] : [],
      ans: ''
    };
    newSections[sIndex].questions.push(newQ);
    setTest({ ...test, sections: newSections });
  };

  const updateQuestion = (sIndex, qIndex, field, value) => {
    const newSections = [...test.sections];
    newSections[sIndex].questions[qIndex][field] = value;
    setTest({ ...test, sections: newSections });
  };

  const removeQuestion = (sIndex, qIndex) => {
    const newSections = [...test.sections];
    newSections[sIndex].questions.splice(qIndex, 1);
    setTest({ ...test, sections: newSections });
  };

  // Option Handlers
  const addOption = (sIndex, qIndex) => {
    const newSections = [...test.sections];
    newSections[sIndex].questions[qIndex].options.push({ text: '', isCorrect: false });
    setTest({ ...test, sections: newSections });
  };

  const updateOptionText = (sIndex, qIndex, oIndex, val) => {
    const newSections = [...test.sections];
    newSections[sIndex].questions[qIndex].options[oIndex].text = val;
    setTest({ ...test, sections: newSections });
  };

  const markOptionCorrect = (sIndex, qIndex, oIndex) => {
    const newSections = [...test.sections];
    newSections[sIndex].questions[qIndex].options.forEach((opt, idx) => {
      opt.isCorrect = (idx === oIndex);
    });
    setTest({ ...test, sections: newSections });
  };

  const removeOption = (sIndex, qIndex, oIndex) => {
    const newSections = [...test.sections];
    newSections[sIndex].questions[qIndex].options.splice(oIndex, 1);
    setTest({ ...test, sections: newSections });
  };

  // Submission
  const handleSave = async () => {
    try {
      setLoading(true);
      // Format payload before sending securely
      const payload = {
        ...test,
        duration: test.duration * 60, // convert minutes back to seconds for DB
        tags: test.tags.split(',').map(t => t.trim()).filter(t => t),
        isActive: true
      };
      
      await api.post('/tests', payload);
      setLoading(false);
      onSaved();
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert('Error creating test schemas. Check console for structural problems.');
    }
  };

  return (
    <div className="test-builder-container glass-panel">
      
      <div className="builder-header-bar">
        <h2><FilePlus size={24} style={{ display:'inline', marginRight:'8px' }} /> Create New Assessment</h2>
        <button className="del-btn" onClick={onCancel}><X size={18} /> Cancel</button>
      </div>

      <div className="builder-meta-form">
        <label>Assessment Title</label>
        <input type="text" className="glass-input" name="title" value={test.title} onChange={handleMetaChange} placeholder="e.g. Memory Retention Beta" required />

        <label>Description</label>
        <textarea className="glass-input" name="description" value={test.description} onChange={handleMetaChange} placeholder="Context regarding the cognitive parameters..."></textarea>

        <div className="grid grid-cols-3" style={{ gap: '15px' }}>
          <div>
            <label>Duration (Minutes)</label>
            <input type="number" className="glass-input" name="duration" value={test.duration} onChange={handleMetaChange} />
          </div>
          <div>
            <label>Difficulty</label>
            <select className="glass-input" name="difficultyLevel" value={test.difficultyLevel} onChange={handleMetaChange}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label>Tags (Comma Separated)</label>
            <input type="text" className="glass-input" name="tags" value={test.tags} onChange={handleMetaChange} placeholder="logic, memory, speed" />
          </div>
        </div>
      </div>

      <hr className="builder-divider" />

      {/* Sections Hierarchy */}
      <div className="builder-sections-wrapper">
        {test.sections.map((sec, sIdx) => (
          <div key={sIdx} className="builder-section-block">
            <div className="section-block-header">
              <input 
                type="text" 
                className="glass-input section-title-input" 
                value={sec.title} 
                onChange={(e) => updateSectionTitle(sIdx, e.target.value)} 
              />
               <button className="del-btn-icon" onClick={() => removeSection(sIdx)} title="Remove Section"><Trash2 size={16} /></button>
            </div>

            {/* Questions Array */}
            <div className="builder-questions-wrapper">
              {sec.questions.map((q, qIdx) => (
                <div key={qIdx} className="builder-question-block">
                  <div className="question-header">
                    <span className="q-label">Q{qIdx + 1} ({q.type.toUpperCase()})</span>
                    <button className="del-btn-icon" onClick={() => removeQuestion(sIdx, qIdx)}><Trash2 size={14} /></button>
                  </div>
                  
                  <textarea 
                    className="glass-input q-text-input" 
                    placeholder="Type the question objective here..."
                    value={q.text}
                    onChange={(e) => updateQuestion(sIdx, qIdx, 'text', e.target.value)}
                  />

                  {q.type === 'text' ? (
                    <div className="text-ans-wrapper">
                      <label>Target Correct Answer (Lowercased logic keyword):</label>
                      <input 
                        type="text" 
                        className="glass-input" 
                        placeholder="e.g. cat" 
                        value={q.ans}
                        onChange={(e) => updateQuestion(sIdx, qIdx, 'ans', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="mcq-options-wrapper">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`mcq-option-row ${opt.isCorrect ? 'correct-row' : ''}`}>
                          <input 
                            type="radio" 
                            name={`correct-${sIdx}-${qIdx}`} 
                            checked={opt.isCorrect}
                            onChange={() => markOptionCorrect(sIdx, qIdx, oIdx)}
                          />
                          <input  
                            type="text" 
                            className="glass-input opt-input" 
                            placeholder="Option text..."
                            value={opt.text}
                            onChange={(e) => updateOptionText(sIdx, qIdx, oIdx, e.target.value)}
                          />
                          <button className="del-btn-icon" onClick={() => removeOption(sIdx, qIdx, oIdx)}><X size={14} /></button>
                        </div>
                      ))}
                      <button className="btn-secondary add-opt-btn" onClick={() => addOption(sIdx, qIdx)}>
                         + Add Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="section-actions">
              <button className="btn-secondary" onClick={() => addQuestion(sIdx, 'scmcq')}>+ Add MCQ Question</button>
              <button className="btn-secondary" onClick={() => addQuestion(sIdx, 'text')}>+ Add Text Question</button>
            </div>
          </div>
        ))}

        <button className="btn-secondary add-section-btn" onClick={addSection}>
          <Plus size={18} /> Add New Section block
        </button>
      </div>

      <div className="builder-footer">
        <button className="btn-primary save-test-btn" onClick={handleSave} disabled={loading || !test.title}>
          <Save size={18} /> {loading ? 'Compiling Schema...' : 'Deploy Assessment to Library'}
        </button>
      </div>
    </div>
  );
};

export default TestBuilder;
