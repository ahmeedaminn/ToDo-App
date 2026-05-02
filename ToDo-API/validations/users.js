import Joi from "joi";

const userFields = {
  username: Joi.string().min(3).max(50),
  password: Joi.string().min(8).max(50),
  email: Joi.string().min(5).max(50).email(),
  role: Joi.string().valid("PROFESSOR", "TEACHING_ASSISTANT", "EMPLOYEE", "ADMIN"),
};

// Create: all required
export const usersCreateValidate = (user) =>
  Joi.object({
    username: userFields.username.required(),
    password: userFields.password.required(),
    email: userFields.email.required(),
    role: userFields.role.required(),
  }).validate(user);

// Update: optional but at least one
export const usersUpdateValidate = (user) =>
  Joi.object(userFields).min(1).validate(user);

export const authValidator = function (req) {
  const scheme = Joi.object({
    username: Joi.string().min(3).max(50),
    password: Joi.string().min(8).max(50).required(),
    email: Joi.string().min(5).max(50).email(),
    role: userFields.role,
  }).xor("email", "username");

  return scheme.validate(req);
};

export const userRoleValidate = (body) => {
  return Joi.object({
    role: Joi.string()
      .valid("PROFESSOR", "TEACHING_ASSISTANT", "EMPLOYEE", "ADMIN")
      .required(),
  }).validate(body);
};
