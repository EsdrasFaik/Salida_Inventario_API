const http = require('http');
const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

init(server);

server.listen(PORT, () => {
    console.log(`Servidor HTTP corriendo en puerto ${PORT}`);
    console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
});