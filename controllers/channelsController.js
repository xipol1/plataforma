const Canal = require('../models/Canal');
const Usuario = require('../models/Usuario');

const normalizeChannel = (canal) => {
  const obj = canal?.toObject ? canal.toObject() : canal;
  const price = obj?.tarifas?.post?.precio ?? 0;
  const currency = obj?.tarifas?.post?.moneda ?? 'USD';
  const engagement = obj?.estadisticas?.tasaEngagement ?? 0;
  const audience = obj?.estadisticas?.seguidores ?? 0;

  return {
    id: obj?._id,
    nombre: obj?.nombre,
    plataforma: obj?.plataforma,
    tematica: obj?.categoria,
    audiencia,
    engagement,
    precio: price,
    moneda: currency,
    estado: obj?.status,
    verificado: Boolean(obj?.verificacion?.verificado || obj?.isVerified),
    url: obj?.url,
  };
};

const ensureSeedOwner = async () => {
  let owner = await Usuario.findOne({ email: 'seed@adflow.com' });
  if (owner) return owner;

  owner = new Usuario({
    nombre: 'Seed',
    apellido: 'AdFlow',
    email: 'seed@adflow.com',
    password: '123456',
    rol: 'creator',
    verificado: true,
    verificacion: { emailVerificado: true, fechaVerificacion: new Date() }
  });
  await owner.save();
  return owner;
};

const seedChannelsIfNeeded = async () => {
  const existing = await Canal.countDocuments({ status: 'ACTIVE' });
  if (existing > 0) return;

  const owner = await ensureSeedOwner();
  const now = new Date();

  const seed = [
    {
      nombre: 'TechLatam Daily',
      descripcion: 'Noticias y tendencias de tecnología para emprendedores en español.',
      plataforma: 'telegram',
      identificadores: { username: 'techlatamdaily', chatId: '100000001' },
      url: 'https://t.me/techlatamdaily',
      categoria: 'tecnologia',
      idioma: 'es',
      paisObjetivo: 'MX',
      estadisticas: { seguidores: 185000, promedioVisualizaciones: 62000, promedioInteracciones: 4100, tasaEngagement: 6.6 },
      tarifas: { post: { precio: 450, moneda: 'USD', descripcion: 'Post promocional + link' } }
    },
    {
      nombre: 'Fitness & Salud ES',
      descripcion: 'Rutinas, nutrición y hábitos saludables con enfoque práctico.',
      plataforma: 'instagram',
      identificadores: { username: 'fitness_salud_es' },
      url: 'https://instagram.com/fitness_salud_es',
      categoria: 'salud',
      idioma: 'es',
      paisObjetivo: 'ES',
      estadisticas: { seguidores: 92000, promedioVisualizaciones: 21000, promedioInteracciones: 1800, tasaEngagement: 8.5 },
      tarifas: { post: { precio: 380, moneda: 'USD', descripcion: 'Post feed con CTA' } }
    },
    {
      nombre: 'Viajes Low Cost',
      descripcion: 'Ofertas, rutas y tips para viajar barato por Europa y LATAM.',
      plataforma: 'telegram',
      identificadores: { username: 'viajeslowcost', chatId: '100000002' },
      url: 'https://t.me/viajeslowcost',
      categoria: 'viajes',
      idioma: 'es',
      paisObjetivo: 'ES',
      estadisticas: { seguidores: 64000, promedioVisualizaciones: 18000, promedioInteracciones: 950, tasaEngagement: 5.2 },
      tarifas: { post: { precio: 220, moneda: 'USD', descripcion: 'Post con oferta destacada' } }
    },
    {
      nombre: 'Gaming Highlights',
      descripcion: 'Clips y highlights de gaming competitivo y entretenimiento.',
      plataforma: 'discord',
      identificadores: { serverId: '900000001', channelId: '900000101' },
      url: 'https://discord.gg/gaminghighlights',
      categoria: 'gaming',
      idioma: 'en',
      paisObjetivo: 'US',
      estadisticas: { seguidores: 54000, promedioVisualizaciones: 12000, promedioInteracciones: 1500, tasaEngagement: 7.1 },
      tarifas: { post: { precio: 260, moneda: 'USD', descripcion: 'Anuncio fijado 24h' } }
    },
    {
      nombre: 'Negocios y Marketing',
      descripcion: 'Estrategias de crecimiento, embudos y casos de negocio.',
      plataforma: 'telegram',
      identificadores: { username: 'negociosymarketing', chatId: '100000003' },
      url: 'https://t.me/negociosymarketing',
      categoria: 'negocios',
      idioma: 'es',
      paisObjetivo: 'AR',
      estadisticas: { seguidores: 73000, promedioVisualizaciones: 25000, promedioInteracciones: 2100, tasaEngagement: 8.4 },
      tarifas: { post: { precio: 300, moneda: 'USD', descripcion: 'Post + UTM tracking' } }
    },
    {
      nombre: 'Foodies Madrid',
      descripcion: 'Recomendaciones gastronómicas, reseñas y planes foodie.',
      plataforma: 'instagram',
      identificadores: { username: 'foodiesmadrid' },
      url: 'https://instagram.com/foodiesmadrid',
      categoria: 'comida',
      idioma: 'es',
      paisObjetivo: 'ES',
      estadisticas: { seguidores: 51000, promedioVisualizaciones: 14000, promedioInteracciones: 1300, tasaEngagement: 9.0 },
      tarifas: { post: { precio: 190, moneda: 'USD', descripcion: 'Story con swipe/link' } }
    },
    {
      nombre: 'Crypto Basics LATAM',
      descripcion: 'Educación cripto para principiantes, noticias y análisis sencillo.',
      plataforma: 'telegram',
      identificadores: { username: 'cryptobasicslatam', chatId: '100000004' },
      url: 'https://t.me/cryptobasicslatam',
      categoria: 'educacion',
      idioma: 'es',
      paisObjetivo: 'CO',
      estadisticas: { seguidores: 88000, promedioVisualizaciones: 30000, promedioInteracciones: 1700, tasaEngagement: 5.7 },
      tarifas: { post: { precio: 320, moneda: 'USD', descripcion: 'Post educativo patrocinado' } }
    },
    {
      nombre: 'Arte Digital & Diseño',
      descripcion: 'Recursos, inspiración y comunidad de diseño y arte digital.',
      plataforma: 'discord',
      identificadores: { serverId: '900000002', channelId: '900000201' },
      url: 'https://discord.gg/artedigital',
      categoria: 'arte',
      idioma: 'es',
      paisObjetivo: 'ES',
      estadisticas: { seguidores: 27000, promedioVisualizaciones: 8000, promedioInteracciones: 900, tasaEngagement: 11.2 },
      tarifas: { post: { precio: 140, moneda: 'USD', descripcion: 'Anuncio destacado 12h' } }
    }
  ];

  await Canal.insertMany(seed.map((c) => ({
    propietario: owner._id,
    ...c,
    status: 'ACTIVE',
    isVerified: true,
    score: 75,
    performanceScore: 70,
    level: 'GOLD',
    estado: 'verificado',
    verificacion: { verificado: true, fechaVerificacion: now, metodoVerificacion: 'seed' }
  })));
};

