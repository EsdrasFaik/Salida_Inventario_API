const { Router } = require('express');
const router = Router();
const { body, query } = require('express-validator');
const lotesController = require('../../controllers/inventario/controladorLotes');
const Lote = require('../../models/inventario/lote');
const { verificarToken } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');

// --- VALIDACIONES ---
const loteValidationRules = [
    body('numeroLote')
        .notEmpty().withMessage('El número de lote es obligatorio')
        .isLength({ min: 1, max: 100 }).withMessage('El número de lote debe tener entre 1 y 100 caracteres'),
    body('fechaVencimiento')
        .notEmpty().withMessage('La fecha de vencimiento es obligatoria')
        .isDate().withMessage('La fecha de vencimiento debe tener formato YYYY-MM-DD'),
    body('cantidadActual')
        .optional()
        .isInt({ min: 0 }).withMessage('La cantidad debe ser un número entero no negativo'),
    body('costoUnitario')
        .notEmpty().withMessage('El costo unitario es obligatorio')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El costo unitario debe ser un número decimal válido'),
    body('productoId')
        .notEmpty().withMessage('El ID del producto es obligatorio')
        .isInt({ min: 1 }).withMessage('El ID del producto debe ser un número entero válido')
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
router.get('/listar', verificarToken, lotesController.getLotes);

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
router.get('/buscar', verificarToken, loteIdValidation, validar, lotesController.getLoteById);

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
 *     responses:
 *       201:
 *         description: Lote creado correctamente
 */
router.post(
    '/guardar',
    verificarToken,
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
 *     responses:
 *       200:
 *         description: Lote actualizado correctamente
 */
router.put(
    '/editar',
    verificarToken,
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
    verificarToken,
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
 *       required:
 *         - numeroLote
 *         - fechaVencimiento
 *         - costoUnitario
 *         - productoId
 */

module.exports = router;
