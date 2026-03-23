const Salida = require('../../models/movimientos/salida');
const SalidaDetalle = require('../../models/movimientos/salidaDetalle');
const Sucursal = require('../../models/sucursales/sucursal');
const Usuario = require('../../models/usuarios/usuario');
const Lote = require('../../models/inventarios/lote');
const { sequelize } = require('../../config/database');
const { getIO } = require('../../config/socket');
const { Op } = require('sequelize');

// --- SIMULAR DETALLE (FIFO por Lotes) ---
exports.simularDetalleSalida = async (req, res) => {
    try {
        const { sucursalOrigenId, productoId, cantidad } = req.body;
        if (!sucursalOrigenId || !productoId) {
            return res.status(400).json({ error: 'sucursalOrigenId y productoId son obligatorios' });
        }
        let cantidadRequerida = parseInt(cantidad);
        if (!cantidadRequerida || cantidadRequerida <= 0) {
            return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
        }
        const lotes = await Lote.findAll({
            where: {
                sucursalId: sucursalOrigenId,
                productoId: productoId,
                cantidadActual: { [Op.gt]: 0 },
                estado: 'Activo'
            },
            order: [['fechaVencimiento', 'ASC']]
        });
        let cantidadDisponibleTotal = lotes.reduce((sum, l) => sum + l.cantidadActual, 0);
        if (cantidadDisponibleTotal < cantidadRequerida) {
            return res.status(400).json({
                error: 'No hay inventario suficiente en esta sucursal.',
                inventarioActual: cantidadDisponibleTotal
            });
        }
        const lotesAEnviar = [];
        let cantidadRestante = cantidadRequerida;
        for (const lote of lotes) {
            if (cantidadRestante <= 0) break;
            const cantidadATomar = Math.min(lote.cantidadActual, cantidadRestante);
            lotesAEnviar.push({
                loteId: lote.id,
                numeroLote: lote.numeroLote,
                fechaVencimiento: lote.fechaVencimiento,
                costoUnitario: lote.costoUnitario,
                cantidadTomada: cantidadATomar,
                costoTotalLinea: (cantidadATomar * parseFloat(lote.costoUnitario)).toFixed(2)
            });
            cantidadRestante -= cantidadATomar;
        }
        res.json({
            cantidadAsignada: cantidadRequerida,
            lotes: lotesAEnviar
        });
    } catch (error) {
        console.error('ERROR simularDetalleSalida:', error.message);
        res.status(500).json({ error: 'Error al simular el detalle de salida' });
    }
};

// --- CREAR SALIDA CON DETALLES ---
exports.createSalida = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const usuarioToken = req.usuario;

        if (usuarioToken.tipoUsuario !== 'Jefe de bodega') {
            await t.rollback();
            return res.status(403).json({ error: 'Solo los Jefes de Bodega pueden realizar salidas' });
        }

        const { sucursalOrigenId, sucursalDestinoId, detalles } = req.body;
        // usuarioId siempre del token, nunca del body

        if (!Array.isArray(detalles) || detalles.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Debe incluir al menos un detalle en la salida' });
        }

        const salidasEnviadas = await Salida.sum('totalCosto', {
            where: { sucursalDestinoId, estado: 'Enviada' },
            transaction: t
        });

        if ((salidasEnviadas || 0) > 5000) {
            await t.rollback();
            return res.status(400).json({ error: 'La sucursal destino tiene más de L5000 en salidas pendientes.' });
        }

        let totalCostoCalculado = 0;
        for (const d of detalles) {
            const lote = await Lote.findByPk(d.loteId, { transaction: t });

            if (!lote || lote.cantidadActual < d.cantidad) {
                await t.rollback();
                return res.status(400).json({
                    error: `Inventario insuficiente para el lote ${lote?.numeroLote || 'desconocido'}. ` +
                        `Disponible: ${lote?.cantidadActual ?? 0}, Requerido: ${d.cantidad}`
                });
            }

            totalCostoCalculado += parseFloat(lote.costoUnitario) * parseInt(d.cantidad);

            await lote.update({
                cantidadActual: lote.cantidadActual - d.cantidad
            }, { transaction: t });
        }

        const nuevaSalida = await Salida.create({
            sucursalOrigenId,
            sucursalDestinoId,
            usuarioId: usuarioToken.id, // ← siempre del token
            totalCosto: totalCostoCalculado.toFixed(2),
            estado: 'Enviada'
        }, { transaction: t });

        const detallesPromesas = detalles.map(d =>
            SalidaDetalle.create({
                salidaId: nuevaSalida.id,
                loteId: d.loteId,
                cantidad: d.cantidad,
                costoHistorico: d.costoHistorico
            }, { transaction: t })
        );

        await Promise.all(detallesPromesas);
        await t.commit();

        const io = getIO();
        io.emit('nueva_salida', {
            id: nuevaSalida.id,
            sucursalOrigenId,
            sucursalDestinoId,
            totalCosto: totalCostoCalculado,
            estado: 'Enviada',
            creadaEn: nuevaSalida.createdAt
        });

        res.status(201).json({
            message: 'Salida registrada y stock deducido correctamente',
            id: nuevaSalida.id,
            totalCosto: totalCostoCalculado
        });
    } catch (error) {
        await t.rollback();
        console.error('ERROR createSalida:', error.message);
        res.status(500).json({ error: 'Error al registrar la salida' });
    }
};

