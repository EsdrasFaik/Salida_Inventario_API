const CategoriaProducto = require('../../models/productos/categoriaProducto');
const { sequelize } = require('../../config/database');
const fs = require('fs');
const path = require('path');
const Producto = require('../../models/productos/producto');

// --- CREAR CATEGORÍA ---
exports.createCategoria = async (req, res) => {
    try {
        const { Categoria, Descripcion, estado } = req.body;

        const nueva = await CategoriaProducto.create({
            Categoria,
            Descripcion: Descripcion || null,
            estado: estado || 'Activo',
            imagen: req.file ? req.file.filename : null
        });

        res.status(201).json({ message: 'Categoría creada correctamente', id: nueva.id });
    } catch (error) {
        if (req.file) {
            const ruta = path.join(__dirname, `../../../public/img/productos/categorias/${req.file.filename}`);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }
        res.status(500).json({ error: 'Error al crear la categoría' });
    }
};

// --- OBTENER LISTADO COMPLETO ---
exports.getCategorias = async (req, res) => {
    try {
        const categorias = await CategoriaProducto.findAll({
            order: [['Categoria', 'ASC']],
            attributes: {
                include: [
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM productos WHERE productos.categoriaId = \`CategoriaProducto\`.\`id\`)`),
                        'totalProductos'
                    ]
                ]
            },
        });

        const resultado = categorias.map(c => ({
            ...c.toJSON(),
            tieneRegistrosVinculados: parseInt(c.dataValues.totalProductos) > 0,
        }));

        res.json(resultado);
    } catch (error) {
        console.error('ERROR getCategorias:', error.message);
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
};

// --- OBTENER CATEGORÍA POR ID ---
exports.getCategoriaById = async (req, res) => {
    try {
        const { id } = req.query;

        const categoria = await CategoriaProducto.findByPk(id);

        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

        const productosCount = await Producto.count({ where: { categoriaId: id } });

        res.json({
            ...categoria.toJSON(),
            tieneRegistrosVinculados: productosCount > 0
        });
    } catch (error) {
        console.error('ERROR getCategoriaById:', error.message);
        res.status(500).json({ error: 'Error al obtener la categoría' });
    }
};

// --- EDITAR CATEGORÍA ---
exports.updateCategoria = async (req, res) => {
    try {
        const { id } = req.query;
        const { Categoria, Descripcion, estado } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const categoria = await CategoriaProducto.findByPk(id);
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

        if (req.file) {
            if (categoria.imagen) {
                const rutaAnterior = path.join(__dirname, `../../../public/img/productos/categorias/${categoria.imagen}`);
                if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
            }
            await categoria.update({ Categoria, Descripcion, estado, imagen: req.file.filename });
        } else {
            await categoria.update({ Categoria, Descripcion, estado });
        }

        res.json({ message: 'Categoría actualizada correctamente' });
    } catch (error) {
        if (req.file) {
            const ruta = path.join(__dirname, `../../../public/img/productos/categorias/${req.file.filename}`);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }
        res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
};

// --- ELIMINAR CATEGORÍA ---
exports.deleteCategoria = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const categoria = await CategoriaProducto.findByPk(id);
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

        if (categoria.imagen) {
            const ruta = path.join(__dirname, `../../../public/img/productos/categorias/${categoria.imagen}`);
            if (fs.existsSync(ruta)) {
                fs.unlinkSync(ruta);
            }
        }

        await categoria.destroy();
        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('ERROR deleteCategoria:', error.message);
        res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
};
