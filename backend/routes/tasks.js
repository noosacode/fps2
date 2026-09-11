const express = require("express");
const router = express.Router();
const FrangipaniTree = require("../models/FrangipaniTree"); // adjust path
const auth = require("../middleware/auth"); // adjust path

router.get("/outside", auth, async (req, res) => {
  try {
    const tally = await FrangipaniTree.aggregate([
      { $match: { outsideTasks: { $nin: [null, ""] } } },
      {
        $group: {
          _id: "$outsideTasks",
          count: { $sum: 1 },
          onCount: { $sum: { $cond: [{ $eq: ["$wcStatus", "on"] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, task: "$_id", count: 1, onCount: 1 } },
    ]);
    res.json(tally);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/outside/:taskName", auth, async (req, res) => {
  try {
    const trees = await FrangipaniTree.find(
      { outsideTasks: req.params.taskName },
      { _id: 0, tag: 1, position: 1, colour: 1, wcStatus: 1 },
    ).sort({ position: 1 });

    res.json(trees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/inside", auth, async (req, res) => {
  try {
    const tally = await FrangipaniTree.aggregate([
      { $match: { insideTasks: { $nin: [null, ""] } } },
      {
        $group: {
          _id: "$insideTasks",
          count: { $sum: 1 },
          onCount: { $sum: { $cond: [{ $eq: ["$wcStatus", "on"] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, task: "$_id", count: 1, onCount: 1 } },
    ]);
    res.json(tally);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/inside/:taskName", auth, async (req, res) => {
  try {
    const trees = await FrangipaniTree.find(
      { insideTasks: req.params.taskName },
      { _id: 0, tag: 1, position: 1, colour: 1, wcStatus: 1 },
    ).sort({ position: 1 });

    res.json(trees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
