const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Producto = require('../productos/producto');
const Sucursal = require('../sucursales/sucursal');

const Lote = sequelize.define('Lote', {
    numeroLote: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    fechaVencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    cantidadActual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    costoUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('Activo', 'Inactivo'),
        allowNull: false,
        defaultValue: 'Activo'
    }
}, {
    timestamps: true,
    tableName: 'lotes',
    indexes: [
        {
            fields: ['fechaVencimiento']
        },
        {
            fields: ['productoId', 'fechaVencimiento']
        }
    ]
});

Lote.belongsTo(Producto, { foreignKey: 'productoId' });
Producto.hasMany(Lote, { foreignKey: 'productoId' });

Lote.belongsTo(Sucursal, { foreignKey: 'sucursalId' });
Sucursal.hasMany(Lote, { foreignKey: 'sucursalId' });

module.exports = Lote;