process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const dataDir = path.join(__dirname, '..', 'data');

const advertiserToken = jwt.sign(
  { id: 'integration-adv-1', email: 'integration@example.com', rol: 'advertiser', emailVerificado: true },
  process.env.JWT_SECRET,
  { issuer: 'plataforma-monetizacion', audience: 'plataforma-monetizacion', expiresIn: '30m' }
);

describe('Integration - persistence and idempotency', () => {
  beforeEach(() => {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  });

  test('campaigns persist after creation', async () => {
    await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ titulo: 'Campaña Integración', presupuesto: 900 })
      .expect(201);

    const listRes = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].titulo).toBe('Campaña Integración');
    expect(listRes.body.data[0].estado).toBe('DRAFT');
  });

  test('transactions persist and reference is idempotent per user', async () => {
    const payload = { monto: 150, moneda: 'eur', referencia: 'ord-int-1' };

    const first = await request(app)
      .post('/api/transacciones')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send(payload)
      .expect(201);

    const second = await request(app)
      .post('/api/transacciones')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send(payload)
      .expect(200);

    expect(second.body.duplicate).toBe(true);
    expect(second.body.data.id).toBe(first.body.data.id);

    const list = await request(app)
      .get('/api/transacciones')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200);

    expect(list.body.data.length).toBe(1);
  });

  test('webhook is idempotent by event id', async () => {
    const body = { id: 'evt_123', type: 'payment_intent.succeeded' };

    const first = await request(app)
      .post('/api/transacciones/webhook')
      .send(body)
      .expect(202);

    const second = await request(app)
      .post('/api/transacciones/webhook')
      .send(body)
      .expect(200);

    expect(first.body.duplicate).toBe(false);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.eventId).toBe('evt_123');
  });


  test('files CRUD mínimo con auth', async () => {
    const created = await request(app)
      .post('/api/files')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ nombre: 'brief.txt', tipo: 'text/plain', contenido: 'brief de campaña' })
      .expect(201)

    const fileId = created.body.data.id

    await request(app)
      .get(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200)

    await request(app)
      .delete(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200)

    const list = await request(app)
      .get('/api/files')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200)

    expect(list.body.data.length).toBe(0)
  })


  test('flow DRAFT -> pago Stripe -> SUBMITTED -> PUBLISHED + click tracking', async () => {
    const createdCampaign = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ titulo: 'Flow Stripe', presupuesto: 700 })
      .expect(201)

    const campaignId = createdCampaign.body.data.id
    expect(createdCampaign.body.data.estado).toBe('DRAFT')

    const checkout = await request(app)
      .post('/api/transacciones/checkout')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ campaignId })
      .expect(201)

    const paymentIntentId = checkout.body.data.paymentIntentId

    await request(app)
      .post('/api/transacciones/webhook')
      .send({
        id: 'evt_flow_1',
        type: 'payment_intent.succeeded',
        data: { object: { id: paymentIntentId } }
      })
      .expect(202)

    const submittedCampaign = await request(app)
      .get(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200)

    expect(submittedCampaign.body.data.estado).toBe('SUBMITTED')

    const published = await request(app)
      .post(`/api/campaigns/${campaignId}/publish`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200)

    expect(published.body.data.estado).toBe('PUBLISHED')

    const click1 = await request(app)
      .get(`/api/campaigns/${campaignId}/click?utm_source=google&utm_medium=cpc&utm_campaign=launch`)
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS)')
      .set('x-forwarded-for', '10.0.0.1')
      .set('referer', 'https://google.com/search')
      .expect(200)

    const click2 = await request(app)
      .get(`/api/campaigns/${campaignId}/click?utm_source=google&utm_medium=cpc&utm_campaign=launch`)
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
      .set('x-forwarded-for', '10.0.0.2')
      .set('referer', 'https://google.com/search')
      .expect(200)

    expect(click1.body.data.totalClicks).toBe(1)
    expect(click2.body.data.totalClicks).toBe(2)
    expect(click2.body.data.uniqueVisitors).toBe(2)

    const tracking = await request(app)
      .get(`/api/campaigns/${campaignId}/tracking`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200)

    expect(tracking.body.data.tracking.totalClicks).toBe(2)
    expect(tracking.body.data.tracking.byUtmSource.google).toBe(2)
    expect(tracking.body.data.tracking.byDevice.mobile).toBe(1)
    expect(tracking.body.data.tracking.byDevice.desktop).toBe(1)
  })

  test('anuncios CRUD mínimo con auth y validación', async () => {
    const created = await request(app)
      .post('/api/anuncios')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ titulo: 'Anuncio 1', descripcion: 'Descripción mínima válida para el anuncio', presupuesto: 300 })
      .expect(201);

    const anuncioId = created.body.data.id;

    await request(app)
      .get(`/api/anuncios/${anuncioId}`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200);

    const updated = await request(app)
      .put(`/api/anuncios/${anuncioId}`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .send({ titulo: 'Anuncio 1 editado' })
      .expect(200);

    expect(updated.body.data.titulo).toBe('Anuncio 1 editado');

    await request(app)
      .delete(`/api/anuncios/${anuncioId}`)
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200);

    const list = await request(app)
      .get('/api/anuncios')
      .set('Authorization', `Bearer ${advertiserToken}`)
      .expect(200);

    expect(list.body.data.length).toBe(0);
  });
});
