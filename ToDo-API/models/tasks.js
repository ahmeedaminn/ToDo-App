import mongoose from "mongoose";
import Joi from "joi";

const tasksSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      trim: true,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    dueDate: {
      type: Date,
    },
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", tasksSchema);

const tasksFields = {
  name: Joi.string().min(2).max(50),
  status: Joi.string().valid("pending", "in-progress", "done"),
  dueDate: Joi.date(),
};

export const tasksValidate = (task) => {
  return Joi.object({
    name: tasksFields.name.required(),
    status: tasksFields.status,
    dueDate: tasksFields.dueDate,
  }).validate(task);
};

// Update: optional but at least one
export const tasksUpdateValidate = (task) =>
  Joi.object(tasksFields).min(1).validate(task);
