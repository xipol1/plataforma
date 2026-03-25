const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('campaigns');

module.exports = {
  optimize: h,
  launchAutoCampaign: h,
  getCampaigns: h,
  createCampaign: h
};

