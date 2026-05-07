import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // reference to nested doc string ID
  selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],
  answerText: { type: String },
  score: { type: Number },
  evaluated: { type: Boolean, default: false },
  mediaUrls: [{ type: String }],
});

const attemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    totalScore: { type: Number },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded'],
      default: 'in_progress',
    },
    responses: [responseSchema],
  },
  { timestamps: true }
);

// Compound index for unique attempt per user per test (if business logic requires one attempt) or just fast lookup
attemptSchema.index({ testId: 1, userId: 1 });
attemptSchema.index({ status: 1 });

export const Attempt = mongoose.model('Attempt', attemptSchema);
