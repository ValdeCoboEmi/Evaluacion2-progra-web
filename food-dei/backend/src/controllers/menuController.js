const menuService = require('../services/menuService');

// GET /api/menu  (versión mínima para que el frontend funcione, cambiarlo al que le toca)
function getMenu(req, res, next) {
  try {
    return res.json(menuService.obtenerMenu());
  } catch (error) {
    return next(error);
  }
}

module.exports = { getMenu };
