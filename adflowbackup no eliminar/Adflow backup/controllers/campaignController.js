const campaignOptimizerService = require('../services/campaignOptimizerService');
const launchCampaignService = require('../services/launchCampaignService');
const Usuario = require('../models/Usuario');

/**
 * Endpoint to optimize campaign allocation
 */
exports.optimize = async (req, res) => {
  try {
    const { budget, category, platform, maxChannels, listId } = req.body;

    // 1. Verify user is advertiser
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario || usuario.rol !== 'anunciante') {
      return res.status(403).json({
        success: false,
        message: 'Solo los anunciantes pueden optimizar campañas'
      });
    }

    // 2. Perform optimization
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

/**
 * Endpoint to automatically launch an optimized campaign
 */
exports.launchAutoCampaign = async (req, res) => {
  try {
    const { budget, category, platform, maxChannels, content, targetUrl, listId } = req.body;

    // 1. Verify user is advertiser
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario || usuario.rol !== 'anunciante') {
      return res.status(403).json({
        success: false,
        message: 'Solo los anunciantes pueden lanzar campañas automáticas'
      });
    }

    // 2. Perform end-to-end launch
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
