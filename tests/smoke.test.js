process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

describe('Smoke API checks', () => {
  const advertiserToken = jwt.sign(
    { id: 'test-adv-1', email: 'adv@example.com', rol: 'advertiser', emailVerificado: true },
    process.env.JWT_SECRET,
    { issuer: 'plataforma-monetizacion', audience: 'plataforma-monetizacion', expiresIn: '30m' }
  );

  test('GET /health responde 200', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('GET /api/health responde 200', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/channels responde listado demo', async () => {
    const res = await request(app).get('/api/channels');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/registro valida fortaleza de contraseña', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      email: 'test@example.com',
      password: 'weakpass1'
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/login valida campos requeridos', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: '',
      password: ''
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /api/campaigns sin token devuelve 401', async () => {
    const res = await request(app).get('/api/campaigns');
    expect(res.status).toBe(401);
  });

  test('POST /api/campaigns con anunciante crea campaña', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ titulo: 'Campaña Q2', presupuesto: 500 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('estado', 'DRAFT');
  });

  test('GET /api/campaigns con anunciante lista campañas', async () => {
    const res = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${advertiserToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/transacciones con anunciante responde 200', async () => {
    const res = await request(app)
      .get('/api/transacciones')
      .set('Authorization', `Bearer ${advertiserToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/transacciones crea transacción válida', async () => {
    const res = await request(app)
      .post('/api/transacciones')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ monto: 120, moneda: 'eur', referencia: 'order-1001' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('estado', 'pending');
  });
});
