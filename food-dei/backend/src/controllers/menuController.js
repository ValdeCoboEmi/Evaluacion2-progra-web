const menuService = require('../services/menuService');

// GET /api/menu
//  200 OK -> [{ id, nombre, precio, stock, categoria }, ...]
//  500    -> error interno 
function getMenu(req, res, next) {
  try {
    return res.status(200).json(menuService.obtenerMenu());
  } catch (error) {
    return next(error);
  }
}

module.exports = { getMenu };