import { Test } from '../models/Test.js';

export const createTest = async (req, res) => {
  try {
    const test = new Test({
      ...req.body,
      createdBy: req.user._id,
    });
    const createdTest = await test.save();
    res.status(201).json(createdTest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTests = async (req, res) => {
  try {
    const { tags, difficulty } = req.query;
    let query = { isActive: true };
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    if (difficulty) {
      query.difficultyLevel = difficulty;
    }

    const tests = await Test.find(query).select('-sections').populate('createdBy', 'name email');
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

