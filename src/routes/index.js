const { Router } = require('express');
const Rutas = Router();

Rutas.use('/usuarios', require('./usuarios/rutasUsuarios'));
Rutas.use('/sucursales', require('./sucursales/rutasSucursales'));
Rutas.use('/categorias', require('./productos/rutasCategoriasProductos'));
Rutas.use('/productos', require('./productos/rutasProductos'));
Rutas.use('/lotes', require('./inventario/rutasLotes'));
Rutas.use('/salidas', require('./movimientos/rutasSalidas'));

module.exports = Rutas;