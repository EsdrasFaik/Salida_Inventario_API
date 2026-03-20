const { Sequelize } = require('sequelize');
require('dotenv').config();

// Validamos que existan las variables antes de intentar conectar
const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASS) {
    console.error('Faltan variables de entorno para la base de datos.');
    process.exit(1);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '-06:00',
    define: {
        timestamps: false
    },
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Función para probar conexión
const conectarDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Base de datos conectada exitosamente.');

    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
};

module.exports = { sequelize, conectarDB };