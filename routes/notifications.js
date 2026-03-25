const express = require('express');
const { notImplementedHandler } = require('../lib/notImplemented');

const router = express.Router();

router.use(notImplementedHandler('notifications'));

module.exports = router;
