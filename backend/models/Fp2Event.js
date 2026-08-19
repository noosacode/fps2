const mongoose = require("mongoose");

const changeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
  },
  { _id: false },
);

const fp2EventSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, index: true },
    eventType: { type: String, required: true, enum: ["created", "updated"] },
    occurredAt: { type: Date, required: true, default: Date.now },
    username: { type: String, default: null },
    changes: { type: [changeSchema], required: true },
  },
  {
    collection: "fp2events",
  },
);

fp2EventSchema.index({ tag: 1, occurredAt: -1 });

module.exports = mongoose.model("Fp2Event", fp2EventSchema);
