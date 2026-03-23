const Lote = require('../../models/inventarios/lote');
const Producto = require('../../models/productos/producto');
const ImagenProducto = require('../../models/productos/imagenProducto');
const CategoriaProducto = require('../../models/productos/categoriaProducto');
const Sucursal = require('../../models/sucursales/sucursal');
const { Op } = require('sequelize');

// --- CREAR LOTE ---
exports.createLote = async (req, res) => {
    try {
        const { numeroLote, fechaVencimiento, cantidadActual, costoUnitario, productoId, sucursalId, estado } = req.body;
        const sucursal = await Sucursal.findByPk(sucursalId);
        if (!sucursal) return res.status(400).json({ error: 'Sucursal no encontrada' });
        const numeroLoteConSufijo = `${numeroLote} - ${sucursal.nombre}`;

        const nuevo = await Lote.create({
            numeroLote: numeroLoteConSufijo,
            fechaVencimiento,
            cantidadActual: cantidadActual || 0,
            costoUnitario,
            productoId,
            sucursalId,
            estado
        });

        res.status(201).json({ message: 'Lote creado correctamente', id: nuevo.id });
    } catch (error) {
        console.error('ERROR createLote:', error.message);
        res.status(500).json({ error: 'Error al crear el lote' });
    }
};

// --- OBTENER LISTADO COMPLETO ---
exports.getLotes = async (req, res) => {
    try {
        const { productoId, sucursalId } = req.query;
        const where = {};
        if (productoId) where.productoId = productoId;
        if (sucursalId) where.sucursalId = sucursalId;

        const lotes = await Lote.findAll({
            where,
            include: [
                {
                    model: Producto,
                    attributes: ['id', 'nombre', 'sku', 'categoriaId'],
                    include: [
                        { model: ImagenProducto, attributes: ['id', 'imagen'] },
                        { model: CategoriaProducto, attributes: ['id', 'Categoria'] }
                    ]
                }
            ],
            order: [['fechaVencimiento', 'ASC']]
        });
        res.json(lotes);
    } catch (error) {
        console.error('ERROR getLotes:', error.message);
        res.status(500).json({ error: 'Error al obtener los lotes' });
    }
};

// --- OBTENER LOTE POR ID ---
exports.getLoteById = async (req, res) => {
    try {
        const { id } = req.query;
        const lote = await Lote.findByPk(id, {
            include: [{ model: Producto, attributes: ['id', 'nombre', 'sku'] }]
        });
        if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });
        res.json(lote);
    } catch (error) {
        console.error('ERROR getLoteById:', error.message);
        res.status(500).json({ error: 'Error al obtener el lote' });
    }
};

// --- EDITAR LOTE ---
exports.updateLote = async (req, res) => {
    try {
        const { id } = req.query;
        const { numeroLote, fechaVencimiento, cantidadActual, costoUnitario, productoId, estado } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const lote = await Lote.findByPk(id);
        if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });

        const sucursal = await Sucursal.findByPk(lote.sucursalId);
        if (!sucursal) return res.status(400).json({ error: 'Sucursal no encontrada' });
        const numeroLoteConSufijo = `${numeroLote} - ${sucursal.nombre}`;

        const duplicado = await Lote.findOne({
            where: {
                numeroLote: numeroLoteConSufijo,
                sucursalId: lote.sucursalId,
                id: { [Op.ne]: id }
            }
        });

        if (duplicado) {
            return res.status(400).json({
                error: `Ya existe un lote con el número "${numeroLoteConSufijo}" en esta sucursal.`
            });
        }

        await lote.update({ numeroLote: numeroLoteConSufijo, fechaVencimiento, cantidadActual, costoUnitario, productoId, estado });

        res.json({ message: 'Lote actualizado correctamente' });
    } catch (error) {
        console.error('ERROR updateLote:', error.message);
        res.status(500).json({ error: 'Error al actualizar el lote' });
    }
};

// --- ELIMINAR LOTE ---
exports.deleteLote = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });
        const lote = await Lote.findByPk(id);
        if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });
        await lote.update({ estado: 'Inactivo' });

        res.json({ message: 'Lote desactivado correctamente' });
    } catch (error) {
        console.error('ERROR deleteLote:', error.message);
        res.status(500).json({ error: 'Error al desactivar el lote' });
    }
};
