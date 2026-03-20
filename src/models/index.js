const Usuario = require('./usuarios/usuario');
const Sucursal = require('./inventario/sucursal');
const CategoriaProducto = require('./productos/categoriaProducto');
const Producto = require('./productos/producto');
const ImagenProducto = require('./productos/imagenProducto');
const Lote = require('./inventario/lote');
const Salida = require('./movimientos/salida');
const SalidaDetalle = require('./movimientos/salidaDetalle');

exports.CrearModelos = async () => {
    const modelos = [
        { modelo: Sucursal, nombre: 'Sucursal' },
        { modelo: Usuario, nombre: 'Usuario' },
        { modelo: CategoriaProducto, nombre: 'CategoriaProducto' },
        { modelo: Producto, nombre: 'Producto' },
        { modelo: ImagenProducto, nombre: 'ImagenProducto' },
        { modelo: Lote, nombre: 'Lote' },
        { modelo: Salida, nombre: 'Salida' },
        { modelo: SalidaDetalle, nombre: 'SalidaDetalle' }
    ];

    for (const { modelo, nombre } of modelos) {
        await modelo.sync()
            .then(() => console.log(`Modelo ${nombre} creado correctamente`))
            .catch(er => {
                console.log(`Error al crear el modelo ${nombre}`);
                console.log(er);
            });
    }
};
