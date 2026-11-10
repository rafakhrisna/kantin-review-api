const { ApiError } = require('./errorHandler');

function validate(schemas) {
  return (req, res, next) => {
    const errors = [];
    req.validated = {};

    for (const source of ['params', 'query', 'body']) {
      if (!schemas[source]) continue;
      const result = schemas[source].safeParse(req[source]);
      if (result.success) {
        req.validated[source] = result.data;
      } else {
        for (const issue of result.error.issues) {
          errors.push({
            field: issue.path.join('.') || source,
            message: issue.message,
          });
        }
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(400, 'Validasi gagal', errors));
    }
    next();
  };
}

module.exports = validate;