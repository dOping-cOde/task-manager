import MockTest from "../models/MockTest.js";

/**
 * @desc    Get all mock tests for the logged-in user (oldest first, for trend charts)
 * @route   GET /api/mock-tests
 * @access  Private
 */
export const getMockTests = async (req, res, next) => {
  try {
    const tests = await MockTest.find({ user: req.user._id }).sort({
      date: 1,
    });
    res.json(tests);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new mock test
 * @route   POST /api/mock-tests
 * @access  Private
 */
export const createMockTest = async (req, res, next) => {
  try {
    const {
      name,
      provider,
      link,
      type,
      subject,
      date,
      score,
      maxScore,
      durationMin,
      sections,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error("Mock test name is required");
    }

    if (score === undefined || score === null || score === "") {
      res.status(400);
      throw new Error("Score is required");
    }

    const mockTest = await MockTest.create({
      user: req.user._id,
      name,
      provider,
      link,
      type,
      subject,
      date: date || Date.now(),
      score,
      maxScore,
      durationMin,
      sections,
      notes,
    });

    res.status(201).json(mockTest);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing mock test
 * @route   PUT /api/mock-tests/:id
 * @access  Private
 */
export const updateMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);

    if (!mockTest) {
      res.status(404);
      throw new Error("Mock test not found");
    }

    if (mockTest.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this mock test");
    }

    const {
      name,
      provider,
      link,
      type,
      subject,
      date,
      score,
      maxScore,
      durationMin,
      sections,
      notes,
    } = req.body;

    if (name !== undefined) mockTest.name = name;
    if (provider !== undefined) mockTest.provider = provider;
    if (link !== undefined) mockTest.link = link;
    if (type !== undefined) mockTest.type = type;
    if (subject !== undefined) mockTest.subject = subject;
    if (date !== undefined) mockTest.date = date;
    if (score !== undefined) mockTest.score = score;
    if (maxScore !== undefined) mockTest.maxScore = maxScore;
    if (durationMin !== undefined) mockTest.durationMin = durationMin;
    if (sections !== undefined) mockTest.sections = sections;
    if (notes !== undefined) mockTest.notes = notes;

    const updated = await mockTest.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a mock test
 * @route   DELETE /api/mock-tests/:id
 * @access  Private
 */
export const deleteMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);

    if (!mockTest) {
      res.status(404);
      throw new Error("Mock test not found");
    }

    if (mockTest.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this mock test");
    }

    await mockTest.deleteOne();
    res.json({ id: req.params.id, message: "Mock test deleted" });
  } catch (error) {
    next(error);
  }
};