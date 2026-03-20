const Sucursal = require('../../models/inventario/sucursal');

// --- CREAR SUCURSAL ---
exports.createSucursal = async (req, res) => {
    try {
        const { nombre, ubicacion } = req.body;

        const existe = await Sucursal.findOne({ where: { nombre } });
        if (existe) return res.status(400).json({ error: 'Ya existe una sucursal con ese nombre' });

        const nueva = await Sucursal.create({ nombre, ubicacion });

        res.status(201).json({ message: 'Sucursal creada correctamente', id: nueva.id });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la sucursal' });
    }
};

// --- OBTENER LISTADO COMPLETO ---
exports.getSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({ order: [['nombre', 'ASC']] });
        res.json(sucursales);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las sucursales' });
    }
};

// --- OBTENER SUCURSAL POR ID ---
exports.getSucursalById = async (req, res) => {
    try {
        const { id } = req.query;
        const sucursal = await Sucursal.findByPk(id);
        if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });
        res.json(sucursal);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la sucursal' });
    }
};

// --- EDITAR SUCURSAL ---
exports.updateSucursal = async (req, res) => {
    try {
        const { id } = req.query;
        const { nombre, ubicacion } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const sucursal = await Sucursal.findByPk(id);
        if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

        await sucursal.update({ nombre, ubicacion });

        res.json({ message: 'Sucursal actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la sucursal' });
    }
};

// --- ELIMINAR SUCURSAL ---
exports.deleteSucursal = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const sucursal = await Sucursal.findByPk(id);
        if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

        await sucursal.destroy();

        res.json({ message: 'Sucursal eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la sucursal' });
    }
};
