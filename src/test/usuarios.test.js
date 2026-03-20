const request = require('supertest');
const app = require('../app');

// ─────────────────────────────────────────────
//  GET /api/usuarios/listar
// ─────────────────────────────────────────────
describe('GET /api/usuarios/listar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).get('/api/usuarios/listar');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .get('/api/usuarios/listar')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  POST /api/usuarios/guardar
// ─────────────────────────────────────────────
describe('POST /api/usuarios/guardar', () => {
    it('debe retornar 422 si faltan todos los campos', async () => {
        const res = await request(app)
            .post('/api/usuarios/guardar')
            .send({});
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si el correo no tiene formato válido', async () => {
        const res = await request(app)
            .post('/api/usuarios/guardar')
            .send({ nombre: 'Juan Pérez', correo: 'no-es-un-correo', contrasena: 'clave123' });
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si la contraseña es muy corta', async () => {
        const res = await request(app)
            .post('/api/usuarios/guardar')
            .send({ nombre: 'Juan Pérez', correo: 'juan@test.com', contrasena: '123' }); // min 6
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si el nombre es muy corto', async () => {
        const res = await request(app)
            .post('/api/usuarios/guardar')
            .send({ nombre: 'AB', correo: 'juan@test.com', contrasena: 'clave123' }); // min 3
        expect(res.statusCode).toBe(422);
    });
});

// ─────────────────────────────────────────────
//  POST /api/usuarios/iniciarsesion
// ─────────────────────────────────────────────
describe('POST /api/usuarios/iniciarsesion', () => {
    it('debe retornar 401 con credenciales incorrectas', async () => {
        const res = await request(app)
            .post('/api/usuarios/iniciarsesion')
            .send({ login: 'noexiste@test.com', contrasena: 'wrongpass' });
        expect(res.statusCode).toBe(401);
    });

    it('debe retornar 422 si faltan campos', async () => {
        const res = await request(app)
            .post('/api/usuarios/iniciarsesion')
            .send({});
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si solo falta la contraseña', async () => {
        const res = await request(app)
            .post('/api/usuarios/iniciarsesion')
            .send({ login: 'juan@test.com' });
        expect(res.statusCode).toBe(422);
    });
});

// ─────────────────────────────────────────────
//  POST /api/usuarios/pin  (recuperar contraseña)
// ─────────────────────────────────────────────
describe('POST /api/usuarios/pin', () => {
    it('debe retornar 422 si no se envía correo', async () => {
        const res = await request(app)
            .post('/api/usuarios/pin')
            .send({});
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si el correo no tiene formato válido', async () => {
        const res = await request(app)
            .post('/api/usuarios/pin')
            .send({ correo: 'no-es-correo' });
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 404 si el correo no está registrado', async () => {
        const res = await request(app)
            .post('/api/usuarios/pin')
            .send({ correo: 'noexiste_nunca@test.com' });
        expect(res.statusCode).toBe(404);
    });
});

// ─────────────────────────────────────────────
//  PUT /api/usuarios/actualizar/contrasena
// ─────────────────────────────────────────────
describe('PUT /api/usuarios/actualizar/contrasena', () => {
    it('debe retornar 422 si faltan todos los campos', async () => {
        const res = await request(app)
            .put('/api/usuarios/actualizar/contrasena')
            .send({});
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si el PIN no tiene exactamente 6 caracteres', async () => {
        const res = await request(app)
            .put('/api/usuarios/actualizar/contrasena')
            .send({ correo: 'juan@test.com', pin: '123', contrasena: 'nuevaClave123' }); // pin muy corto
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si la nueva contraseña es muy corta', async () => {
        const res = await request(app)
            .put('/api/usuarios/actualizar/contrasena')
            .send({ correo: 'juan@test.com', pin: 'abc123', contrasena: '123' }); // min 6
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 400 si el PIN es incorrecto o el usuario no existe', async () => {
        const res = await request(app)
            .put('/api/usuarios/actualizar/contrasena')
            .send({ correo: 'noexiste@test.com', pin: 'aabbcc', contrasena: 'nuevaClave123' });
        expect(res.statusCode).toBe(400);
    });
});
