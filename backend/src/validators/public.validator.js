const Joi = require("joi");

const insertValidator = Joi.object({
  SystemIdentifier: Joi.string().required(),
  altText: Joi.string().allow(""), 
  isDecorative: Joi.boolean().optional(),
  Path_TR1: Joi.object({
    URI: Joi.string().uri().optional()
  }).optional(),
  Path_TR7: Joi.object({
    URI: Joi.string().uri().optional()
  }).optional(),
}).unknown(true);

const searchDbValidator = Joi.object({
  query: Joi.string().trim().min(1).required()
});


module.exports = {
  insertValidator,
  searchDbValidator
};
