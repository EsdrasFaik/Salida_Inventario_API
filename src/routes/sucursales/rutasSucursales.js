const { Router } = require('express');
const router = Router();
const { body, query } = require('express-validator');
const sucursalesController = require('../../controllers/sucursales/controladorSucursales');
const Sucursal = require('../../models/sucursales/sucursal');
const validar = require('../../middlewares/validar');

// --- VALIDACIONES ---
const sucursalValidationRules = [
    body('estado')
        .optional()
        .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo'),
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre de la sucursal es obligatorio')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .custom(async (value, { req }) => {
            const sucursal = await Sucursal.findOne({ where: { nombre: value } });
            if (sucursal && sucursal.id !== parseInt(req.query?.id)) {
                throw new Error('Ya existe una sucursal con ese nombre');
            }
            return true;
        }),
    body('ubicacion')
        .notEmpty().withMessage('La ubicación es obligatoria')
        .isLength({ min: 3, max: 255 }).withMessage('La ubicación debe tener entre 3 y 255 caracteres')
];

const sucursalIdValidation = [
    query('id')
        .isInt().withMessage('El ID debe ser un número entero')
        .custom(async value => {
            const sucursal = await Sucursal.findByPk(value);
            if (!sucursal) throw new Error('Sucursal no encontrada');
            return true;
        })
];

/**
 * @swagger
 * tags:
 *   name: Sucursales
 *   description: Gestión de sucursales
 */

/**
 * @swagger
 * /sucursales/listar:
 *   get:
 *     summary: Obtiene todas las sucursales
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sucursales
 */
router.get('/listar', sucursalesController.getSucursales);

/**
 * @swagger
 * /sucursales/buscar:
 *   get:
 *     summary: Obtiene una sucursal por ID
 *     tags: [Sucursales]
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
 *         description: Datos de la sucursal
 *       404:
 *         description: Sucursal no encontrada
 */
router.get('/buscar', sucursalIdValidation, validar, sucursalesController.getSucursalById);

/**
 * @swagger
 * /sucursales/guardar:
 *   post:
 *     summary: Registra una nueva sucursal
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - ubicacion
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Sucursal Central"
 *               ubicacion:
 *                 type: string
 *                 example: "Av. Principal #100"
 *     responses:
 *       201:
 *         description: Sucursal creada correctamente
 *       400:
 *         description: Error de validación
 */
router.post(
    '/guardar',
    sucursalValidationRules,
    validar,
    sucursalesController.createSucursal
);

/**
 * @swagger
 * /sucursales/editar:
 *   put:
 *     summary: Actualiza una sucursal existente
 *     tags: [Sucursales]
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
 *               nombre:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sucursal actualizada correctamente
 *       404:
 *         description: Sucursal no encontrada
 */
router.put(
    '/editar',
    [...sucursalIdValidation, ...sucursalValidationRules],
    validar,
    sucursalesController.updateSucursal
);

/**
 * @swagger
 * /sucursales/eliminar:
 *   delete:
 *     summary: Elimina una sucursal
 *     tags: [Sucursales]
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
 *         description: Sucursal eliminada correctamente
 *       404:
 *         description: Sucursal no encontrada
 */
router.delete(
    '/eliminar',
    sucursalIdValidation,
    validar,
    sucursalesController.deleteSucursal
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Sucursal:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Sucursal Central"
 *         ubicacion:
 *           type: string
 *           example: "Av. Principal #100"
 *       required:
 *         - nombre
 *         - ubicacion
 */

module.exports = router;
