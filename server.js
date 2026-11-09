require("dotenv").config();

const express = require("express");
console.log(process.env.MONGODB_URI?.substring(0, 30));
const mongoose = require("mongoose");
const FrangipaniTree = require("./backend/models/FrangipaniTree");
const Fp2Event = require("./backend/models/Fp2Event");
const ColourPriority = require("./backend/models/ColourPriority");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./backend/models/User");
const auth = require("./backend/middleware/auth");

const app = express();
app.use(express.json());

const taskRoutes = require("./backend/routes/tasks");
app.use("/api/tasks", taskRoutes);

const treeFields = [
  "tag",
  "position",
  "colour",
  "wcStatus",
  "wcLastChanged",
  "sellScore",
  "rootsScore",
  "shapeScore",
  "foliageScore",
  "bagSize",
  "price",
  "photoQuality",
  "bestPhotoDate",
  "recentPhotoDate",
  "transportSize",
  "relativeSize",
  "soilPercent",
  "dateAdded",
  "notes",
  "notesGeneral",
  "outsideTasks",
  "insideTasks",
  "bentTrunk",
  "cutoffBranch",
  "fertilize",
  "flowerColourUnknown",
  "fruitSpottingBug",
  "gatherStats",
  "getPhoto",
  "health",
  "ingroundRoots",
  "leafProblem",
  "lichen",
  "lowSoil",
  "prune",
  "rootsStrength",
  "rust",
  "skinnyShape",
  "smallSize",
  "softBranch",
  "stringed",
  "sunburnt",
  "tipDamage",
  "unbalancedShape",
  "upsize",
  "whiteScale",
];
const dateFields = new Set([
  "wcLastChanged",
  "bestPhotoDate",
  "recentPhotoDate",
  "dateAdded",
]);

function eventValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value === undefined ? null : value;
}

function valuesMatch(field, first, second) {
  const firstValue = eventValue(first);
  const secondValue = eventValue(second);

  if (dateFields.has(field) && typeof firstValue === "string" && typeof secondValue === "string") {
    const firstDate = Date.parse(firstValue);
    const secondDate = Date.parse(secondValue);
    if (!Number.isNaN(firstDate) && !Number.isNaN(secondDate)) {
      return firstDate === secondDate;
    }
  }

  return firstValue === secondValue;
}

function changedFields(before, after) {
  return treeFields
    .filter((field) => !valuesMatch(field, before[field], after[field]))
    .map((field) => ({
      field,
      previousValue: eventValue(before[field]),
      newValue: eventValue(after[field]),
    }));
}

async function writeJournalEvent({ tag, eventType, username, changes }) {
  if (changes.length === 0) {
    return;
  }

  await Fp2Event.create({ tag, eventType, username, changes });
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongoose connected");
  })
  .catch((error) => {
    console.log("MongoDB connection failed");
    console.log(error.message);
  });

app.use(express.static("public"));

const FrangipaniTrees = require("./backend/models/FrangipaniTree");

