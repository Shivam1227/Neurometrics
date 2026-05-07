import mongoose from 'mongoose';
import { Test } from './src/models/Test.js';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neurometrics');
    await Test.deleteMany({});

    const mockTests = [
      {
        title: 'Cognitive Baseline Test',
        description: 'A general baseline assessment consisting of logic and math.',
        duration: 1800,
        tags: ['general', 'baseline'],
        difficultyLevel: 'easy',
        sections: [
          {
            title: 'General',
            orderIndex: 0,
            questions: [
              { text: 'Identify the pattern that logically completes the sequence: 2, 4, 8, 16...', type: 'scmcq', options: [{ text: '24' }, { text: '32', isCorrect: true }, { text: '64' }, { text: '18' }] },
              { text: 'What is the sum of 12 and 15?', type: 'scmcq', options: [{ text: '27', isCorrect: true }, { text: '28' }, { text: '26' }, { text: '29' }] },
              { text: 'Which cognitive domain primarily involves working memory?', type: 'scmcq', options: [{ text: 'Motor Skills' }, { text: 'Executive Function', isCorrect: true }, { text: 'Visual Perception' }, { text: 'Auditory Processing' }] },
              { text: 'Explain briefly what "semantic memory" is.', type: 'text', ans: 'memory of facts' },
              { text: 'Select the odd one out:', type: 'scmcq', options: [{ text: 'Apple' }, { text: 'Banana' }, { text: 'Carrot', isCorrect: true }, { text: 'Mango' }] }
            ]
          }
        ]
      },
      {
        title: 'Advanced Pattern Recognition',
        description: 'Hard pattern logics and visual acuity.',
        duration: 2400,
        tags: ['pattern', 'logic'],
        difficultyLevel: 'hard',
        sections: [
          {
            title: 'Pattern Phase 1',
            orderIndex: 0,
            questions: [
              { text: 'Complete the sequence: 1, 1, 2, 3, 5, 8, ...', type: 'text', ans: '13' },
              { text: 'If A=1, B=2, what is the numerical value of "CAB"?', type: 'scmcq', options: [{ text: '312', isCorrect: true }, { text: '213' }, { text: '415' }, { text: '123' }] },
              { text: 'Which of the following is not a prime number?', type: 'scmcq', options: [{ text: '13' }, { text: '17' }, { text: '21', isCorrect: true }, { text: '23' }] },
              { text: 'A bat and a ball cost $1.10. The bat costs $1.00 more than the ball. How much does the ball cost?', type: 'scmcq', options: [{ text: '$0.10' }, { text: '$0.05', isCorrect: true }, { text: '$1.05' }, { text: '$0.15' }] },
              { text: 'List 3 ways a cognitive test can be scientifically validated.', type: 'text', ans: 'validity' }
            ]
          }
        ]
      },
      {
        title: 'Memory Retention Beta',
        description: 'Short memory assessment.',
        duration: 900,
        tags: ['memory', 'beta'],
        difficultyLevel: 'medium',
        sections: [
          {
            title: 'Retention',
            orderIndex: 0,
            questions: [
              { text: 'Memorize these words: Cat, Tree, Box. What was the second word?', type: 'scmcq', options: [{ text: 'Cat' }, { text: 'Box' }, { text: 'Tree', isCorrect: true }, { text: 'Car' }] },
              { text: 'What color is typically universally associated with "stop"?', type: 'text', ans: 'red' },
              { text: 'In the acronym "MRI", what does the M stand for?', type: 'scmcq', options: [{ text: 'Magnetic', isCorrect: true }, { text: 'Medical' }, { text: 'Mental' }, { text: 'Memory' }] },
              { text: 'Recall the first word from the first question of this test.', type: 'text', ans: 'cat' },
              { text: 'Is short-term memory the same as working memory? Explain.', type: 'text', ans: 'no' }
            ]
          }
        ]
      },
      {
        title: 'Multimedia Sensory Test',
        description: 'Test containing audio and image recognition tasks.',
        duration: 1200,
        tags: ['sensory', 'multimedia'],
        difficultyLevel: 'medium',
        sections: [
          {
            title: 'Visual & Auditory Processing',
            orderIndex: 0,
            questions: [
              {
                text: 'What animal is shown in the image?',
                type: 'text',
                ans: 'cat',
                mediaUrls: ['https://upload.wikimedia.org/wikipedia/commons/a/a3/June_odd-eyed-cat.jpg']
              },
              {
                text: 'What object commonly makes this sound? (Type your answer)',
                type: 'text',
                ans: 'bell',
                mediaUrls: ['https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3']
              },
              {
                text: 'Which musical instrument is prominently heard? (Select option)',
                type: 'scmcq',
                mediaUrls: ['https://assets.mixkit.co/active_storage/sfx/2281/2281-preview.mp3'],
                options: [{ text: 'Piano', isCorrect: true }, { text: 'Guitar' }, { text: 'Violin' }, { text: 'Flute' }]
              }
            ]
          }
        ]
      },
      {
        title: 'Visuospatial Drawing Assessment',
        description: 'Test containing drawing questions to assess visuospatial skills.',
        duration: 1500,
        tags: ['visuospatial', 'drawing'],
        difficultyLevel: 'medium',
        sections: [
          {
            title: 'Drawing Tasks',
            orderIndex: 0,
            questions: [
              {
                text: 'Draw the hands of the clock to show 10 minutes past 11.',
                type: 'drawing',
                maxScore: 5,
                config: { backgroundTemplate: 'clock' }
              },
              {
                text: 'Copy the intersecting pentagons figure exactly as shown below into the drawing area.',
                type: 'drawing',
                maxScore: 3,
                mediaUrls: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZyBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiPgogICAgPHBvbHlnb24gcG9pbnRzPSIxMDAsMjAgMTYwLDYwIDE0MCwxMzAgNjAsMTMwIDQwLDYwIiAvPgogICAgPHBvbHlnb24gcG9pbnRzPSIxODAsMjAgMjQwLDYwIDIyMCwxMzAgMTQwLDEzMCAxMjAsNjAiIC8+CiAgPC9nPgo8L3N2Zz4=']
              }
            ]
          }
        ]
      }
    ];

    await Test.insertMany(mockTests);

    // Automatically provision the Admin login credentials if they don't exist
    const adminExists = await User.findOne({ email: 'admin@smriti.dev' });
    if (!adminExists) {
      await User.create({
        name: 'Admin Smriti',
        email: 'admin@smriti.dev',
        password: 'password123',
        type: 'admin'
      });
      console.log('Admin user seamlessly provisioned.');
    }

    console.log('Database seeded with mock tests.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDB();
