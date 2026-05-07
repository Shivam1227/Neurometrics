import { Review } from '../models/Review.js';
import { Test } from '../models/Test.js';

// @desc    Submit a review for a test
// @route   POST /api/v1/reviews
// @access  Private
export const submitReview = async (req, res) => {
  try {
    const { testId, rating, feedback } = req.body;

    // Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      testId,
      userId: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this test' });
    }

    const review = await Review.create({
      testId,
      userId: req.user._id,
      rating: Number(rating),
      feedback,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/v1/reviews
// @access  Private/Admin
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('userId', 'name email')
      .populate('testId', 'title')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
