const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Producto = require('./producto')


const ImagenProducto = sequelize.define('ImagenProducto', {
    imagen: {
        type: DataTypes.STRING(250)
    },
    productoId: {
        type: DataTypes.INTEGER
    },
}, {
    tableName: 'imagenes_productos',
    timestamps: true
});


Producto.hasMany(ImagenProducto, { foreignKey: 'productoId' });
ImagenProducto.belongsTo(Producto, { foreignKey: 'productoId' });

module.exports = ImagenProducto;