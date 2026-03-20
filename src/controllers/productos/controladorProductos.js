const Producto = require('../../models/productos/producto');
const ImagenProducto = require('../../models/productos/imagenProducto');
const CategoriaProducto = require('../../models/productos/categoriaProducto');
const { sequelize } = require('../../config/database');
const fs = require('fs');
const path = require('path');

// --- REGISTRAR NUEVO PRODUCTO ---
exports.createProducto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { nombre, descripcion, sku, categoriaId } = req.body;

        const skuExiste = await Producto.findOne({ where: { sku } });
        if (skuExiste) {
            await t.rollback();
            return res.status(400).json({ error: 'El SKU ya está registrado' });
        }

        const nuevo = await Producto.create({
            nombre,
            descripcion: descripcion || null,
            sku,
            categoriaId: categoriaId || null
        }, { transaction: t });

        if (req.files && req.files.length > 0) {
            const imagenesPromesas = req.files.map(file =>
                ImagenProducto.create({
                    imagen: file.filename,
                    productoId: nuevo.id
                }, { transaction: t })
            );
            await Promise.all(imagenesPromesas);
        }

        await t.commit();
        res.status(201).json({ message: 'Producto registrado correctamente', id: nuevo.id });
    } catch (error) {
        await t.rollback();
        if (req.files) {
            req.files.forEach(file => {
                const ruta = path.join(__dirname, `../../public/img/productos/${file.filename}`);
                if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
            });
        }
        res.status(500).json({ error: 'Error al registrar el producto' });
    }
};

// --- OBTENER LISTADO COMPLETO ---
exports.getProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            include: [
                { model: CategoriaProducto, attributes: ['id', 'Categoria', 'Descripcion'] },
                { model: ImagenProducto, attributes: ['id', 'imagen'] }
            ],
            order: [['nombre', 'ASC']]
        });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

// --- OBTENER PRODUCTO POR ID ---
exports.getProductoById = async (req, res) => {
    try {
        const { id } = req.query;
        const producto = await Producto.findByPk(id, {
            include: [
                { model: CategoriaProducto, attributes: ['id', 'Categoria', 'Descripcion'] },
                { model: ImagenProducto, attributes: ['id', 'imagen'] }
            ]
        });
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
};

// --- EDITAR PRODUCTO ---
exports.updateProducto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.query;
        const { nombre, descripcion, sku, categoriaId, imagenesAEliminar } = req.body;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const producto = await Producto.findByPk(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        await producto.update(
            { nombre, descripcion, sku, categoriaId: categoriaId || null },
            { transaction: t }
        );

        if (imagenesAEliminar) {
            const idsAEliminar = JSON.parse(imagenesAEliminar);
            if (Array.isArray(idsAEliminar) && idsAEliminar.length > 0) {
                const imagenesDB = await ImagenProducto.findAll({
                    where: { id: idsAEliminar, productoId: id },
                    transaction: t
                });

                imagenesDB.forEach(img => {
                    const ruta = path.join(__dirname, `../../public/img/productos/${img.imagen}`);
                    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
                });

                await ImagenProducto.destroy({
                    where: { id: idsAEliminar, productoId: id },
                    transaction: t
                });
            }
        }

        if (req.files && req.files.length > 0) {
            const imagenesPromesas = req.files.map(file =>
                ImagenProducto.create({
                    imagen: file.filename,
                    productoId: id
                }, { transaction: t })
            );
            await Promise.all(imagenesPromesas);
        }

        await t.commit();
        res.json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
        await t.rollback();
        if (req.files) {
            req.files.forEach(file => {
                const ruta = path.join(__dirname, `../../public/img/productos/${file.filename}`);
                if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
            });
        }
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
};

// --- ELIMINAR PRODUCTO ---
exports.deleteProducto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.query;

        if (!id) return res.status(400).json({ error: 'ID no proporcionado' });

        const imagenes = await ImagenProducto.findAll({ where: { productoId: id } });

        const eliminado = await Producto.destroy({ where: { id }, transaction: t });

        if (eliminado) {
            imagenes.forEach(img => {
                const ruta = path.join(__dirname, `../../public/img/productos/${img.imagen}`);
                if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
            });
            await t.commit();
            res.json({ message: 'Producto eliminado correctamente' });
        } else {
            await t.rollback();
            res.status(404).json({ error: 'El producto no existe' });
        }
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};
