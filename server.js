require("dotenv").config();

const express = require("express");
console.log(process.env.MONGODB_URI?.substring(0, 30));
const mongoose = require("mongoose");
const FrangipaniTree = require("./backend/models/FrangipaniTree");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./backend/models/User");
const auth = require("./backend/middleware/auth");

const app = express();
app.use(express.json());

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
  const tree = await FrangipaniTree.findOneAndUpdate(
    { tag: req.params.tag },
    req.body,
    { returnDocument: "after" },
  );

  if (!tree) {
    return res.status(404).json({
      message: "Tree not found.",
    });
  }

  res.json(tree);
});

app.post("/api/trees", auth, async function (req, res) {
  const tree = new FrangipaniTree(req.body);

  await tree.save();

  res.status(201).json(tree);
});

if (require.main === module) {
  app.listen(3000, function () {
    console.log("Server running on http://localhost:3000");
  });
}

module.exports = app;