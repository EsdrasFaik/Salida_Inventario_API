const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'API Portfolio - Gestión Empresarial',
        version: '1.0.0',
        description: 'API RESTful moderna construida con Node.js, Express y MySQL.',
        contact: {
            name: 'Esdras Oseguera',
            email: 'rankeygd@gmail.com'
        },
    },
    servers: [
    {
        url: `http://localhost:${process.env.PORT || 3001}/api`,
        description: 'Servidor de Desarrollo'
    },
    {
        url: process.env.RAILWAY_PUBLIC_DOMAIN 
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api`
            : 'https://api.tu-dominio.com/api',
        description: 'Servidor de Producción'
    }
],nents: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [{
        BearerAuth: []
    }]
};

const options = {
    swaggerDefinition,
    apis: [path.join(__dirname, '../routes/**/*.js')], 
};

module.exports = swaggerJsdoc(options);