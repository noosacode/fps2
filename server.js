require("dotenv").config();

const express = require("express");
console.log(process.env.MONGODB_URI?.substring(0, 30));
const mongoose = require("mongoose");
const FrangipaniTree = require("./backend/models/FrangipaniTree");
const Fp2Event = require("./backend/models/Fp2Event");
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
  "gatherStats",
  "getPhoto",
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

app.get("/api/trees/turnon", auth, async (req, res) => {
  try {
    const items = await FrangipaniTree.find({
      wcStatus: { $ne: "on" },
      sellScore: { $gte: 7 },
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/trees/turnoff", auth, async (req, res) => {
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

app.get("/api/summary/colours", auth, async (req, res) => {
  try {
    const colours = await FrangipaniTree.aggregate([
      {
        $group: {
          _id: "$colour",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json(colours);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load colour summary" });
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

app.get("/api/trees/:tag", auth, async function (req, res) {
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

app.get("/api/trees/positions/:first/:last", auth, async function (req, res) {
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

app.get("/api/events/:tag", auth, async function (req, res) {
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