const campaignOptimizerService = require('../services/campaignOptimizerService');
const launchCampaignService = require('../services/launchCampaignService');
const Usuario = require('../models/Usuario');

const Anuncio = require('../models/Anuncio');

exports.optimize = async (req, res) => {
  try {
    const { budget, category, platform, maxChannels, listId } = req.body;

    const usuario = await Usuario.findById(req.user.id);
    if (!usuario || usuario.rol !== 'advertiser') {
      return res.status(403).json({
        success: false,
        message: 'Solo los anunciantes pueden optimizar campañas'
      });
    }

    const result = await campaignOptimizerService.optimizeCampaign({
      budget,
      category,
      platform,
      maxChannels,
      listId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in campaign optimization:', error);
    res.status(error.message === 'Budget must be greater than 0' ? 400 : 500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

exports.launchAutoCampaign = async (req, res) => {
  try {
    const { budget, category, platform, maxChannels, content, targetUrl, listId } = req.body;

    const usuario = await Usuario.findById(req.user.id);
    if (!usuario || usuario.rol !== 'advertiser') {
      return res.status(403).json({
        success: false,
        message: 'Solo los anunciantes pueden lanzar campañas automáticas'
      });
    }

    const result = await launchCampaignService.launchAutoCampaign(req.user.id, {
      budget,
      category,
      platform,
      maxChannels,
      content,
      targetUrl,
      listId
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in automatic campaign launch:', error);
    res.status(error.message && error.message.includes('No se encontraron') ? 404 : 500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const filters = {};
    if (req.user.role === 'advertiser') {
      filters.anunciante = req.user.id;
    } else if (req.user.role === 'creator') {
      const Canal = require('../models/Canal');
      const channels = await Canal.find({ propietario: req.user.id }).select('_id');
      filters.canal = { $in: channels.map(c => c._id) };
    }

    const campaigns = await Anuncio.find(filters)
      .populate('canal', 'nombre plataforma url')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { titulo, descripcion, canalId, tipoAnuncio, presupuesto } = req.body;

    const nuevaCampana = new Anuncio({
      titulo,
      descripcion,
      anunciante: req.user.id,
      canal: canalId,
      tipoAnuncio: tipoAnuncio || 'post',
      presupuesto: {
        monto: presupuesto || 0,
        moneda: 'USD'
      },
      objetivos: {
        principal: 'awareness'
      }
    });

    await nuevaCampana.save();

    res.status(201).json({
      success: true,
      campaign: nuevaCampana
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};
