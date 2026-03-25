const express = require('express');
const { notImplementedHandler } = require('../lib/notImplemented');

const router = express.Router();

router.use(notImplementedHandler('transacciones'));

module.exports = router;
