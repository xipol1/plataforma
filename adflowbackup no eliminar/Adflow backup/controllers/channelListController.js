const channelListService = require('../services/channelListService');

/**
 * Create a new channel list.
 */
exports.createList = async (req, res) => {
  try {
    const { name, category } = req.body;
    const list = await channelListService.createList(req.user.id, name, category);
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a channel to a list.
 */
exports.addChannel = async (req, res) => {
  try {
    const { channelId } = req.body;
    const list = await channelListService.addChannelToList(req.params.id, channelId);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove a channel from a list.
 */
exports.removeChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const list = await channelListService.removeChannelFromList(req.params.id, channelId);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all user lists.
 */
exports.getLists = async (req, res) => {
  try {
    const lists = await channelListService.getUserLists(req.user.id);
    res.json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