// --- OBTENER SALIDAS CON FILTROS ---
exports.getSalidas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, sucursalDestinoId } = req.query;
        const where = {};
        if (sucursalDestinoId) {
            where.sucursalDestinoId = sucursalDestinoId;
        }
        if (fechaInicio && fechaFin) {
            where.createdAt = {
                [Op.between]: [new Date(fechaInicio), new Date(fechaFin + 'T23:59:59.999Z')]
            };
        }
        const salidas = await Salida.findAll({
            where,
            include: [
                { model: Sucursal, as: 'SucursalOrigen', attributes: ['id', 'nombre'] },
                { model: Sucursal, as: 'SucursalDestino', attributes: ['id', 'nombre'] },
                { model: Usuario, as: 'UsuarioRegistra', attributes: ['id', 'nombre'] },
                { model: Usuario, as: 'UsuarioRecibe', attributes: ['id', 'nombre'] },
                {
                    model: SalidaDetalle,
                    include: [
                        { model: Lote, attributes: ['numeroLote'] }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });


        const result = salidas.map(salida => {
            const data = salida.toJSON();
            data.unidadesTotales = data.SalidaDetalles.reduce((sum, det) => sum + det.cantidad, 0);
            return data;
        });
        res.json(result);
    } catch (error) {
        console.error('ERROR getSalidas:', error.message);
        res.status(500).json({ error: 'Error al obtener las salidas' });
    }
};

// --- OBTENER SALIDA POR ID ---
exports.getSalidaById = async (req, res) => {
    try {
        const { id } = req.query;
        const salida = await Salida.findByPk(id, {
            include: [
                { model: Sucursal, as: 'SucursalOrigen', attributes: ['id', 'nombre', 'ubicacion'] },
                { model: Sucursal, as: 'SucursalDestino', attributes: ['id', 'nombre', 'ubicacion'] },
                { model: Usuario, as: 'UsuarioRegistra', attributes: ['id', 'nombre', 'correo'] },
                { model: Usuario, as: 'UsuarioRecibe', attributes: ['id', 'nombre', 'correo'] },
                {
                    model: SalidaDetalle,
                    include: [
                        { model: Lote, attributes: ['id', 'numeroLote', 'fechaVencimiento', 'costoUnitario'] }
                    ]
                }
            ]
        });
        if (!salida) return res.status(404).json({ error: 'Salida no encontrada' });
        res.json(salida);
    } catch (error) {
        console.error('ERROR getSalidaById:', error.message);
        res.status(500).json({ error: 'Error al obtener la salida' });
    }
};

// --- ACTUALIZAR ESTADO DE SALIDA ---
exports.updateEstadoSalida = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.query;
        const { estado } = req.body;
        const usuarioToken = req.usuario;

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
            const detalles = await SalidaDetalle.findAll({
                where: { salidaId: salida.id },
                transaction: t
            });

            for (const detalle of detalles) {
                const loteOrigen = await Lote.findByPk(detalle.loteId, { transaction: t });

                const loteExistente = await Lote.findOne({
                    where: {
                        numeroLote: loteOrigen.numeroLote,
                        sucursalId: salida.sucursalDestinoId,
                    },
                    transaction: t
                });

                if (loteExistente) {
                    const nuevaCantidad = loteExistente.cantidadActual + detalle.cantidad;
                    await loteExistente.update({
                        cantidadActual: nuevaCantidad,
                        estado: nuevaCantidad > 0 ? 'Activo' : 'Inactivo'
                    }, { transaction: t });
                } else {
                    await Lote.create({
                        numeroLote: loteOrigen.numeroLote,
                        productoId: loteOrigen.productoId,
                        fechaVencimiento: loteOrigen.fechaVencimiento,
                        cantidadActual: detalle.cantidad,
                        costoUnitario: loteOrigen.costoUnitario,
                        sucursalId: salida.sucursalDestinoId,
                        estado: 'Activo'
                    }, { transaction: t });
                }

                const loteOrigenActualizado = await Lote.findByPk(detalle.loteId, { transaction: t });
                if (loteOrigenActualizado.cantidadActual <= 0) {
                    await loteOrigenActualizado.update({ estado: 'Inactivo' }, { transaction: t });
                }
            }

            await salida.update({
                estado,
                usuarioRecibioId: usuarioToken.id,
                fechaRecibido: new Date(),
            }, { transaction: t });

        } else {
            await salida.update({ estado }, { transaction: t });
        }

        await t.commit();

        const io = getIO();
        io.emit('salida_actualizada', {
            id: salida.id,
            estado,
            sucursalDestinoId: salida.sucursalDestinoId,
            sucursalOrigenId: salida.sucursalOrigenId,
        });

        res.json({ message: 'Estado actualizado correctamente' });

    } catch (error) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error('ERROR updateEstadoSalida:', error.message);
        res.status(500).json({ error: 'Error al actualizar el estado', details: error.message });
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
                const nuevaCantidad = loteOrigen.cantidadActual + detalle.cantidad;
                await loteOrigen.update({
                    cantidadActual: nuevaCantidad,
                    estado: nuevaCantidad > 0 ? 'Activo' : 'Inactivo'
                }, { transaction: t });
            }
        }

        await salida.update({ estado: 'Anulada' }, { transaction: t });
        await t.commit();

        const io = getIO();
        io.emit('salida_actualizada', {
            id: salida.id,
            estado: 'Anulada',
            sucursalDestinoId: salida.sucursalDestinoId,
            sucursalOrigenId: salida.sucursalOrigenId,
        });
        io.to(`sucursal_${salida.sucursalDestinoId}`).emit('salida_anulada', {
            id: salida.id,
            sucursalDestinoId: salida.sucursalDestinoId,
            mensaje: `La salida #${salida.id} fue anulada`
        });

        res.json({ message: 'Salida anulada y stock devuelto a origen correctamente' });
    } catch (error) {
        await t.rollback();
        console.error('ERROR deleteSalida:', error.message);
        res.status(500).json({ error: 'Error al anular la salida' });
    }
};
