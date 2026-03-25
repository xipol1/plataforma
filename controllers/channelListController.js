const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('lists');

module.exports = {
  createList: h,
  getLists: h,
  addChannel: h,
  removeChannel: h
};

