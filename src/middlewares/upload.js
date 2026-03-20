const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureFolderExists = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

/**
 * @param {string} subcarpeta - Nombre de la carpeta
 * @param {boolean} esMultiple - TRUE si acepta varios archivos (galería), FALSE si es uno solo
 */
const crearUploader = (subcarpeta, esMultiple = false) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const ruta = path.join(__dirname, `../../public/img/${subcarpeta}`);
            ensureFolderExists(ruta);
            cb(null, ruta);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const nombreSeguro = subcarpeta.replace(/\//g, '-');
            cb(null, `${nombreSeguro}-${uniqueSuffix}${ext}`);
        }
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const filetypes = /jpeg|jpg|png|gif/;
            const mimetype = filetypes.test(file.mimetype);
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

            if (mimetype && extname) return cb(null, true);
            cb(new Error('Error: Tipo de archivo no soportado.'));
        }
    });


    if (esMultiple) {
        return upload.array('imagenes', 5);
    } else {
        return upload.single('imagen');
    }
};

module.exports = {
    uploadProducto: crearUploader('productos', true),
    uploadCategoria: crearUploader('productos/categorias', false),
};