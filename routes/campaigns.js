const express = require('express');
const { notImplementedHandler } = require('../lib/notImplemented');

const router = express.Router();

router.use(notImplementedHandler('campaigns'));

module.exports = router;
