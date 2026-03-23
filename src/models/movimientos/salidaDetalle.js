const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Salida = require('./salida');
const Producto = require('../productos/producto');
const Lote = require('../inventarios/lote');

const SalidaDetalle = sequelize.define('SalidaDetalle', {
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    costoHistorico: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Costo unitario del lote en el momento del envío'
    }
}, {
    timestamps: true,
    tableName: 'salida_detalles'
});

SalidaDetalle.belongsTo(Salida, { foreignKey: 'salidaId' });
Salida.hasMany(SalidaDetalle, { foreignKey: 'salidaId' });

SalidaDetalle.belongsTo(Lote, { foreignKey: 'loteId' });
Lote.hasMany(SalidaDetalle, { foreignKey: 'loteId' });


module.exports = SalidaDetalle;