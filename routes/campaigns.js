const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { autenticar, autorizarRoles } = require('../middleware/auth');

router.get('/:id/click', campaignController.trackClick);

router.post('/optimize', autenticar, autorizarRoles('advertiser', 'admin'), campaignController.optimize);
router.post('/launch-auto', autenticar, autorizarRoles('advertiser', 'admin'), campaignController.launchAutoCampaign);

router.get('/', autenticar, campaignController.getCampaigns);
router.get('/:id', autenticar, campaignController.getCampaignById);
router.get('/:id/tracking', autenticar, campaignController.getCampaignTracking);

router.post('/', autenticar, campaignController.createCampaign);
router.post('/:id/publish', autenticar, autorizarRoles('advertiser', 'admin'), campaignController.publishCampaign);

module.exports = router;
