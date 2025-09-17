import mongoose from "mongoose";
import Joi from "joi";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const usersSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      unique: true,
      min: 3,
      max: 50,
      required: true,
    },
    password: {
      type: String,
      min: 8,
      max: 50,
      required: true,
    },
    email: {
      type: String,
      required: true,
      minLength: 5,
      maxLength: 50,
      unique: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

usersSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

usersSchema.methods.generateAuthToken = function () {
  // jwt.sign(payload, privateKey, optional expire)
  return jwt.sign(
    { _id: this._id, userName: this.userName, isAdmin: this.isAdmin },
    process.env.JWT_PRIVATE_KEY
  );
};

export const User = mongoose.model("User", usersSchema);

const userFields = {
  userName: Joi.string().min(3).max(50),
  password: Joi.string().min(8).max(50),
  email: Joi.string().min(5).max(50).email(),
};

// Create: all required
export const usersCreateValidate = (user) =>
  Joi.object({
    userName: userFields.userName.required(),
    password: userFields.password.required(),
    email: userFields.email.required(),
  }).validate(user);

// Update: optional but at least one
export const usersUpdateValidate = (user) =>
  Joi.object(userFields).min(1).validate(user);
