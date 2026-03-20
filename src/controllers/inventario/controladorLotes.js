const Lote = require('../../models/inventario/lote');
const Producto = require('../../models/productos/producto');

// --- CREAR LOTE ---
exports.createLote = async (req, res) => {
    try {
        const { numeroLote, fechaVencimiento, cantidadActual, costoUnitario, productoId, sucursalId } = req.body;

        const nuevo = await Lote.create({
            numeroLote,
            fechaVencimiento,
            cantidadActual: cantidadActual || 0,
            costoUnitario,
            productoId,
            sucursalId
        });

        res.status(201).json({ message: 'Lote creado correctamente', id: nuevo.id });
    } catch (error) {
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
            include: [{ model: Producto, attributes: ['id', 'nombre', 'sku'] }],
            order: [['fechaVencimiento', 'ASC']]
        });
        res.json(lotes);
    } catch (error) {
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
        res.status(500).json({ error: 'Error al obtener el lote' });
    }
};

// --- EDITAR LOTE ---
exports.updateLote = async (req, res) => {
    try {
        const { id } = req.query;
        const { numeroLote, fechaVencimiento, cantidadActual, costoUnitario, productoId } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const lote = await Lote.findByPk(id);
        if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });

        await lote.update({ numeroLote, fechaVencimiento, cantidadActual, costoUnitario, productoId });

        res.json({ message: 'Lote actualizado correctamente' });
    } catch (error) {
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

        await lote.destroy();
        res.json({ message: 'Lote eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el lote' });
    }
};
