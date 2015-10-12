var express = require('express');
var router = express.Router();

router.use('/portal', require('./portal'));
router.use('/posts', require('./post'));

module.exports = router;
