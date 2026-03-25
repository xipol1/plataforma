const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('channels');

module.exports = {
  listChannels: h,
  getChannelById: h
};

