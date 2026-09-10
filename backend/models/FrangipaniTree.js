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

    bentTrunk: Number,
    cutoffBranch: Number,
    fertilize: Number,
    flowerColourUnknown: Number,
    gatherStats: Number,
    getPhoto: Number,
    ingroundRoots: Number,
    leafProblem: Number,
    lichen: Number,
    lowSoil: Number,
    prune: Number,
    rootsStrength: Number,
    rust: Number,
    skinnyShape: Number,
    smallSize: Number,
    softBranch: Number,
    stringed: Number,
    sunburnt: Number,
    tipDamage: Number,
    unbalancedShape: Number,
    upsize: Number,
    whiteScale: Number,

    bagSize: {
      type: String,
      required: true,
      default: "Not recorded yet",
    },

    price: Number,

    photoQuality: Number,

    bestPhotoDate: Date,

    recentPhotoDate: {
      type: Date,
      set: (value) => {
        if (value === "No date" || value === 0) {
          return null;
        }
        return value;
      },
    },

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
    outsideTasks: String,
    insideTasks: String,
  },
  {
    collection: "fp2plants",
  },
);

module.exports = mongoose.model("Fp2Plant", frangipaniTreeSchema);
