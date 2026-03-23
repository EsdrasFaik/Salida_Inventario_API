const Sucursal = require('../../models/sucursales/sucursal');
const Usuario = require('../../models/usuarios/usuario');
const Lote = require('../../models/inventarios/lote');
const Salida = require('../../models/movimientos/salida');
const { sequelize } = require('../../config/database');

// --- CREAR SUCURSAL ---
exports.createSucursal = async (req, res) => {
    try {
        const { nombre, ubicacion } = req.body;



        const nueva = await Sucursal.create({ nombre, ubicacion });

        res.status(201).json({ message: 'Sucursal creada correctamente', id: nueva.id });
    } catch (error) {
        console.error('ERROR createSucursal:', error.message);
        res.status(500).json({ error: 'Error al crear la sucursal' });
    }
};

// --- OBTENER LISTADO COMPLETO ---
exports.getSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM usuarios WHERE usuarios.sucursalId = \`Sucursal\`.\`id\`)`),
                        'totalUsuarios'
                    ],
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM lotes WHERE lotes.sucursalId = \`Sucursal\`.\`id\`)`),
                        'totalLotes'
                    ],
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM salidas WHERE salidas.sucursalOrigenId = \`Sucursal\`.\`id\`)`),
                        'totalSalidasOrigen'
                    ],
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM salidas WHERE salidas.sucursalDestinoId = \`Sucursal\`.\`id\`)`),
                        'totalSalidasDestino'
                    ],
                ]
            },
            order: [['nombre', 'ASC']]
        });

        const resultado = sucursales.map(s => ({
            ...s.toJSON(),
            tieneRegistrosVinculados:
                parseInt(s.dataValues.totalUsuarios) > 0 ||
                parseInt(s.dataValues.totalLotes) > 0 ||
                parseInt(s.dataValues.totalSalidasOrigen) > 0 ||
                parseInt(s.dataValues.totalSalidasDestino) > 0,
        }));

        res.json(resultado);
    } catch (error) {
        console.error('ERROR getSucursales:', error.message);
        res.status(500).json({ error: 'Error al obtener las sucursales' });
    }
};

// --- OBTENER SUCURSAL POR ID ---
exports.getSucursalById = async (req, res) => {
    try {
        const { id } = req.query;
        const sucursal = await Sucursal.findByPk(id);
        if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });
        const usuariosCount = await Usuario.count({ where: { sucursalId: id } });
        const lotesCount = await Lote.count({ where: { sucursalId: id } });
        const salidasOrigenCount = await Salida.count({ where: { sucursalOrigenId: id } });
        const salidasDestinoCount = await Salida.count({ where: { sucursalDestinoId: id } });
        const tieneRegistrosVinculados = (usuariosCount > 0 || lotesCount > 0 || salidasOrigenCount > 0 || salidasDestinoCount > 0);
        res.json({ ...sucursal.toJSON(), tieneRegistrosVinculados });
    } catch (error) {
        console.error('ERROR getSucursalById:', error.message);
        res.status(500).json({ error: 'Error al obtener la sucursal' });
    }
};

// --- EDITAR SUCURSAL ---
exports.updateSucursal = async (req, res) => {
    try {
        const { id } = req.query;
        const { nombre, ubicacion, estado } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const sucursal = await Sucursal.findByPk(id);
        if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });

        await sucursal.update({ nombre, ubicacion, estado });

        res.json({ message: 'Sucursal actualizada correctamente' });
    } catch (error) {
        console.error('ERROR updateSucursal:', error.message);
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
        console.error('ERROR deleteSucursal:', error.message);
        res.status(500).json({ error: 'Error al eliminar la sucursal' });
    }
};
