import { Attempt } from '../models/Attempt.js';
import { Test } from '../models/Test.js';
import { GoogleGenAI } from '@google/genai';

export const startAttempt = async (req, res) => {
  try {
    const { testId } = req.body;
    
    // Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const attempt = new Attempt({
      testId,
      userId: req.user._id,
      status: 'in_progress',
    });

    const createdAttempt = await attempt.save();
    res.status(201).json(createdAttempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const { responses } = req.body; // array of { questionId, selectedOptionIds }
    const attempt = await Attempt.findById(req.params.id);

    if (!attempt || attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Attempt not found or unauthorized' });
    }

    if (attempt.status === 'submitted' || attempt.status === 'graded') {
      return res.status(400).json({ message: 'Attempt already submitted' });
    }

    // Grade the attempt based on exact question matches
    const test = await Test.findById(attempt.testId);
    let totalScore = 0;
    let maxScorable = 0;

    // Load available questions into memory
    const qMap = {};
    if (test && test.sections) {
      test.sections.forEach(sec => {
        sec.questions.forEach(q => {
          qMap[q._id.toString()] = q;
        });
      });
    }

    // Evaluate
    for (const res of responses) {
      if (!res.questionId) continue;
      const q = qMap[res.questionId.toString()];
      if (q) {
        maxScorable += q.maxScore || 1;
        
        if (q.type === 'drawing') {
          if (process.env.GEMINI_API_KEY && res.answerText && res.answerText.startsWith('data:image')) {
            try {
              const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
              
              const parts = res.answerText.split(',');
              if (parts.length === 2) {
                const mimeTypeMatch = parts[0].match(/:(.*?);/);
                if (mimeTypeMatch) {
                  const mimeType = mimeTypeMatch[1];
                  const base64Data = parts[1];
                  
                  const prompt = `You are a cognitive test evaluator scoring a drawing task. The user was asked to: "${q.text}". Score the drawing out of a maximum of ${q.maxScore || 1}. Be lenient and give partial credit if the drawing is somewhat close. Respond ONLY with a single numeric integer representing the final score. Do not include any other text.`;
                  
                  console.log(`[Gemini] Evaluating question: "${q.text}"`);
                  const result = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [
                      prompt,
                      { inlineData: { data: base64Data, mimeType } }
                    ]
                  });
                  
                  const scoreText = result.text.trim();
                  console.log(`[Gemini] Raw response: "${scoreText}"`);
                  const scoreValue = parseInt(scoreText.replace(/[^0-9]/g, ''), 10);
                  console.log(`[Gemini] Parsed score: ${scoreValue} / ${q.maxScore}`);
                  
                  if (!isNaN(scoreValue)) {
                    res.score = Math.min(scoreValue, q.maxScore || 1);
                    res.evaluated = true;
                    totalScore += res.score;
                  }
                }
              }
            } catch (err) {
              console.error("Gemini Evaluation Error:", err);
            }
          }
        } else if (q.type === 'scmcq' || q.type === 'mcmcq') {
          // Compare options
          const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o._id.toString());
          const selected = res.selectedOptionIds || [];
          const isCorrect = selected.length > 0 && 
                            selected.every(id => correctOptionIds.includes(id.toString())) && 
                            selected.length === correctOptionIds.length;
          
          if (isCorrect) totalScore += q.maxScore || 1;
        } else {
          // Textual validation
          const userAns = typeof res.answerText === 'string' ? res.answerText.trim().toLowerCase() : '';
          const correctAns = typeof q.ans === 'string' ? q.ans.trim().toLowerCase() : '';
          if (correctAns && userAns.includes(correctAns)) {
            totalScore += q.maxScore || 1;
          }
        }
      }
    }

    let score = maxScorable > 0 ? Math.round((totalScore / maxScorable) * 100) : 0;

    attempt.responses = responses;
    attempt.submittedAt = new Date();
    attempt.status = 'graded'; 
    attempt.totalScore = score;

    await attempt.save();
    res.json(attempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.user._id })
      .populate('testId', 'title tags difficultyLevel')
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({})
      .populate('userId', 'name email')
      .populate('testId', 'title tags difficultyLevel')
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
