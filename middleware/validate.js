function validate(schema, source = "body") {
  return (req, res, next) => {
    const input = source === "query" ? req.query : req.body;
    const result = schema.safeParse(input);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    if (source === "query") {
      req.query = result.data;
    } else {
      req.body = result.data;
    }
    next();
  };
}

module.exports = validate;
