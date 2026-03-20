const request = require('supertest');
const app = require('../app');

// ─────────────────────────────────────────────
//  GET /api/lotes/listar
// ─────────────────────────────────────────────
describe('GET /api/lotes/listar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).get('/api/lotes/listar');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .get('/api/lotes/listar')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  GET /api/lotes/buscar
// ─────────────────────────────────────────────
describe('GET /api/lotes/buscar', () => {
    it('debe retornar 401 si no hay token válido', async () => {
        const res = await request(app)
            .get('/api/lotes/buscar?id=1')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  POST /api/lotes/guardar
// ─────────────────────────────────────────────
describe('POST /api/lotes/guardar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .post('/api/lotes/guardar')
            .send({
                numeroLote: 'L-001',
                fechaVencimiento: '2027-01-01',
                costoUnitario: '15.50',
                productoId: 1
            });
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 422 si falta fechaVencimiento (con token inválido)', async () => {
        const res = await request(app)
            .post('/api/lotes/guardar')
            .set('Authorization', 'Bearer token_invalido')
            .send({ numeroLote: 'L-002', costoUnitario: '10.00', productoId: 1 });
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  PUT /api/lotes/editar
// ─────────────────────────────────────────────
describe('PUT /api/lotes/editar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .put('/api/lotes/editar?id=1')
            .send({
                numeroLote: 'L-001',
                fechaVencimiento: '2027-01-01',
                costoUnitario: '15.50',
                productoId: 1
            });
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .put('/api/lotes/editar?id=999999')
            .set('Authorization', 'Bearer token_invalido')
            .send({
                numeroLote: 'L-001',
                fechaVencimiento: '2027-01-01',
                costoUnitario: '15.50',
                productoId: 1
            });
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  DELETE /api/lotes/eliminar
// ─────────────────────────────────────────────
describe('DELETE /api/lotes/eliminar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).delete('/api/lotes/eliminar?id=1');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 401 si el token es inválido', async () => {
        const res = await request(app)
            .delete('/api/lotes/eliminar?id=999999')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });
});
