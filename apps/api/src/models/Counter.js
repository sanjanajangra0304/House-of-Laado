import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 1000,
    },
  },
  { timestamps: true }
);

/**
 * Increment and retrieve the next sequence number atomically
 * @param {string} counterName
 * @returns {Promise<number>}
 */
counterSchema.statics.getNextSequence = async function (counterName) {
  const counter = await this.findByIdAndUpdate(
    counterName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

export const Counter = mongoose.model("Counter", counterSchema);
