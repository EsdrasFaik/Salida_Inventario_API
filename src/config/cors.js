const origenesPermitidos = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [];


const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Postman / apps móviles
        if (process.env.NODE_ENV === 'development') return callback(null, true);
        if (origenesPermitidos.includes(origin)) return callback(null, true);
        callback(new Error('Origen no permitido por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
};

module.exports = corsOptions;