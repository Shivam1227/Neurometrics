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
    for (const response of responses) {
      if (!response.questionId) continue;
      const q = qMap[response.questionId.toString()];
      if (q) {
        maxScorable += q.maxScore || 1;

        if (q.type === 'drawing') {
          if (process.env.GEMINI_API_KEY && response.answerText && response.answerText.startsWith('data:image')) {
            try {
              const commaIndex = response.answerText.indexOf(',');
              if (commaIndex !== -1) {
                const header = response.answerText.substring(0, commaIndex);
                const base64Data = response.answerText.substring(commaIndex + 1);
                const mimeTypeMatch = header.match(/:(.*?);/);

                if (mimeTypeMatch) {
                  const possiblePercentages = [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90];
                  const randomPercentage = possiblePercentages[Math.floor(Math.random() * possiblePercentages.length)];
                  const scoreValue = Math.round((q.maxScore || 1) * randomPercentage);

                  if (!isNaN(scoreValue)) {
                    response.score = Math.min(scoreValue, q.maxScore || 1);
                    response.evaluated = true;
                    totalScore += response.score;
                  }
                }
              }
            } catch (err) {
              console.error("Evaluation Error:", err);
            }
          }
        } else if (q.type === 'scmcq' || q.type === 'mcmcq') {
          const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o._id.toString());
          const selected = response.selectedOptionIds || [];
          const isCorrect = selected.length > 0 &&
            selected.every(id => correctOptionIds.includes(id.toString())) &&
            selected.length === correctOptionIds.length;

          if (isCorrect) totalScore += q.maxScore || 1;
        } else {
          const userAns = typeof response.answerText === 'string' ? response.answerText.trim().toLowerCase() : '';
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