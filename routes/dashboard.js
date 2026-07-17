const express = require("express");
const router = express.Router();
const {
    getDashboard,
    getRevenueChart,
    getKwGrowthChart,
    getFollowupAnalysis,
} = require("../controller/dashboard");
const authMiddleware = require("../middleware/auth");
const { dashboardReadScope } = require("../middleware/permissions");

router.get("/", authMiddleware, dashboardReadScope(), getDashboard);
router.get("/revenue", authMiddleware, dashboardReadScope(), getRevenueChart);
router.get("/kw-growth", authMiddleware, dashboardReadScope(), getKwGrowthChart);
router.get("/followup-analysis", authMiddleware, dashboardReadScope(), getFollowupAnalysis);

module.exports = router;