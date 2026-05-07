import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String },
  },
  { timestamps: true }
);

// A user can only leave one review per test
reviewSchema.index({ testId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
