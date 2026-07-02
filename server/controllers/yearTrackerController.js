import YearTracker from "../models/YearTracker.js";

const parseYear = (raw) => {
  const year = parseInt(raw, 10);
  if (!Number.isInteger(year) || year < 1970 || year > 3000) return null;
  return year;
};

// GET /api/year-tracker/:year — get (or lazily create) the tracker for a year.
export const getYearTracker = async (req, res, next) => {
  try {
    const year = parseYear(req.params.year);
    if (year === null) {
      res.status(400);
      throw new Error("Invalid year");
    }
    let tracker = await YearTracker.findOne({ user: req.user._id, year });
    if (!tracker) {
      tracker = await YearTracker.create({ user: req.user._id, year, markedDays: [] });
    }
    res.json(tracker);
  } catch (error) {
    next(error);
  }
};

// PUT /api/year-tracker/:year — replace the set of marked (cut) days.
export const updateYearTracker = async (req, res, next) => {
  try {
    const year = parseYear(req.params.year);
    if (year === null) {
      res.status(400);
      throw new Error("Invalid year");
    }
    const { markedDays } = req.body;
    if (!Array.isArray(markedDays)) {
      res.status(400);
      throw new Error("markedDays must be an array");
    }
    const tracker = await YearTracker.findOneAndUpdate(
      { user: req.user._id, year },
      { $set: { markedDays } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(tracker);
  } catch (error) {
    next(error);
  }
};
