import Joi from "joi";

const taskFields = {
  title: Joi.string().min(2).max(50),
  description: Joi.string().min(5).max(500),
  dueDate: Joi.date().optional().allow(null, 'undefined'), // allow null or undefined for optional date
  status: Joi.string().valid("TODO", "IN_PROGRESS", "COMPLETED"),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT"),
  assigneeId: Joi.string().uuid().allow(null, ""),

  // NEW: Allow the notes field.
  // We use .allow(null, "") because sometimes they might ONLY send a file!
  resolutionNotes: Joi.string().max(1000).allow(null, ""),
};

export const tasksValidate = (task) => {
  return Joi.object({
    title: taskFields.title.required(),
    description: taskFields.description.required(),
    dueDate: taskFields.dueDate.optional(),
    status: taskFields.status.optional(),
    priority: taskFields.priority.optional(),
    assigneeId: taskFields.assigneeId.optional(),
  }).validate(task);
};

// Update: optional but at least one
export const tasksUpdateValidate = (task) =>
  Joi.object(taskFields).min(1).validate(task);


// NEW: Dedicated validator for your Resolution endpoint
export const taskResolveValidate = (body) => {
  return Joi.object({
    resolutionNotes: taskFields.resolutionNotes,
  }).validate(body);
};