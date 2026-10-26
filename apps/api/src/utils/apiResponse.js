/**
 * Standard API Response Formatters
 * House of Laado Ateliers
 */

export function successResponse(res, data = null, message = "Success", statusCode = 200, pagination = null) {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(res, message = "An error occurred", code = "ERROR", statusCode = 400, details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
}
