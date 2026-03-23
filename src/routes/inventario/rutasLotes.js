const { Router } = require('express');
const router = Router();
const { body, query } = require('express-validator');
const lotesController = require('../../controllers/inventario/controladorLotes');
const Lote = require('../../models/inventarios/lote');
const Sucursal = require('../../models/sucursales/sucursal');
const { Op } = require('sequelize');
const validar = require('../../middlewares/validar');

// --- VALIDACIONES ---
const loteValidationRules = [
    body('numeroLote')
        .notEmpty().withMessage('El número de lote es obligatorio')
        .isLength({ min: 1, max: 100 }).withMessage('El número de lote debe tener entre 1 y 100 caracteres')
        .custom(async (value, { req }) => {
            const sucursalId = req.body.sucursalId;
            const loteId = req.query.id; // solo en edición

            // Buscar la sucursal para construir el sufijo
            const sucursal = await Sucursal.findByPk(sucursalId);
            if (!sucursal) throw new Error('Sucursal no encontrada');

            const numeroLoteConSufijo = `${value} - ${sucursal.nombre}`;

            // Buscar si ya existe ese número en la misma sucursal
            const where = {
                numeroLote: numeroLoteConSufijo,
                sucursalId,
            };

            // En edición excluir el lote actual
            if (loteId) {
                where.id = { [Op.ne]: loteId };
            }

            const existe = await Lote.findOne({ where });
            if (existe) {
                throw new Error(`Ya existe un lote con el número "${numeroLoteConSufijo}" en esta sucursal.`);
            }

            return true;
        }),
    body('fechaVencimiento')
        .notEmpty().withMessage('La fecha de vencimiento es obligatoria')
        .isDate().withMessage('La fecha de vencimiento debe tener formato YYYY-MM-DD')
        .custom((value) => {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (new Date(value) < hoy) {
                throw new Error('La fecha de vencimiento no puede ser anterior a hoy');
            }
            return true;
        }),
    body('cantidadActual')
        .optional()
        .isInt({ min: 0 }).withMessage('La cantidad debe ser un número entero no negativo'),
    body('costoUnitario')
        .notEmpty().withMessage('El costo unitario es obligatorio')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El costo unitario debe ser un número decimal válido')
        .custom(value => {
            if (parseFloat(value) <= 0) throw new Error('El costo unitario debe ser mayor a 0');
            return true;
        }),
    body('productoId')
        .notEmpty().withMessage('El ID del producto es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del producto debe ser un número entero válido'),
    body('sucursalId')
        .optional()
        .isInt({ min: 1 }).withMessage('El ID de la sucursal debe ser un número entero válido'),
    body('estado')
        .optional()
        .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo')
];

const loteIdValidation = [
    query('id')
        .isInt().withMessage('El ID debe ser un número entero')
        .custom(async value => {
            const lote = await Lote.findByPk(value);
            if (!lote) throw new Error('Lote no encontrado');
            return true;
        })
];

/**
 * @swagger
 * tags:
 *   name: Lotes
 *   description: Gestión de lotes de inventario
 */

/**
 * @swagger
 * /lotes/listar:
 *   get:
 *     summary: Obtiene todos los lotes
 *     tags: [Lotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productoId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar por producto
 *     responses:
 *       200:
 *         description: Lista de lotes
 */
router.get('/listar', lotesController.getLotes);

/**
 * @swagger
 * /lotes/buscar:
 *   get:
 *     summary: Obtiene un lote por ID
 *     tags: [Lotes]
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
 *         description: Datos del lote
 *       404:
 *         description: Lote no encontrado
 */
router.get('/buscar', loteIdValidation, validar, lotesController.getLoteById);

/**
 * @swagger
 * /lotes/guardar:
 *   post:
 *     summary: Registra un nuevo lote
 *     tags: [Lotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numeroLote
 *               - fechaVencimiento
 *               - costoUnitario
 *               - productoId
 *             properties:
 *               numeroLote:
 *                 type: string
 *                 example: "L-2025-001"
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               cantidadActual:
 *                 type: integer
 *                 example: 100
 *               costoUnitario:
 *                 type: number
 *                 example: 25.50
 *               productoId:
 *                 type: integer
 *                 example: 1
 *               sucursalId:
 *                 type: integer
 *                 example: 1
 *               estado:
 *                 type: string
 *                 example: "Activo"
 *     responses:
 *       201:
 *         description: Lote creado correctamente
 */
router.post(
    '/guardar',
    loteValidationRules,
    validar,
    lotesController.createLote
);

/**
 * @swagger
 * /lotes/editar:
 *   put:
 *     summary: Actualiza un lote existente
 *     tags: [Lotes]
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
 *             properties:
 *               numeroLote:
 *                 type: string
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               cantidadActual:
 *                 type: integer
 *               costoUnitario:
 *                 type: number
 *               productoId:
 *                 type: integer
 *               sucursalId:
 *                 type: integer
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lote actualizado correctamente
 */
router.put(
    '/editar',
    [...loteIdValidation, ...loteValidationRules],
    validar,
    lotesController.updateLote
);

/**
 * @swagger
 * /lotes/eliminar:
 *   delete:
 *     summary: Elimina un lote
 *     tags: [Lotes]
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
 *         description: Lote eliminado correctamente
 */
router.delete(
    '/eliminar',
    loteIdValidation,
    validar,
    lotesController.deleteLote
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Lote:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         numeroLote:
 *           type: string
 *         fechaVencimiento:
 *           type: string
 *           format: date
 *         cantidadActual:
 *           type: integer
 *         costoUnitario:
 *           type: number
 *         productoId:
 *           type: integer
 *         sucursalId:
 *           type: integer
 *         estado:
 *           type: string
 *       required:
 *         - numeroLote
 *         - fechaVencimiento
 *         - costoUnitario
 *         - productoId
 *         - sucursalId
 *         - estado
 */

module.exports = router;
