const request = require('supertest');
const app = require('../app');

// ─────────────────────────────────────────────
//  GET /api/sucursales/listar
// ─────────────────────────────────────────────
describe('GET /api/sucursales/listar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).get('/api/sucursales/listar');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .get('/api/sucursales/listar')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  GET /api/sucursales/buscar
// ─────────────────────────────────────────────
describe('GET /api/sucursales/buscar', () => {
    it('debe retornar 422 si no se envía id', async () => {
        const res = await request(app)
            .get('/api/sucursales/buscar')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });

    it('debe retornar 422 si el id no es entero', async () => {
        const res = await request(app)
            .get('/api/sucursales/buscar?id=abc')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  POST /api/sucursales/guardar
// ─────────────────────────────────────────────
describe('POST /api/sucursales/guardar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .post('/api/sucursales/guardar')
            .send({ nombre: 'Sucursal Test', ubicacion: 'Ciudad Test' });
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .post('/api/sucursales/guardar')
            .set('Authorization', 'Bearer token_invalido')
            .send({ nombre: 'Sucursal Test', ubicacion: 'Ciudad Test' });
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  PUT /api/sucursales/editar
// ─────────────────────────────────────────────
describe('PUT /api/sucursales/editar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .put('/api/sucursales/editar?id=1')
            .send({ nombre: 'Nueva', ubicacion: 'Nueva ubicacion' });
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 422 si no se envía id (con token inválido)', async () => {
        const res = await request(app)
            .put('/api/sucursales/editar')
            .set('Authorization', 'Bearer token_invalido')
            .send({ nombre: 'Nueva', ubicacion: 'Nueva ubicacion' });
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  DELETE /api/sucursales/eliminar
// ─────────────────────────────────────────────
describe('DELETE /api/sucursales/eliminar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).delete('/api/sucursales/eliminar?id=1');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 422 si la sucursal no existe (con token inválido)', async () => {
        const res = await request(app)
            .delete('/api/sucursales/eliminar?id=999999')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});
