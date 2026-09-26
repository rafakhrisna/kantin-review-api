// utils/asyncHandler.js
// Membungkus fungsi async controller agar error otomatis diteruskan ke error handler
// (menghindari try/catch berulang di setiap controller).

module.exports = function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
