const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Sucursal = require('../inventario/sucursal');

const Usuario = sequelize.define('Usuario', {
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },

  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  tipoUsuario: {
    type: DataTypes.ENUM('Jefe de bodega', 'Empleado', 'Administrador'),
    allowNull: false
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '000000'
  },
  pinExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  intentos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  contrasena: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('Activo', 'Bloqueado', 'Inactivo', 'Logeado'),
    defaultValue: 'Activo'
  }
}, {
  timestamps: true,
  tableName: 'usuarios'
});

Usuario.belongsTo(Sucursal, { foreignKey: 'sucursalId' });
Sucursal.hasMany(Usuario, { foreignKey: 'sucursalId' });

module.exports = Usuario;
