import { Attempt } from '../models/Attempt.js';

export const getAggregateStats = async (req, res) => {
  try {
    // Aggregation pipeline to get average test scores and completion status 
    const stats = await Attempt.aggregate([
      {
        $group: {
          _id: '$testId',
          averageScore: { $avg: '$totalScore' },
          totalAttempts: { $sum: 1 },
          completedAttempts: {
            $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: '_id',
          as: 'testDetails',
        },
      },
      { $unwind: '$testDetails' },
      {
        $project: {
          _id: 1,
          averageScore: 1,
          totalAttempts: 1,
          completedAttempts: 1,
          testTitle: '$testDetails.title',
          tags: '$testDetails.tags',
        },
      },
      { $sort: { totalAttempts: -1 } },
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
