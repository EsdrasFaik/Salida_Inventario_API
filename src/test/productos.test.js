const request = require('supertest');
const app = require('../app');

// ─────────────────────────────────────────────
//  GET /api/categorias/listar
// ─────────────────────────────────────────────
describe('GET /api/categorias/listar', () => {
    it('debe retornar 200 y un array', async () => {
        const res = await request(app).get('/api/categorias/listar');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// ─────────────────────────────────────────────
//  GET /api/categorias/buscar
// ─────────────────────────────────────────────
describe('GET /api/categorias/buscar', () => {
    it('debe retornar 422 si no se envía id', async () => {
        const res = await request(app).get('/api/categorias/buscar');
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si el id no es entero', async () => {
        const res = await request(app).get('/api/categorias/buscar?id=abc');
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si la categoría no existe', async () => {
        const res = await request(app).get('/api/categorias/buscar?id=999999');
        expect(res.statusCode).toBe(422);
    });
});

// ─────────────────────────────────────────────
//  POST /api/categorias/guardar
// ─────────────────────────────────────────────
describe('POST /api/categorias/guardar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .post('/api/categorias/guardar')
            .field('Categoria', 'Test');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 422 si falta el nombre de la categoría (con token inválido)', async () => {
        const res = await request(app)
            .post('/api/categorias/guardar')
            .set('Authorization', 'Bearer token_invalido')
            .field('Categoria', '');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  GET /api/productos/listar
// ─────────────────────────────────────────────
describe('GET /api/productos/listar', () => {
    it('debe retornar 200 y un array', async () => {
        const res = await request(app).get('/api/productos/listar');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// ─────────────────────────────────────────────
//  GET /api/productos/buscar
// ─────────────────────────────────────────────
describe('GET /api/productos/buscar', () => {
    it('debe retornar 422 si no se envía id', async () => {
        const res = await request(app).get('/api/productos/buscar');
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si el id no es entero', async () => {
        const res = await request(app).get('/api/productos/buscar?id=xyz');
        expect(res.statusCode).toBe(422);
    });

    it('debe retornar 422 si el producto no existe', async () => {
        const res = await request(app).get('/api/productos/buscar?id=999999');
        expect(res.statusCode).toBe(422);
    });
});

// ─────────────────────────────────────────────
//  POST /api/productos/guardar
// ─────────────────────────────────────────────
describe('POST /api/productos/guardar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .post('/api/productos/guardar')
            .field('nombre', 'Producto Test')
            .field('sku', 'SKU-001');
        expect(res.statusCode).toBe(403);
    });

    it('debe retornar 422 si falta el nombre (con token inválido)', async () => {
        const res = await request(app)
            .post('/api/productos/guardar')
            .set('Authorization', 'Bearer token_invalido')
            .field('sku', 'SKU-002');
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────
//  PUT /api/productos/editar
// ─────────────────────────────────────────────
describe('PUT /api/productos/editar', () => {
    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app)
            .put('/api/productos/editar?id=1')
            .field('nombre', 'Nuevo nombre')
            .field('sku', 'SKU-NEW');
        expect(res.statusCode).toBe(403);
    });
});

// ─────────────────────────────────────────────
//  DELETE /api/productos/eliminar
// ─────────────────────────────────────────────
describe('DELETE /api/productos/eliminar', () => {
    it('debe retornar 422 si no se envía id', async () => {
        const res = await request(app)
            .delete('/api/productos/eliminar')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.statusCode).toBe(401);
    });

    it('debe retornar 403 si no se envía token', async () => {
        const res = await request(app).delete('/api/productos/eliminar?id=999999');
        expect(res.statusCode).toBe(403);
    });
});
