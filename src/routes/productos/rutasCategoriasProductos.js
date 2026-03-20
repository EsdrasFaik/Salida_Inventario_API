const { Router } = require('express');
const router = Router();
const { body, query } = require('express-validator');
const categoriasController = require('../../controllers/productos/controladorCategoriasProductos');
const CategoriaProducto = require('../../models/productos/categoriaProducto');
const { uploadCategoria } = require('../../middlewares/upload');
const multer = require('multer');
const { verificarToken } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');

// --- MIDDLEWARE PARA ERRORES DE IMAGEN ---
const manejarErroresImagen = (err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ error: 'Error al cargar la imagen', detalles: err.message });
    }
    next();
};

// --- VALIDACIONES ---
const categoriaValidationRules = [
    body('Categoria')
        .notEmpty().withMessage('El nombre de la categoría es obligatorio')
        .isLength({ min: 2, max: 30 }).withMessage('El nombre debe tener entre 2 y 30 caracteres')
        .custom(async (value, { req }) => {
            const cat = await CategoriaProducto.findOne({ where: { Categoria: value } });
            if (cat && cat.id !== parseInt(req.query?.id)) {
                throw new Error('Ya existe una categoría con ese nombre');
            }
            return true;
        }),
    body('Descripcion').optional().isLength({ max: 50 }).withMessage('La descripción no puede superar 50 caracteres'),
    body('orden').optional().isInt({ min: 1 }).withMessage('El orden debe ser un entero positivo'),
    body('estado').optional().isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo')
];

const categoriaIdValidation = [
    query('id')
        .isInt().withMessage('El ID debe ser un número entero')
        .custom(async value => {
            const cat = await CategoriaProducto.findByPk(value);
            if (!cat) throw new Error('Categoría no encontrada');
            return true;
        })
];

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Gestión de categorías de productos
 */

/**
 * @swagger
 * /categorias/listar:
 *   get:
 *     summary: Obtiene todas las categorías
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/listar', categoriasController.getCategorias);

/**
 * @swagger
 * /categorias/buscar:
 *   get:
 *     summary: Obtiene una categoría por ID
 *     tags: [Categorias]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la categoría
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/buscar', categoriaIdValidation, validar, categoriasController.getCategoriaById);

/**
 * @swagger
 * /categorias/guardar:
 *   post:
 *     summary: Registra una nueva categoría
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - Categoria
 *             properties:
 *               Categoria:
 *                 type: string
 *                 example: "Medicamentos"
 *               Descripcion:
 *                 type: string
 *               orden:
 *                 type: integer
 *               estado:
 *                 type: string
 *                 enum: ["Activo", "Inactivo"]
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Categoría creada correctamente
 */
router.post(
    '/guardar',
    verificarToken,
    uploadCategoria,
    manejarErroresImagen,
    categoriaValidationRules,
    validar,
    categoriasController.createCategoria
);

/**
 * @swagger
 * /categorias/editar:
 *   put:
 *     summary: Actualiza una categoría existente
 *     tags: [Categorias]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               Categoria:
 *                 type: string
 *               Descripcion:
 *                 type: string
 *               orden:
 *                 type: integer
 *               estado:
 *                 type: string
 *                 enum: ["Activo", "Inactivo"]
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Categoría actualizada correctamente
 */
router.put(
    '/editar',
    verificarToken,
    uploadCategoria,
    manejarErroresImagen,
    [...categoriaIdValidation, ...categoriaValidationRules],
    validar,
    categoriasController.updateCategoria
);

/**
 * @swagger
 * /categorias/eliminar:
 *   delete:
 *     summary: Elimina una categoría
 *     tags: [Categorias]
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
 *         description: Categoría eliminada correctamente
 */
router.delete(
    '/eliminar',
    verificarToken,
    categoriaIdValidation,
    validar,
    categoriasController.deleteCategoria
);

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoriaProducto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         Categoria:
 *           type: string
 *         Descripcion:
 *           type: string
 *         orden:
 *           type: integer
 *         estado:
 *           type: string
 *           enum: ["Activo", "Inactivo"]
 *         Imagen:
 *           type: string
 *       required:
 *         - Categoria
 */

module.exports = router;
