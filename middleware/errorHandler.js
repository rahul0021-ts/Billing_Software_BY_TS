const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message);
    if (process.env.NODE_ENV === "development") {
      console.error(err.stack);
    }
  
    // Mongoose Validation Error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        error: "ValidationError",
        message: messages.join(", "),
      });
    }
  
    // MongoDB Duplicate Key
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({
        error: "DuplicateKey",
        message: `A record with this ${field} already exists`,
      });
    }
  
    // Mongoose CastError (invalid ObjectId etc.)
    if (err.name === "CastError") {
      return res.status(400).json({
        error: "CastError",
        message: `Invalid value for ${err.path}: ${err.value}`,
      });
    }
  
    // Default 500
    return res.status(err.statusCode || 500).json({
      error: "InternalServerError",
      message: err.message || "An unexpected error occurred",
    });
  };
  
  module.exports = errorHandler;