const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');


const { conectarDB } = require('./config/database');
const corsOptions = require('./config/cors');

require('dotenv').config();
const { CrearModelos } = require('./models');
const rutas = require('./routes/index');

// Inicializar la aplicación
const app = express();

// 1. Conexión a Base de Datos
conectarDB()
  .then(() => {
    console.log(
      "============== Se conecto con el servidor de DB =============="
    );
    // CrearModelos();

  })
  .catch((error) => console.log(error));

app.use(errorHandler);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev')); // Logger de peticiones en consola
app.use(express.json({ limit: '10mb' })); // Lectura de JSON
app.use(express.urlencoded({ extended: true })); // Lectura de formularios

// Configuración de CORS
app.use(cors(corsOptions));

app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 1000 * 60 * 10, // 10 minutos
  max: 1000,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.'
});
app.use('/api', limiter);

app.use('/api/imagenes', express.static(path.join(__dirname, '../public/img')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api', rutas);


app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;