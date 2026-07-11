const express = require("express");
const router = express.Router();
const {
    getDashboard,
    getRevenueChart,
    getKwGrowthChart,
    getFollowupAnalysis,
} = require("../controller/dashboard");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, getDashboard);
router.get("/revenue", authMiddleware, getRevenueChart);
router.get("/kw-growth", authMiddleware, getKwGrowthChart);
router.get("/followup-analysis", authMiddleware, getFollowupAnalysis);

module.exports = router;