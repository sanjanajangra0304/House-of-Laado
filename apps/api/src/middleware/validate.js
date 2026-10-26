/**
 * Generic Joi request validation middleware
 * Validates request payload and strips unpermitted keys
 *
 * @param {import('joi').ObjectSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""),
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details,
        },
      });
    }

    // Replace request data with sanitized validated values
    req[source] = value;
    next();
  };
}
