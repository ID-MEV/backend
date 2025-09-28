
const express = require('express');
const router = express.Router();
const sermonController = require('./controllers/sermonController');

router.get('/latest', sermonController.getLatestSermons);

module.exports = router;
