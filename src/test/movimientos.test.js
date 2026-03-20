const request = require('supertest');
const app = require('../app');

// ─────────────────────────────────────────────
//  GET /api/salidas/listar
// ─────────────────────────────────────────────
describe('GET /api/salidas/listar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).get('/api/salidas/listar');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .get('/api/salidas/listar')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  GET /api/salidas/buscar
// ─────────────────────────────────────────────
describe('GET /api/salidas/buscar', () => {
    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .get('/api/salidas/buscar?id=1')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });

    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).get('/api/salidas/buscar?id=1');
        expect(res.statusCode).toBe(403);
    });
});

// ─────────────────────────────────────────────
//  POST /api/salidas/guardar
// ─────────────────────────────────────────────
describe('POST /api/salidas/guardar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .post('/api/salidas/guardar')
            .send({ sucursalId: 1, usuarioId: 1, detalles: [] });
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 422 si detalles está vacío (con token inválido)', async () => {
        const res = await request(app)
            .post('/api/salidas/guardar')
            .set('Authorization', 'Bearer token_invalido')
            .send({ sucursalId: 1, usuarioId: 1, detalles: [] });
        expect(res.statusCode).toBe(401);
    });

    it('debe retornar 422 si faltan campos obligatorios', async () => {
        const res = await request(app)
            .post('/api/salidas/guardar')
            .set('Authorization', 'Bearer token_invalido')
            .send({});
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  PUT /api/salidas/estado
// ─────────────────────────────────────────────
describe('PUT /api/salidas/estado', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .put('/api/salidas/estado?id=1')
            .send({ estado: 'Recibida' });
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 422 si el estado es inválido (con token inválido)', async () => {
        const res = await request(app)
            .put('/api/salidas/estado?id=1')
            .set('Authorization', 'Bearer token_invalido')
            .send({ estado: 'EstadoInvalido' });
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  DELETE /api/salidas/eliminar
// ─────────────────────────────────────────────
describe('DELETE /api/salidas/eliminar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).delete('/api/salidas/eliminar?id=1');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .delete('/api/salidas/eliminar?id=999999')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});
