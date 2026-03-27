const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { autenticar, autorizarRoles } = require('../middleware/auth');

/**
 * @route   POST /api/campaigns/optimize
 * @desc    Automatically optimize campaign allocation across channels
 * @access  Private (Advertiser only)
 */
router.post('/optimize',
  autenticar,
  autorizarRoles('anunciante'),
  campaignController.optimize
);

/**
 * @route   POST /api/campaigns/launch-auto
 * @desc    Automatically optimize and launch a campaign across channels
 * @access  Private (Advertiser only)
 */
router.post('/launch-auto',
  autenticar,
  autorizarRoles('anunciante'),
  campaignController.launchAutoCampaign
);

module.exports = router;
