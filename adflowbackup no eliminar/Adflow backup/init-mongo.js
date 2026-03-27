db = db.getSiblingDB('monetizacion');

// Crear colecciones
db.createCollection('users');
db.createCollection('channels');
db.createCollection('ads');
db.createCollection('transactions');
db.createCollection('statistics');

// Crear usuario administrador
db.users.insertOne({
  email: 'admin@plataforma.com',
  password: '$2b$10$X/4yCUUC7CuQV1JjPQYgXOqJl5nOcQl1ECmFV9d8gBR0GA0HnZ.Oe', // contraseña: admin123
  name: 'Administrador',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Crear usuarios creadores
db.users.insertOne({
  email: 'creador1@ejemplo.com',
  password: '$2b$10$X/4yCUUC7CuQV1JjPQYgXOqJl5nOcQl1ECmFV9d8gBR0GA0HnZ.Oe', // contraseña: admin123
  name: 'Carlos Rodríguez',
  role: 'creator',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.users.insertOne({
  email: 'creador2@ejemplo.com',
  password: '$2b$10$X/4yCUUC7CuQV1JjPQYgXOqJl5nOcQl1ECmFV9d8gBR0GA0HnZ.Oe', // contraseña: admin123
  name: 'María López',
  role: 'creator',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Crear usuarios anunciantes
db.users.insertOne({
  email: 'anunciante1@ejemplo.com',
  password: '$2b$10$X/4yCUUC7CuQV1JjPQYgXOqJl5nOcQl1ECmFV9d8gBR0GA0HnZ.Oe', // contraseña: admin123
  name: 'Empresa XYZ',
  role: 'advertiser',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.users.insertOne({
  email: 'anunciante2@ejemplo.com',
  password: '$2b$10$X/4yCUUC7CuQV1JjPQYgXOqJl5nOcQl1ECmFV9d8gBR0GA0HnZ.Oe', // contraseña: admin123
  name: 'Startup ABC',
  role: 'advertiser',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Crear canales
const creador1Id = db.users.findOne({email: 'creador1@ejemplo.com'})._id;
const creador2Id = db.users.findOne({email: 'creador2@ejemplo.com'})._id;

db.channels.insertOne({
  userId: creador1Id,
  name: 'TechNews',
  platform: 'telegram',
  handle: '@technews',
  category: 'tecnología',
  subscribers: 15000,
  description: 'Canal de noticias sobre tecnología y gadgets',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.channels.insertOne({
  userId: creador1Id,
  name: 'Marketing Digital',
  platform: 'whatsapp',
  handle: '+1234567890',
  category: 'marketing',
  subscribers: 5000,
  description: 'Grupo de WhatsApp sobre estrategias de marketing digital',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.channels.insertOne({
  userId: creador2Id,
  name: 'Viajes y Aventuras',
  platform: 'instagram',
  handle: '@viajes_aventuras',
  category: 'viajes',
  subscribers: 25000,
  description: 'Cuenta de Instagram sobre viajes y aventuras por el mundo',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.channels.insertOne({
  userId: creador2Id,
  name: 'Comunidad Gamer',
  platform: 'discord',
  handle: 'comunidad-gamer',
  category: 'gaming',
  subscribers: 8000,
  description: 'Servidor de Discord para gamers y entusiastas de videojuegos',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Crear tarifas para los canales
const canal1Id = db.channels.findOne({name: 'TechNews'})._id;
const canal2Id = db.channels.findOne({name: 'Marketing Digital'})._id;
const canal3Id = db.channels.findOne({name: 'Viajes y Aventuras'})._id;
const canal4Id = db.channels.findOne({name: 'Comunidad Gamer'})._id;

db.createCollection('rates');

db.rates.insertOne({
  channelId: canal1Id,
  type: 'post',
  price: 100,
  currency: 'USD',
  description: 'Publicación estándar en el canal',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.rates.insertOne({
  channelId: canal1Id,
  type: 'pinned',
  price: 200,
  currency: 'USD',
  description: 'Publicación fijada por 24 horas',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.rates.insertOne({
  channelId: canal2Id,
  type: 'message',
  price: 50,
  currency: 'USD',
  description: 'Mensaje en el grupo de WhatsApp',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.rates.insertOne({
  channelId: canal3Id,
  type: 'post',
  price: 150,
  currency: 'USD',
  description: 'Publicación en feed de Instagram',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.rates.insertOne({
  channelId: canal3Id,
  type: 'story',
  price: 80,
  currency: 'USD',
  description: 'Historia de Instagram',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.rates.insertOne({
  channelId: canal4Id,
  type: 'announcement',
  price: 70,
  currency: 'USD',
  description: 'Anuncio en canal de anuncios del servidor',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Crear algunos anuncios
const anunciante1Id = db.users.findOne({email: 'anunciante1@ejemplo.com'})._id;
const anunciante2Id = db.users.findOne({email: 'anunciante2@ejemplo.com'})._id;

db.ads.insertOne({
  advertiserId: anunciante1Id,
  channelId: canal1Id,
  title: 'Nuevo smartphone XYZ',
  content: 'Descubre el nuevo smartphone XYZ con cámara de 108MP y batería de 5000mAh. Visita nuestra web: xyz.com',
  type: 'post',
  status: 'approved',
  price: 100,
  currency: 'USD',
  scheduledDate: new Date(new Date().getTime() + 86400000), // mañana
  createdAt: new Date(),
  updatedAt: new Date()
});

db.ads.insertOne({
  advertiserId: anunciante1Id,
  channelId: canal3Id,
  title: 'Oferta especial en vuelos',
  content: 'Vuelos a Europa con 30% de descuento. Reserva ahora en xyz-viajes.com',
  type: 'post',
  status: 'pending',
  price: 150,
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.ads.insertOne({
  advertiserId: anunciante2Id,
  channelId: canal4Id,
  title: 'Nuevo juego ABC',
  content: 'Ya disponible el nuevo juego ABC. Descárgalo ahora con 20% de descuento usando el código GAMER20',
  type: 'announcement',
  status: 'approved',
  price: 70,
  currency: 'USD',
  scheduledDate: new Date(new Date().getTime() + 172800000), // pasado mañana
  createdAt: new Date(),
  updatedAt: new Date()
});

// Crear algunas transacciones
db.transactions.insertOne({
  advertiserId: anunciante1Id,
  creatorId: creador1Id,
  adId: db.ads.findOne({title: 'Nuevo smartphone XYZ'})._id,
  amount: 100,
  fee: 15,
  netAmount: 85,
  currency: 'USD',
  status: 'completed',
  paymentMethod: 'stripe',
  paymentId: 'pm_' + Math.random().toString(36).substring(2, 15),
  createdAt: new Date(),
  updatedAt: new Date()
});

db.transactions.insertOne({
  advertiserId: anunciante2Id,
  creatorId: creador2Id,
  adId: db.ads.findOne({title: 'Nuevo juego ABC'})._id,
  amount: 70,
  fee: 10.5,
  netAmount: 59.5,
  currency: 'USD',
  status: 'completed',
  paymentMethod: 'paypal',
  paymentId: 'pp_' + Math.random().toString(36).substring(2, 15),
  createdAt: new Date(),
  updatedAt: new Date()
});

// Crear algunas estadísticas
db.statistics.insertOne({
  channelId: canal1Id,
  date: new Date(),
  views: 12500,
  clicks: 350,
  ctr: 2.8,
  revenue: 850,
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.statistics.insertOne({
  channelId: canal3Id,
  date: new Date(),
  views: 18000,
  clicks: 620,
  ctr: 3.44,
  revenue: 1200,
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Inicialización de la base de datos completada con éxito');
