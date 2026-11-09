const mongoose = require("mongoose");

const colourPrioritySchema = new mongoose.Schema(
  {
    colour: {
      type: String,
      required: true,
      unique: true,
    },

    priority: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    collection: "fp2colourpriorities",
  },
);

module.exports = mongoose.model("ColourPriority", colourPrioritySchema);
