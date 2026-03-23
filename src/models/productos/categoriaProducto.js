const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const CategoriaProducto = sequelize.define('CategoriaProducto', {
    Categoria: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    Descripcion: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('Activo', 'Inactivo'),
        defaultValue: 'Activo'
    },
    imagen: {
        type: DataTypes.STRING(250),
        allowNull: true,
    }

}, {
    tableName: 'categoria_productos',
    timestamps: false
});


module.exports = CategoriaProducto;