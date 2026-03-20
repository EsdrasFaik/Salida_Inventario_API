const { Router } = require('express');
const router = Router();
const { body, query } = require('express-validator');
const usuariosController = require('../../controllers/usuarios/controladorUsuarios');
const rateLimit = require('express-rate-limit');
const { verificarToken } = require('../../middlewares/auth');
const validar = require('../../middlewares/validar');
const Usuario = require('../../models/usuarios/usuario');

const loginLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 10,
  message: 'Demasiados intentos. Intenta en 15 minutos.'
});

// --- VALIDACIONES ---
const usuarioValidationRules = [
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres'),
  body('correo')
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('El correo no tiene un formato válido')
    .normalizeEmail(),
  body('contrasena')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('tipoUsuario')
    .notEmpty().withMessage('El tipo de usuario es obligatorio')
    .isIn(['Jefe de bodega', 'Empleado', 'Administrador'])
    .withMessage('El tipo de usuario debe ser: Jefe de bodega, Empleado o Administrador'),
  body('sucursalId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de sucursal debe ser un número entero válido')
];

const usuarioUpdateRules = [
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres'),
  body('tipoUsuario')
    .notEmpty().withMessage('El tipo de usuario es obligatorio')
    .isIn(['Jefe de bodega', 'Empleado', 'Administrador'])
    .withMessage('El tipo de usuario debe ser: Jefe de bodega, Empleado o Administrador'),
  body('sucursalId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de sucursal debe ser un número entero válido'),
  body('estado')
    .optional()
    .isIn(['Activo', 'Bloqueado', 'Inactivo', 'Logeado']).withMessage('Estado inválido')
];

const loginValidationRules = [
  body('login').notEmpty().withMessage('El usuario o correo es obligatorio'),
  body('contrasena').notEmpty().withMessage('La contraseña es obligatoria')
];

const recuperarValidationRules = [
  body('correo')
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('El correo no tiene un formato válido')
    .normalizeEmail()
];

const updateContrasenaValidationRules = [
  body('correo')
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('El correo no tiene un formato válido')
    .normalizeEmail(),
  body('pin')
    .notEmpty().withMessage('El PIN es obligatorio')
    .isLength({ min: 6, max: 6 }).withMessage('El PIN debe tener exactamente 6 caracteres'),
  body('contrasena')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const usuarioIdValidation = [
  query('id')
    .isInt().withMessage('El ID debe ser un número entero')
    .custom(async value => {
      const usuario = await Usuario.findByPk(value);
      if (!usuario) throw new Error('Usuario no encontrado');
      return true;
    })
];

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /usuarios/listar:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["Activo", "Inactivo", "Bloqueado", "Logeado"]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autorizado
 */
router.get('/listar', verificarToken, usuariosController.getUsuarios);

/**
 * @swagger
 * /usuarios/buscar:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Usuarios]
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
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/buscar', verificarToken, usuarioIdValidation, validar, usuariosController.getUsuarioById);

/**
 * @swagger
 * /usuarios/guardar:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
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
 *               - correo
 *               - contrasena
 *               - tipoUsuario
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "juan@correo.com"
 *               contrasena:
 *                 type: string
 *                 format: password
 *                 example: "miClave123"
 *               tipoUsuario:
 *                 type: string
 *                 enum: ["Jefe de bodega", "Empleado", "Administrador"]
 *                 example: "Empleado"
 *               sucursalId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: El correo ya está registrado o error de validación
 */
router.post(
  '/guardar',
  usuarioValidationRules,
  validar,
  usuariosController.createUsuario
);

/**
 * @swagger
 * /usuarios/editar:
 *   put:
 *     summary: Actualiza datos de un usuario
 *     tags: [Usuarios]
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
 *               tipoUsuario:
 *                 type: string
 *                 enum: ["Jefe de bodega", "Empleado", "Administrador"]
 *               sucursalId:
 *                 type: integer
 *               estado:
 *                 type: string
 *                 enum: ["Activo", "Bloqueado", "Inactivo", "Logeado"]
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/editar',
  verificarToken,
  [...usuarioIdValidation, ...usuarioUpdateRules],
  validar,
  usuariosController.updateUsuario
);

/**
 * @swagger
 * /usuarios/iniciarsesion:
 *   post:
 *     summary: Inicio de sesión
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - contrasena
 *             properties:
 *               login:
 *                 type: string
 *                 example: "juan@correo.com"
 *               contrasena:
 *                 type: string
 *                 format: password
 *                 example: "miClave123"
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token y datos del usuario
 *       401:
 *         description: Credenciales inválidas o cuenta bloqueada
 */
router.post(
  '/iniciarsesion',
  loginLimiter,
  loginValidationRules,
  validar,
  usuariosController.inicioSesion
);

/**
 * @swagger
 * /usuarios/pin:
 *   post:
 *     summary: Solicita un PIN para recuperar la contraseña
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "juan@correo.com"
 *     responses:
 *       200:
 *         description: PIN enviado al correo
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
  '/pin',
  loginLimiter,
  recuperarValidationRules,
  validar,
  usuariosController.recuperarContrasena
);

/**
 * @swagger
 * /usuarios/actualizar/contrasena:
 *   put:
 *     summary: Actualiza la contraseña usando el PIN recibido por correo
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - pin
 *               - contrasena
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               pin:
 *                 type: string
 *                 example: "a3f9c1"
 *               contrasena:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: PIN incorrecto o usuario no existe
 */
router.put(
  '/actualizar/contrasena',
  updateContrasenaValidationRules,
  validar,
  usuariosController.updateContrasena
);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         tipoUsuario:
 *           type: string
 *           enum: ["Jefe de bodega", "Empleado", "Administrador"]
 *         estado:
 *           type: string
 *           enum: ["Activo", "Bloqueado", "Inactivo", "Logeado"]
 *         Sucursal:
 *           $ref: '#/components/schemas/Sucursal'
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *         - tipoUsuario
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         Token:
 *           type: string
 *         Usuario:
 *           type: object
 */

module.exports = router;