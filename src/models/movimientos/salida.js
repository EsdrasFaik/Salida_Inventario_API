const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Sucursal = require('../sucursales/sucursal');
const Usuario = require('../usuarios/usuario');

const Salida = sequelize.define('Salida', {
    fechaSalida: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    estado: {
        type: DataTypes.ENUM('Enviada', 'Recibida', 'Anulada'),
        allowNull: false,
        defaultValue: 'Enviada'
    },
    totalCosto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    fechaRecibido: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'salidas'
});

Salida.belongsTo(Sucursal, { as: 'SucursalOrigen', foreignKey: 'sucursalOrigenId' });
Salida.belongsTo(Sucursal, { as: 'SucursalDestino', foreignKey: 'sucursalDestinoId' });

Salida.belongsTo(Usuario, { as: 'UsuarioRegistra', foreignKey: 'usuarioId' });
Salida.belongsTo(Usuario, { as: 'UsuarioRecibe', foreignKey: 'usuarioRecibioId' });

module.exports = Salida;