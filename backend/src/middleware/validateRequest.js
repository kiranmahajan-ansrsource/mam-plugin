module.exports = function validateRequest(schema, property = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        details: error.details.map(d => d.message),
      });
    }

    req[property] = value;
    next();
  };
};
