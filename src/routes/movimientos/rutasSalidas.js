const { Router } = require('express');
const router = Router();
const { body, query } = require('express-validator');
const salidasController = require('../../controllers/movimientos/controladorSalidas');
const Salida = require('../../models/movimientos/salida');
const { verificarToken } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');

// --- VALIDACIONES ---
const salidaValidationRules = [
    body('sucursalId')
        .notEmpty().withMessage('El ID de sucursal es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID de sucursal debe ser un número entero válido'),
    body('usuarioId')
        .notEmpty().withMessage('El ID de usuario es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID de usuario debe ser un número entero válido'),
    body('detalles')
        .notEmpty().withMessage('Los detalles de la salida son obligatorios')
        .isArray({ min: 1 }).withMessage('Debe incluir al menos un detalle'),
    body('detalles.*.productoId')
        .isInt({ min: 1 }).withMessage('Cada detalle debe tener un productoId válido'),
    body('detalles.*.loteId')
        .isInt({ min: 1 }).withMessage('Cada detalle debe tener un loteId válido'),
    body('detalles.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),
    body('detalles.*.costoHistorico')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El costo histórico debe ser un decimal válido')
];

const estadoValidationRules = [
    body('estado')
        .notEmpty().withMessage('El estado es obligatorio')
        .isIn(['Enviada', 'Recibida', 'Anulada']).withMessage('El estado debe ser: Enviada, Recibida o Anulada')
];

const salidaIdValidation = [
    query('id')
        .isInt().withMessage('El ID debe ser un número entero')
        .custom(async value => {
            const salida = await Salida.findByPk(value);
            if (!salida) throw new Error('Salida no encontrada');
            return true;
        })
];

/**
 * @swagger
 * tags:
 *   name: Salidas
 *   description: Gestión de salidas de inventario a sucursales
 */

/**
 * @swagger
 * /salidas/listar:
 *   get:
 *     summary: Obtiene todas las salidas
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de salidas con sus detalles
 */
router.get('/listar', verificarToken, salidasController.getSalidas);

/**
 * @swagger
 * /salidas/buscar:
 *   get:
 *     summary: Obtiene una salida por ID
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle completo de la salida
 *       404:
 *         description: Salida no encontrada
 */
router.get('/buscar', verificarToken, salidaIdValidation, validar, salidasController.getSalidaById);

/**
 * @swagger
 * /salidas/guardar:
 *   post:
 *     summary: Registra una nueva salida con sus detalles
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sucursalId
 *               - usuarioId
 *               - detalles
 *             properties:
 *               sucursalId:
 *                 type: integer
 *                 example: 1
 *               usuarioId:
 *                 type: integer
 *                 example: 1
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productoId:
 *                       type: integer
 *                     loteId:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *                     costoHistorico:
 *                       type: number
 *     responses:
 *       201:
 *         description: Salida registrada correctamente
 */
router.post(
    '/guardar',
    verificarToken,
    salidaValidationRules,
    validar,
    salidasController.createSalida
);

/**
 * @swagger
 * /salidas/estado:
 *   put:
 *     summary: Actualiza el estado de una salida
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: ["Enviada", "Recibida", "Anulada"]
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 */
router.put(
    '/estado',
    verificarToken,
    [...salidaIdValidation, ...estadoValidationRules],
    validar,
    salidasController.updateEstadoSalida
);

/**
 * @swagger
 * /salidas/eliminar:
 *   delete:
 *     summary: Elimina una salida y sus detalles
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salida eliminada correctamente
 */
router.delete(
    '/eliminar',
    verificarToken,
    salidaIdValidation,
    validar,
    salidasController.deleteSalida
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Salida:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         fechaSalida:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: ["Enviada", "Recibida", "Anulada"]
 *         totalCosto:
 *           type: number
 *         sucursalId:
 *           type: integer
 *         usuarioId:
 *           type: integer
 *       required:
 *         - sucursalId
 *         - usuarioId
 *         - detalles
 */

module.exports = router;
