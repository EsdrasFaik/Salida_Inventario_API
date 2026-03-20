const jwt = require('jsonwebtoken');

// 1. Función para generar token (Login)
const firmarToken = (usuario) => {
    return jwt.sign(
        { 
            id: usuario.id, 
            rol: usuario.rol,
            email: usuario.email 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );
};

// 2. Middleware para proteger rutas (Verificar Token)
const verificarToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        return res.status(403).json({ ok: false, msg: 'No se proporcionó token de seguridad.' });
    }

    try {

        const token = tokenHeader.split(' ')[1]; 
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Inyectamos el usuario en la request para usarlo en el controlador
        req.usuario = decoded; 
        
        next();
    } catch (error) {
        return res.status(401).json({ ok: false, msg: 'Token inválido o expirado.' });
    }
};

module.exports = { firmarToken, verificarToken };