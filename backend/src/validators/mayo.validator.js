const Joi = require("joi");

const mayoSearchSchema = Joi.object({
  query: Joi.string().trim().min(1).required().messages({
    "any.required": "Search query is required",
    "string.empty": "Search query cannot be empty"
  }),
  pagenumber: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page number must be a number",
    "number.min": "Page number must be at least 1"
  }),
  countperpage: Joi.number().integer().min(1).optional().messages({
    "number.base": "Count per page must be a number",
    "number.min": "Count per page must be at least 1"
  })
});

module.exports = {
  mayoSearchSchema
};
