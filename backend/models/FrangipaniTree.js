const mongoose = require("mongoose");

const frangipaniTreeSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
    },

    position: {
      type: Number,
      required: true,
      default: 0,
    },

    colour: {
      type: String,
      required: true,
      default: "Not recorded yet",
    },

    wcStatus: {
      type: String,
      required: true,
      default: "Never added to WC",
    },

    wcLastChanged: Date,

    sellScore: {
      type: Number,
      required: true,
      default: 0,
    },

    bagSize: {
      type: String,
      required: true,
      default: "Not recorded yet",
    },

    price: Number,

    photoQuality: Number,

    bestPhotoDate: Date,

    recentPhotoDate: Date,

    transportSize: {
      type: String,
      required: true,
      default: "Not recorded yet",
    },

    relativeSize: {
      type: String,
      required: true,
      default: "Not recorded yet",
    },

    soilPercent: Number,

    dateAdded: {
      type: Date,
      required: true,
      default: Date.now,
    },

    notes: String,
    notesGeneral: String,
    notesOutside: String,
    notesInside: String,
  },
  {
    collection: "fp2plants",
  },
);

module.exports = mongoose.model("Fp2Plant", frangipaniTreeSchema);
