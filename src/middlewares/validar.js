const { validationResult } = require('express-validator');

const validar = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(422).json({ errors: errores.array() });
    }
    next();
};

module.exports = validar;
