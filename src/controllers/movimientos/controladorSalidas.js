const Salida = require('../../models/movimientos/salida');
const SalidaDetalle = require('../../models/movimientos/salidaDetalle');
const Sucursal = require('../../models/inventario/sucursal');
const Usuario = require('../../models/usuarios/usuario');
const Producto = require('../../models/productos/producto');
const Lote = require('../../models/inventario/lote');
const { sequelize } = require('../../config/database');
const { getIO } = require('../../config/socket');

// --- CREAR SALIDA CON DETALLES ---
exports.createSalida = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { sucursalOrigenId, sucursalDestinoId, usuarioId, detalles } = req.body;
        if (!Array.isArray(detalles) || detalles.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Debe incluir al menos un detalle en la salida' });
        }

        const totalCosto = detalles.reduce((sum, d) => {
            return sum + (parseFloat(d.costoHistorico) * parseInt(d.cantidad));
        }, 0);

        const nuevaSalida = await Salida.create({
            sucursalOrigenId,
            sucursalDestinoId,
            usuarioId,
            totalCosto: totalCosto.toFixed(2),
            estado: 'Enviada'
        }, { transaction: t });

        const detallesPromesas = detalles.map(d =>
            SalidaDetalle.create({
                salidaId: nuevaSalida.id,
                productoId: d.productoId,
                loteId: d.loteId,
                cantidad: d.cantidad,
                costoHistorico: d.costoHistorico
            }, { transaction: t })
        );
        await Promise.all(detallesPromesas);

        await t.commit();
        const io = getIO();
        io.emit('nueva_salida', {
            titulo: 'Nueva Salida Registrada',
            mensaje: `El usuario ${usuarioId} ha registrado una nueva salida a la sucursal ${sucursalId}.`,
            data: {
                id: nuevaSalida.id,
                sucursalId: nuevaSalida.sucursalId,
                totalCosto,
                detalles: detalles
            }
        });
        res.status(201).json({ message: 'Salida registrada correctamente', id: nuevaSalida.id, totalCosto });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: 'Error al registrar la salida' });
    }
};

exports.getSalidas = async (req, res) => {
    try {
        const salidas = await Salida.findAll({
            include: [
                { model: Sucursal, as: 'SucursalOrigen', attributes: ['id', 'nombre', 'ubicacion'] },
                { model: Sucursal, as: 'SucursalDestino', attributes: ['id', 'nombre', 'ubicacion'] },
                { model: Usuario, attributes: ['id', 'nombre', 'correo'] },
                {
                    model: SalidaDetalle,
                    include: [
                        { model: Producto, attributes: ['id', 'nombre', 'sku'] },
                        { model: Lote, attributes: ['id', 'numeroLote', 'fechaVencimiento'] }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(salidas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las salidas' });
    }
};

// --- OBTENER SALIDA POR ID ---
exports.getSalidaById = async (req, res) => {
    try {
        const { id } = req.query;
        const salida = await Salida.findByPk(id, {
            include: [
                // IGUAL AQUÍ
                { model: Sucursal, as: 'SucursalOrigen', attributes: ['id', 'nombre', 'ubicacion'] },
                { model: Sucursal, as: 'SucursalDestino', attributes: ['id', 'nombre', 'ubicacion'] },
                { model: Usuario, attributes: ['id', 'nombre', 'correo'] },
                {
                    model: SalidaDetalle,
                    include: [
                        { model: Producto, attributes: ['id', 'nombre', 'sku'] },
                        { model: Lote, attributes: ['id', 'numeroLote', 'fechaVencimiento', 'costoUnitario'] }
                    ]
                }
            ]
        });
        if (!salida) return res.status(404).json({ error: 'Salida no encontrada' });
        res.json(salida);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la salida' });
    }
};

// --- ACTUALIZAR ESTADO DE SALIDA ---
exports.updateEstadoSalida = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.query;
        const { estado } = req.body;
        if (!id) {
            await t.rollback();
            return res.status(400).json({ error: 'ID no proporcionado' });
        }
        const salida = await Salida.findByPk(id);
        if (!salida) {
            await t.rollback();
            return res.status(404).json({ error: 'Salida no encontrada' });
        }
        if (estado === 'Recibida' && salida.estado !== 'Recibida') {
            const detalles = await SalidaDetalle.findAll({ where: { salidaId: salida.id }, transaction: t });
            for (const detalle of detalles) {
                const loteOrigen = await Lote.findByPk(detalle.loteId, { transaction: t });
                const [loteDestino, created] = await Lote.findOrCreate({
                    where: {
                        numeroLote: loteOrigen.numeroLote,
                        productoId: detalle.productoId,
                        sucursalId: salida.sucursalDestinoId
                    },
                    defaults: {
                        fechaVencimiento: loteOrigen.fechaVencimiento,
                        cantidadActual: detalle.cantidad,
                        costoUnitario: loteOrigen.costoUnitario
                    },
                    transaction: t
                });
                if (!created) {
                    await loteDestino.update({
                        cantidadActual: loteDestino.cantidadActual + detalle.cantidad
                    }, { transaction: t });
                }
            }
        }
        await salida.update({ estado }, { transaction: t });
        await t.commit();
        res.json({ message: 'Estado actualizado y mercancía ingresada al destino correctamente' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: 'Error al actualizar el estado de la salida', details: error.message });
    }
};

// --- ELIMINAR SALIDA ---
exports.deleteSalida = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.query;
        if (!id) {
            await t.rollback();
            return res.status(400).json({ error: 'ID no proporcionado' });
        }
        const salida = await Salida.findByPk(id);
        if (!salida) {
            await t.rollback();
            return res.status(404).json({ error: 'Salida no encontrada' });
        }
        if (salida.estado === 'Recibida') {
            await t.rollback();
            return res.status(400).json({ error: 'No puedes anular una salida que ya fue recibida por la sucursal destino' });
        }

        if (salida.estado === 'Anulada') {
            await t.rollback();
            return res.status(400).json({ error: 'Esta salida ya se encuentra anulada' });
        }
        const detalles = await SalidaDetalle.findAll({ where: { salidaId: id }, transaction: t });
        for (const detalle of detalles) {
            const loteOrigen = await Lote.findByPk(detalle.loteId, { transaction: t });

            if (loteOrigen) {
                await loteOrigen.update({
                    cantidadActual: loteOrigen.cantidadActual + detalle.cantidad
                }, { transaction: t });
            }
        }
        await salida.update({ estado: 'Anulada' }, { transaction: t });
        await t.commit();
        res.json({ message: 'Salida anulada y stock devuelto a origen correctamente' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: 'Error al anular la salida' });
    }
};
