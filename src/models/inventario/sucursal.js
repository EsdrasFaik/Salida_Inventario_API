const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Sucursal = sequelize.define('Sucursal', {
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    ubicacion: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
}, {
    timestamps: true,
    tableName: 'sucursales'
});

module.exports = Sucursal;