exports.listChannels = async (req, res) => {
  try {
    const {
      q,
      plataforma,
      categoria,
      verificado,
      ordenPor = 'relevancia',
      pagina = 1,
      limite = 24,
    } = req.query;

    const page = Math.max(parseInt(pagina, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limite, 10) || 24, 1), 60);

    const filtros = { status: 'ACTIVE' };
    if (plataforma) filtros.plataforma = plataforma;
    if (categoria) filtros.categoria = categoria;
    if (verificado === 'true') filtros.$or = [{ isVerified: true }, { 'verificacion.verificado': true }];

    if (q) {
      filtros.$and = (filtros.$and || []).concat([
        {
          $or: [
            { nombre: { $regex: q, $options: 'i' } },
            { descripcion: { $regex: q, $options: 'i' } },
            { categoria: { $regex: q, $options: 'i' } },
          ],
        },
      ]);
    }

    let sort = {};
    switch (ordenPor) {
      case 'audiencia':
        sort = { 'estadisticas.seguidores': -1 };
        break;
      case 'engagement':
        sort = { 'estadisticas.tasaEngagement': -1 };
        break;
      case 'precio_asc':
        sort = { 'tarifas.post.precio': 1 };
        break;
      case 'precio_desc':
        sort = { 'tarifas.post.precio': -1 };
        break;
      case 'fecha':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { isVerified: -1, score: -1, 'estadisticas.seguidores': -1 };
    }

    const skip = (page - 1) * limit;

    let [total, canales] = await Promise.all([
      Canal.countDocuments(filtros),
      Canal.find(filtros).sort(sort).skip(skip).limit(limit),
    ]);

    if (page === 1 && total === 0) {
      await seedChannelsIfNeeded();
      [total, canales] = await Promise.all([
        Canal.countDocuments(filtros),
        Canal.find(filtros).sort(sort).skip(skip).limit(limit),
      ]);
    }

    res.json({
      success: true,
      channels: canales.map(normalizeChannel),
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error('Error al listar canales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

exports.getChannelById = async (req, res) => {
  try {
    const canal = await Canal.findById(req.params.id);
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado',
      });
    }
    res.json({
      success: true,
      channel: normalizeChannel(canal),
    });
  } catch (error) {
    console.error('Error al obtener canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};
