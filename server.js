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

const treeFields = [
  "tag",
  "position",
  "colour",
  "wcStatus",
  "wcLastChanged",
  "sellScore",
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
    const items = await FrangipaniTree.find(); // or whatever your model is
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

app.get("/api/events/:tag", auth, async function (req, res) {
  const events = await Fp2Event.find({
    tag: req.params.tag,
  }).sort({ occurredAt: -1 });

  res.json(events);
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
