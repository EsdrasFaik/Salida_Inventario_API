const { Router } = require('express');
const router = Router();
const { body, query } = require('express-validator');
const productosController = require('../../controllers/productos/controladorProductos');
const Producto = require('../../models/productos/producto');
const { uploadProducto } = require('../../middlewares/upload');
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
const productoValidationRules = [
    body('nombre')
        .notEmpty().withMessage('El nombre del producto es obligatorio')
        .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
    body('sku')
        .notEmpty().withMessage('El SKU es obligatorio')
        .isLength({ min: 1, max: 50 }).withMessage('El SKU debe tener entre 1 y 50 caracteres')
        .custom(async (value, { req }) => {
            const prod = await Producto.findOne({ where: { sku: value } });
            if (prod && prod.id !== parseInt(req.query?.id)) {
                throw new Error('Este SKU ya está registrado');
            }
            return true;
        }),
    body('descripcion').optional().isLength({ max: 2000 }).withMessage('La descripción es demasiado larga'),
    body('categoriaId').optional().isInt({ min: 1 }).withMessage('El ID de categoría debe ser un entero válido')
];

const productoIdValidation = [
    query('id')
        .isInt().withMessage('El ID debe ser un número entero')
        .custom(async value => {
            const prod = await Producto.findByPk(value);
            if (!prod) throw new Error('Producto no encontrado');
            return true;
        })
];

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión completa de productos
 */

/**
 * @swagger
 * /productos/listar:
 *   get:
 *     summary: Obtiene todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get('/listar', productosController.getProductos);

/**
 * @swagger
 * /productos/buscar:
 *   get:
 *     summary: Obtiene un producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 */
router.get('/buscar', productoIdValidation, validar, productosController.getProductoById);

/**
 * @swagger
 * /productos/guardar:
 *   post:
 *     summary: Registra un nuevo producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - sku
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Amoxicilina 500mg"
 *               sku:
 *                 type: string
 *                 example: "AMX-500"
 *               descripcion:
 *                 type: string
 *               categoriaId:
 *                 type: integer
 *               imagenes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Producto registrado correctamente
 */
router.post(
    '/guardar',
    verificarToken,
    uploadProducto,
    manejarErroresImagen,
    productoValidationRules,
    validar,
    productosController.createProducto
);

/**
 * @swagger
 * /productos/editar:
 *   put:
 *     summary: Actualiza un producto existente
 *     tags: [Productos]
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
 *               nombre:
 *                 type: string
 *               sku:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoriaId:
 *                 type: integer
 *               imagenesAEliminar:
 *                 type: string
 *                 description: JSON array de IDs a eliminar, ej "[1,2]"
 *               imagenes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 */
router.put(
    '/editar',
    verificarToken,
    uploadProducto,
    manejarErroresImagen,
    [...productoIdValidation, ...productoValidationRules],
    validar,
    productosController.updateProducto
);

/**
 * @swagger
 * /productos/eliminar:
 *   delete:
 *     summary: Elimina un producto y sus imágenes
 *     tags: [Productos]
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
 *         description: Producto eliminado correctamente
 */
router.delete(
    '/eliminar',
    verificarToken,
    productoIdValidation,
    validar,
    productosController.deleteProducto
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         sku:
 *           type: string
 *         descripcion:
 *           type: string
 *         CategoriaProducto:
 *           $ref: '#/components/schemas/CategoriaProducto'
 *         ImagenProductos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               imagen:
 *                 type: string
 *       required:
 *         - nombre
 *         - sku
 */

module.exports = router;
