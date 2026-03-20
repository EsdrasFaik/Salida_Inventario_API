const argon2 = require('argon2');
const Usuario = require('../../models/usuarios/usuario');
const Sucursal = require('../../models/inventario/sucursal');
const { Op } = require('sequelize');
const { enviarCorreo } = require('../../libs/email');
const crypto = require('crypto');
const { firmarToken } = require('../../middlewares/auth');

const generarPin = () => {
    return crypto.randomBytes(3).toString('hex').slice(0, 6);
};

// --- CREAR USUARIO ---
exports.createUsuario = async (req, res) => {
    try {
        const { nombre, correo, contrasena, tipoUsuario, sucursalId } = req.body;

        const existe = await Usuario.findOne({ where: { correo } });
        if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

        const hash = await argon2.hash(contrasena);

        const nuevoUsuario = await Usuario.create({
            nombre,
            correo,
            contrasena: hash,
            tipoUsuario,
            sucursalId: sucursalId || null,
            estado: 'Activo'
        });

        res.status(201).json({ message: 'Usuario creado', id: nuevoUsuario.id });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

// --- OBTENER TODOS LOS USUARIOS ---
exports.getUsuarios = async (req, res) => {
    try {
        const { estado } = req.query;
        const whereClause = estado ? { estado } : {};

        const usuarios = await Usuario.findAll({
            attributes: ['id', 'nombre', 'correo', 'tipoUsuario', 'estado', 'createdAt'],
            where: whereClause,
            include: [
                { model: Sucursal, attributes: ['id', 'nombre', 'ubicacion'] }
            ]
        });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

// --- OBTENER USUARIO POR ID ---
exports.getUsuarioById = async (req, res) => {
    try {
        const { id } = req.query;
        const usuario = await Usuario.findByPk(id, {
            attributes: ['id', 'nombre', 'correo', 'tipoUsuario', 'estado', 'createdAt'],
            include: [
                { model: Sucursal, attributes: ['id', 'nombre', 'ubicacion'] }
            ]
        });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
};

// --- EDITAR USUARIO ---
exports.updateUsuario = async (req, res) => {
    try {
        const { id } = req.query;
        const { nombre, tipoUsuario, sucursalId, estado } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        await usuario.update({ nombre, tipoUsuario, sucursalId: sucursalId || null, estado });

        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

// --- RECUPERAR CONTRASEÑA (GENERAR PIN) ---
exports.recuperarContrasena = async (req, res) => {
    try {
        const { correo } = req.body;
        const usuario = await Usuario.findOne({ where: { correo: correo.trim() } });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const nuevoPin = generarPin();
        const pinExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await usuario.update({ pin: nuevoPin, pinExpiresAt });

        try {
            await enviarCorreo({
                para: correo,
                asunto: 'Recuperación de Contraseña',
                html: `<h1>Tu PIN es: ${nuevoPin}</h1>`
            });
        } catch (errorCorreo) {
            console.error('Error al enviar correo:', errorCorreo);
            return res.status(500).json({ error: 'No se pudo enviar el correo' });
        }

        res.json({ message: 'Si el correo existe, recibirás un PIN en tu bandeja de entrada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en recuperación' });
    }
};

// --- ACTUALIZAR CONTRASEÑA (USANDO PIN) ---
exports.updateContrasena = async (req, res) => {
    try {
        const { correo, contrasena, pin } = req.body;
        const usuario = await Usuario.findOne({ where: { correo: correo.trim() } });

        if (!usuario || usuario.pin !== pin || new Date() > usuario.pinExpiresAt) {
            return res.status(400).json({ error: 'PIN incorrecto o expirado' });
        }

        const hash = await argon2.hash(contrasena);
        await usuario.update({ contrasena: hash, pin: null });

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
};

// --- INICIO DE SESIÓN ---
exports.inicioSesion = async (req, res) => {
    try {
        const { login, contrasena } = req.body;

        const usuario = await Usuario.findOne({
            where: {
                [Op.or]: [
                    { correo: login },
                    { nombre: login }
                ],
                estado: 'Activo'
            }
        });

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas o cuenta bloqueada' });
        }

        const esValida = await argon2.verify(usuario.contrasena, contrasena);

        if (esValida) {
            await usuario.update({ intentos: 0 });

            const token = firmarToken(usuario);

            return res.json({
                Token: token,
                Usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    tipoUsuario: usuario.tipoUsuario,
                    sucursalId: usuario.sucursalId,
                    estado: usuario.estado
                }
            });
        } else {
            await usuario.increment('intentos');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};