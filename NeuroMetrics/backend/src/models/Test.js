import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: { type: String },
  weight: { type: Number, default: 0.0 },
  isCorrect: { type: Boolean, default: false },
  config: { type: mongoose.Schema.Types.Mixed },
  mediaUrls: [{ type: String }],
});

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['scmcq', 'mcmcq', 'numerical', 'text', 'file_upload', 'drawing'],
    required: true,
  },
  ans: { type: String }, // For text/numerical
  maxScore: { type: Number, default: 1.0 },
  negativeScore: { type: Number, default: 0.0 },
  partialMarking: { type: Boolean, default: false },
  config: { type: mongoose.Schema.Types.Mixed },
  mediaUrls: [{ type: String }],
  options: [optionSchema],
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  orderIndex: { type: Number, required: true },
  duration: { type: Number }, // in seconds
  config: { type: mongoose.Schema.Types.Mixed },
  questions: [questionSchema],
});

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    duration: { type: Number }, // in seconds
    allowNegativeMarking: { type: Boolean, default: false },
    allowPartialMarking: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    test_specific_info: { type: mongoose.Schema.Types.Mixed },
    
    // New Feature: Categorization & Tagging
    tags: [{ type: String }],
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard', 'adaptive'], default: 'medium' },
    
    // Embedded sections
    sections: [sectionSchema],
  },
  { timestamps: true }
);

export const Test = mongoose.model('Test', testSchema);
