const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const CategoriaProducto = require('./categoriaProducto');

const Producto = sequelize.define('Producto', {
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    }
}, {
    timestamps: true,
    tableName: 'productos'
});

Producto.belongsTo(CategoriaProducto, { foreignKey: 'categoriaId' });
CategoriaProducto.hasMany(Producto, { foreignKey: 'categoriaId' });

module.exports = Producto;