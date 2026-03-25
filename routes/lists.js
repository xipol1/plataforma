const express = require('express');
const { notImplementedHandler } = require('../lib/notImplemented');

const router = express.Router();

router.use(notImplementedHandler('lists'));

module.exports = router;