app.get("/api/trees/turnon", async (req, res) => {
    try {
      const items = await FrangipaniTree.find({
        wcStatus: {
          $in: ["off", "0", "Never added to WC"],
        },
        sellScore: { $gte: 7 },
      });

      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.get("/api/trees/turnoff", async (req, res) => {
  try {
    const items = await FrangipaniTree.find({
      wcStatus: "on",
      sellScore: { $lt: 7 },
    }).sort({ sellScore: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/summary/colours", async (req, res) => {
  try {
    const colours = await FrangipaniTree.aggregate([
      {
        $group: {
          _id: "$colour",

          nursery: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$position", 100] },
                    { $lte: ["$position", 6999] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          published: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$position", 100] },
                    { $lte: ["$position", 6999] },
                    { $eq: ["$wcStatus", "on"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          nursery: -1,
          published: 1,
          _id: 1,
        },
      },
    ]);

    app.get("/api/summary/colours/:colour/sizes", async (req, res) => {
      try {
        const sizeCounts = await FrangipaniTree.aggregate([
          {
            $match: {
              colour: req.params.colour,
              position: { $gte: 100, $lte: 6999 },
            },
          },
          {
            $group: {
              _id: "$bagSize",
              nursery: { $sum: 1 },
              published: {
                $sum: {
                  $cond: [{ $eq: ["$wcStatus", "on"] }, 1, 0],
                },
              },
            },
          },
        ]);

        const sizeOrder = [
          "0",
          "2",
          "20",
          "25",
          "35",
          "45",
          "75",
          "100",
          "150",
          "200",
          "250",
          "300",
          "350",
          "400",
          "500",
        ];

        const sizeMap = new Map();

        sizeOrder.forEach((size) => {
          sizeMap.set(size, {
            size,
            nursery: 0,
            published: 0,
          });
        });

        sizeCounts.forEach((item) => {
          let size = String(item._id ?? "0");

          if (size === "Not recorded yet") {
            size = "0";
          }

          if (sizeMap.has(size)) {
            sizeMap.set(size, {
              size,
              nursery: item.nursery,
              published: item.published,
            });
          } else {
            // Preserve any unexpected sizes rather than losing their counts.
            sizeMap.set(size, {
              size,
              nursery: item.nursery,
              published: item.published,
            });
          }
        });

        res.json({
          colour: req.params.colour,
          sizes: [...sizeMap.values()],
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load colour size summary" });
      }
    });

    const priorities = await ColourPriority.find();

    const priorityMap = {};

    priorities.forEach((item) => {
      priorityMap[item.colour] = item.priority;
    });

    const summary = colours.map((item) => ({
      ...item,
      priority: priorityMap[item._id] ?? 0,
    }));

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load colour summary" });
  }
});


app.put("/api/summary/colours/:colour", auth, async (req, res) => {
  try {
    const priority = Number(req.body.priority);

    if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
      return res
        .status(400)
        .json({ error: "Priority must be a whole number from 0 to 100" });
    }

    const result = await ColourPriority.findOneAndUpdate(
      { colour: req.params.colour },
      { priority },
      { returnDocument: "after", upsert: true, runValidators: true },
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save priority" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();
    res.send("User registered");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("Invalid username or password");
    }

    // create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
    );

    res.json({ token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/api/trees/cleanup-notes", auth, async (req, res) => {
  try {
    const startPosition = Number(req.query.start) || 0;

    const tree = await FrangipaniTree.findOne({
      position: { $gte: startPosition },
      $or: [
        { notes: { $nin: [null, ""] } },
        { notesGeneral: { $nin: [null, ""] } },
      ],
    }).sort({ position: 1 });

    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/trees/cleanup-notes/:tag", auth, async (req, res) => {
  try {
    const tree = await FrangipaniTree.findOne({ tag: req.params.tag });

    if (!tree) {
      return res.status(404).json({
        message: "Tree not found.",
      });
    }

    const allowedFields = [
      "notes",
      "notesGeneral",
      "outsideTasks",
      "insideTasks",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        tree[field] = req.body[field];
      }
    });

    await tree.save();

    res.json(tree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/trees/:tag", async function (req, res) {
  const tree = await FrangipaniTree.findOne({
    tag: req.params.tag,
  });

  if (!tree) {
    return res.status(404).json({
      message: "Tree not found.",
    });
  }

  res.json(tree);
});

app.get("/api/trees/positions/:first/:last", async function (req, res) {
  const trees = await FrangipaniTree.find({
    position: {
      $gte: Number(req.params.first),
      $lte: Number(req.params.last),
    },
  }).sort({ position: 1 });

  res.json(trees);
});

app.get("/api/trees/position/:position", auth, async (req, res) => {
  try {
    const tree = await FrangipaniTree.findOne({
      position: Number(req.params.position),
    });

    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/trees/:tag", auth, async function (req, res) {
  try {
    const tree = await FrangipaniTree.findOne({ tag: req.params.tag });

    if (!tree) {
      return res.status(404).json({
        message: "Tree not found.",
      });
    }

    const before = tree.toObject();
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(
        ([field, value]) => treeFields.includes(field) && field !== "tag" && value !== undefined,
      ),
    );

    if (req.body.clearRecentPhotoDate === true) {
      updates.recentPhotoDate = null;
    }

    if (req.body.clearBestPhotoDate === true) {
      updates.bestPhotoDate = null;
    }

    if (req.body.clearWcLastChanged === true) {
      updates.wcLastChanged = null;
    }

    tree.set(updates);
    await tree.validate();
    const changes = changedFields(before, tree.toObject());

    if (changes.length > 0) {
      await tree.save();
      await writeJournalEvent({
        tag: tree.tag,
        eventType: "updated",
        username: req.user.username,
        changes,
      });
    }

    res.json(tree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/history-search", auth, async function (req, res) {
  try {
    const { from, to, username, field, newValue } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "From and To dates are required.",
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date range.",
      });
    }

    const eventFilter = {
      occurredAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    };

    if (username) {
      eventFilter.username = username;
    }

    if (field || newValue) {
      const changeFilter = {};

      if (field) {
        changeFilter.field = field;
      }

      if (newValue !== undefined && newValue !== "") {
        changeFilter.newValue = newValue;
      }

      eventFilter.changes = {
        $elemMatch: changeFilter,
      };
    }

    const events = await Fp2Event.find(eventFilter)
      .sort({ occurredAt: 1 })
      .lean();

    const results = [];

    for (const event of events) {
      const matchingChanges = event.changes.filter((change) => {
        if (field && change.field !== field) {
          return false;
        }

        if (
          newValue !== undefined &&
          newValue !== "" &&
          String(change.newValue) !== String(newValue)
        ) {
          return false;
        }

        return true;
      });

      if (matchingChanges.length === 0) {
        continue;
      }

      const tree = await FrangipaniTree.findOne({
        tag: event.tag,
      }).lean();

      for (const change of matchingChanges) {
        results.push({
          occurredAt: event.occurredAt,
          tag: event.tag,
          username: event.username || "",
          field: change.field,
          previousValue: change.previousValue,
          newValue: change.newValue,
          colour: tree ? tree.colour : "",
          bagSize: tree ? tree.bagSize : "",
          price: tree ? tree.price : "",
          transportSize: tree ? tree.transportSize : "",
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to search history.",
    });
  }
});

app.delete("/api/trees/:tag", auth, async (req, res) => {
  try {
    const tree = await FrangipaniTree.findOneAndDelete({
      tag: req.params.tag,
    });

    if (!tree) {
      return res.status(404).json({ message: "Tree not found." });
    }

    res.json({ message: "Tree deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/events/:tag", async function (req, res) {
  const tree = await FrangipaniTree.findOne({
    tag: req.params.tag,
  });

  const events = await Fp2Event.find({
    tag: req.params.tag,
  }).sort({ occurredAt: -1 });

  res.json({
    colour: tree ? tree.colour : "",
    events: events,
  });
});

app.delete("/api/events/:tag/:eventId", auth, async function (req, res) {
  try {
    const result = await Fp2Event.deleteOne({
      _id: req.params.eventId,
      tag: req.params.tag,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "History entry not found",
      });
    }

    res.json({ message: "History entry deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to delete history entry",
    });
  }
});

app.post("/api/trees", auth, async function (req, res) {
  try {
    const tree = new FrangipaniTree(req.body);
    await tree.save();

    await writeJournalEvent({
      tag: tree.tag,
      eventType: "created",
      username: req.user.username,
      changes: changedFields({}, tree.toObject()),
    });

    res.status(201).json(tree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

if (require.main === module) {
  app.listen(3000, function () {
    console.log("Server running on http://localhost:3000");
  });
}

module.exports = app;