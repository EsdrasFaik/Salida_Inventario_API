const CategoriaProducto = require('../../models/productos/categoriaProducto');
const { sequelize } = require('../../config/database');
const fs = require('fs');
const path = require('path');

// --- CREAR CATEGORÍA ---
exports.createCategoria = async (req, res) => {
    try {
        const { Categoria, Descripcion, orden, estado } = req.body;

        const nueva = await CategoriaProducto.create({
            Categoria,
            Descripcion: Descripcion || null,
            orden: orden || 1,
            idtipoprincipal: idtipoprincipal || null,
            estado: estado || 'Activo',
            Imagen: req.file ? req.file.filename : null
        });

        res.status(201).json({ message: 'Categoría creada correctamente', id: nueva.id });
    } catch (error) {
        if (req.file) {
            const ruta = path.join(__dirname, `../../public/img/productos/categorias/${req.file.filename}`);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }
        res.status(500).json({ error: 'Error al crear la categoría' });
    }
};

// --- OBTENER LISTADO COMPLETO ---
exports.getCategorias = async (req, res) => {
    try {
        const categorias = await CategoriaProducto.findAll({
            order: [['orden', 'ASC'], ['Categoria', 'ASC']]
        });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
};

// --- OBTENER CATEGORÍA POR ID ---
exports.getCategoriaById = async (req, res) => {
    try {
        const { id } = req.query;
        const categoria = await CategoriaProducto.findByPk(id, {
            include: [
                { model: CategoriaProducto, as: 'CategoriaProductos', attributes: ['id', 'Categoria'], required: false }
            ]
        });
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(categoria);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la categoría' });
    }
};

// --- EDITAR CATEGORÍA ---
exports.updateCategoria = async (req, res) => {
    try {
        const { id } = req.query;
        const { Categoria, Descripcion, orden, estado } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const categoria = await CategoriaProducto.findByPk(id);
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

        if (req.file) {
            if (categoria.Imagen) {
                const rutaAnterior = path.join(__dirname, `../../public/img/productos/categorias/${categoria.Imagen}`);
                if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
            }
            await categoria.update({ Categoria, Descripcion, orden, idtipoprincipal, estado, Imagen: req.file.filename });
        } else {
            await categoria.update({ Categoria, Descripcion, orden, idtipoprincipal, estado });
        }

        res.json({ message: 'Categoría actualizada correctamente' });
    } catch (error) {
        if (req.file) {
            const ruta = path.join(__dirname, `../../public/img/categorias/${req.file.filename}`);
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

        if (categoria.Imagen) {
            const ruta = path.join(__dirname, `../../public/img/categorias/${categoria.Imagen}`);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }

        await categoria.destroy();
        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
};
