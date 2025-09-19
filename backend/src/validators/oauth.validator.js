const Joi = require("joi");

const oauthLoginSchema = Joi.object({
  returnTo: Joi.string().optional()
});

const oauthCallbackSchema = Joi.object({
  code: Joi.string().required().messages({
    "any.required": "Authorization code is required"
  }),
  state: Joi.string().required().messages({
    "any.required": "OAuth state is required"
  })
});

module.exports = {
  oauthLoginSchema,
  oauthCallbackSchema
};
