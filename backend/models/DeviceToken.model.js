
import mongoose from "mongoose";

const deviceTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    platform: {
      type: String,
      enum: ["android"],
      default: "android",
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const DeviceToken = mongoose.model("DeviceToken", deviceTokenSchema);

export default DeviceToken;
