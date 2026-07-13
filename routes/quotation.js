const express = require('express');
const router = express.Router();
const quotationController = require('../controller/quotation');

// Route to generate and download the quotation PDF (POST to accept data)
router.post('/generate', quotationController.generateQuotation);

module.exports = router;