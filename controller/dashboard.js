const Lead = require("../model/lead");
const LeadStatus = require("../model/leadStatus");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Kolkata");
const User = require("../model/user");
const Staff = require("../model/staff");

exports.getDashboard = async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const now = dayjs();

        let startDate = null;
        let endDate = null;

        if (range === "today") {
            startDate = now.startOf("day").toDate();
            endDate = now.endOf("day").toDate();
        } else if (range === "thisMonth") {
            startDate = now.startOf("month").toDate();
            endDate = now.endOf("month").toDate();
        } else if (range === "previousMonth") {
            const prevMonth = now.subtract(1, "month");
            startDate = prevMonth.startOf("month").toDate();
            endDate = prevMonth.endOf("month").toDate();
        } else if (range === "thisYear") {
            startDate = now.startOf("year").toDate();
            endDate = now.endOf("year").toDate();
        } else if (range === "custom" && from && to) {
            startDate = dayjs(from).startOf("day").toDate();
            endDate = dayjs(to).endOf("day").toDate();
        }

        // ---------- Role detection ----------
        const roleName = (req.user?.role?.roleName || "").toUpperCase();
        const userId = req.user._id;

        let userScope = "admin";
        if (roleName.includes("SALES")) {
            userScope = "sales";
        } else if (roleName.includes("CALLING")) {
            userScope = "calling";
        } else if (roleName.includes("SUPER ADMIN") || roleName.includes("ADMIN")) {
            userScope = "admin";
        }

        // ---------- Base filter ----------
        // Use $ne: false instead of true to match lead list behavior
        // (includes leads where isActive is not set / null / undefined)
        const filter = { isActive: { $ne: false } };
        if (startDate && endDate) {
            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (userScope === "sales" || userScope === "calling") {
            filter.$or = [{ assignedTo: userId }, { createdBy: userId }];
        }

        // ---------- Fetch data ----------
        const leads = await Lead.find(filter)
            .populate("leadStatus", "name")
            .populate("assignedTo", "fullName");

        const allStatuses = await LeadStatus.find({}, "name");

        let totalLeads = leads.length;
        let totalNewLeads = 0;
        let totalWonLeads = 0;
        let totalLostLeads = 0;
        let followUps = 0;
        let totalRevenue = 0;

        const statusCountMap = {};
        const sourceCountMap = {};

        allStatuses.forEach((s) => {
            statusCountMap[s.name] = 0;
        });

        // const allUsers = await Staff.find({ status: "active" }, "fullName role ").populate("role", "roleName");
        // const salesDeptUsers = allUsers.filter((u) => {
        //     const roleName = (u.role?.roleName || "").toUpperCase();
        //     return roleName.includes("SALES")
        // });

        const allUsers = await Staff.find({ status: "active" }, "fullName role").populate("role", "roleName");
        const salesDeptUsers = allUsers.filter((u) =>
            (u.role?.roleName || "").toUpperCase().includes("SALES")
        );

        // const assignmentMap = {};
        // salesDeptUsers.forEach((u) => {
        //     assignmentMap[u.fullName] = { newLead: 0, won: 0, lost: 0, total: 0 };
        // });

        const assignmentMap = {};
        const staffIdToName = {};
        salesDeptUsers.forEach((u) => {
            const id = String(u._id);
            assignmentMap[id] = { newLead: 0, won: 0, lost: 0, total: 0 };
            staffIdToName[id] = (u.fullName || "").trim();
        });

        // leads.forEach((lead) => {
        //     const statusName = lead.leadStatus?.name || "Unknown";
        //     const source = lead.leadrefrance || "Unknown";
        //     const salesName = lead.assignedTo?.fullName || "Unassigned";

        //     statusCountMap[statusName] = (statusCountMap[statusName] || 0) + 1;
        //     sourceCountMap[source] = (sourceCountMap[source] || 0) + 1;

        //     const status = statusName.toLowerCase().trim();

        //     if (assignmentMap[salesName]) {
        //         assignmentMap[salesName].total++;
        //         if (status === "new lead") assignmentMap[salesName].newLead++;
        //         else if (status === "won") assignmentMap[salesName].won++;
        //         else if (status === "lost") assignmentMap[salesName].lost++;
        //     }

        //     if (status === "new lead") totalNewLeads++;
        //     else if (status === "won") totalWonLeads++;
        //     else if (status === "lost") totalLostLeads++;

        //     if (lead.nextFollowupDate) followUps++;

        //     if (lead.payments && lead.payments.length > 0) {
        //         lead.payments.forEach((p) => {
        //             totalRevenue += p.amount || 0;
        //         });
        //     }
        // });

        leads.forEach((lead) => {
            const statusName = lead.leadStatus?.name || "Unknown";
            const source = lead.leadrefrance || "Unknown";
            const assignedId = lead.assignedTo?._id ? String(lead.assignedTo._id) : null;

            statusCountMap[statusName] = (statusCountMap[statusName] || 0) + 1;
            sourceCountMap[source] = (sourceCountMap[source] || 0) + 1;

            const status = statusName.toLowerCase().trim();
            if (assignedId && assignmentMap[assignedId]) {
                assignmentMap[assignedId].total++;
                if (status === "new lead") assignmentMap[assignedId].newLead++;
                else if (status === "won") assignmentMap[assignedId].won++;
                else if (status === "lost") assignmentMap[assignedId].lost++;
            }

            if (status === "new lead") totalNewLeads++;
            else if (status === "won") totalWonLeads++;
            else if (status === "lost") totalLostLeads++;

            if (
                lead.nextFollowupDate &&
                status !== "won" &&  // "Upcoming Follow-ups" list Won leads exclude 
                dayjs(lead.nextFollowupDate).tz("Asia/Kolkata").isAfter(dayjs().tz("Asia/Kolkata"))
            ) {
                followUps++;
            }
            if (lead.payments?.length) lead.payments.forEach((p) => (totalRevenue += p.amount || 0));
        });


        const leadStatus = Object.entries(statusCountMap).map(([status, count]) => ({
            status,
            count,
        }));

        const leadSource = Object.entries(sourceCountMap).map(([source, count]) => ({
            source,
            count,
        }));

        // const salesExecutive = Object.entries(assignmentMap).map(([salesName, data]) => ({
        //     salesName,
        //     ...data,
        //     total: data.total || 0,
        // }));
        const salesExecutive = Object.entries(assignmentMap).map(([id, data]) => ({
            salesName: staffIdToName[id],
            ...data,
        }));


        // Total leads for salesExecutive section = sum of all sales exec leads
        // const salesExecutiveTotalLeads = salesExecutive.reduce((sum, s) => sum + (s.total || 0), 0);

        const counts = {
            totalLeads,
            totalNewLeads,
            totalWonLeads,
            totalLostLeads,
            followUps,
            totalRevenue,
        };

        const charts = {};

        if (userScope === "admin") {
            charts.salesExecutive = salesExecutive;
            // charts.salesExecutiveTotalLeads = salesExecutiveTotalLeads;
            charts.leadStatus = leadStatus;
        } else if (userScope === "sales") {
            charts.leadStatus = leadStatus;
        } else if (userScope === "calling") {
            charts.leadSource = leadSource;
            charts.leadAssignment = salesExecutive;
            // charts.leadAssignmentTotalLeads = salesExecutiveTotalLeads;
            charts.leadStatus = leadStatus;
        }

        res.status(200).json({
            status: "Success",
            data: { counts, charts },
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---------- Shared helper: resolve role scope + base filter ----------
function getScopeFilter(req) {
    const roleName = (req.user?.role?.roleName || "").toUpperCase();
    const userId = req.user._id;

    let userScope = "admin";
    if (roleName.includes("SALES")) {
        userScope = "sales";
    } else if (roleName.includes("CALLING")) {
        userScope = "calling";
    }

    const filter = { isActive: true };
    if (userScope === "sales" || userScope === "calling") {
        filter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }
    return filter;
}

// ---------- Shared helper: resolve date range (global filter OR year) ----------
function resolveDateRange(req) {
    const { range, from, to, year } = req.query;
    const now = dayjs().tz("Asia/Kolkata");
    const selectedYear = year ? parseInt(year) : now.year();

    let startDate, endDate;

    if (range === "today") {
        startDate = now.startOf("day").toDate();
        endDate = now.endOf("day").toDate();
    } else if (range === "thisMonth") {
        startDate = now.startOf("month").toDate();
        endDate = now.endOf("month").toDate();
    } else if (range === "previousMonth") {
        const prevMonth = now.subtract(1, "month");
        startDate = prevMonth.startOf("month").toDate();
        endDate = prevMonth.endOf("month").toDate();
    } else if (range === "thisYear") {
        startDate = now.startOf("year").toDate();
        endDate = now.endOf("year").toDate();
    } else if (range === "custom" && from && to) {
        startDate = dayjs(from).startOf("day").toDate();
        endDate = dayjs(to).endOf("day").toDate();
    } else {
        // Default: use the "year" param (chart's own year filter)
        startDate = dayjs(`${selectedYear}-01-01`).startOf("year").toDate();
        endDate = dayjs(`${selectedYear}-12-31`).endOf("year").toDate();
    }

    return { startDate, endDate, selectedYear };
}

// ---------- Shared helper: trim future months for current year ----------
function trimFutureMonths(chartArray, selectedYear) {
    const now = dayjs();
    if (selectedYear === now.year()) {
        // current year hoy to fakt current month sudhi j rakho, future months hata do
        return chartArray.slice(0, now.month() + 1);
    } else if (selectedYear > now.year()) {
        // future year hoy to koi month nathi (badhu future che)
        return [];
    }
    // past year hoy to badha 12 months rakho
    return chartArray;
}

// TOTAL REVENUE CHART (month-wise total)

exports.getRevenueChart = async (req, res) => {
    try {
        const filter = getScopeFilter(req);
        const { startDate, endDate, selectedYear } = resolveDateRange(req);

        const leads = await Lead.find(filter);

        const monthlyRevenue = Array(12).fill(0);

        leads.forEach((lead) => {
            if (lead.payments && lead.payments.length > 0) {
                lead.payments.forEach((p) => {
                    if (!p.date) return;
                    const pDate = dayjs(p.date);
                    if (
                        (pDate.isAfter(dayjs(startDate)) || pDate.isSame(dayjs(startDate))) &&
                        (pDate.isBefore(dayjs(endDate)) || pDate.isSame(dayjs(endDate)))
                    ) {
                        monthlyRevenue[pDate.month()] += p.amount || 0;
                    }
                });
            }
        });

        const chart = trimFutureMonths(
            MONTH_NAMES.map((month, i) => ({ month, revenue: monthlyRevenue[i] })),
            selectedYear
        );
        const totalRevenue = monthlyRevenue.reduce((a, b) => a + b, 0);

        res.status(200).json({
            status: "Success",
            data: { year: selectedYear, totalRevenue, chart },
        });
    } catch (error) {
        console.error("Revenue Chart API Error:", error);
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};

// TOTAL KW GROWTH CHART (month-wise total, based on lead createdAt)

exports.getKwGrowthChart = async (req, res) => {
    try {
        const filter = getScopeFilter(req);
        const { startDate, endDate, selectedYear } = resolveDateRange(req);

        filter.createdAt = { $gte: startDate, $lte: endDate };

        const wonStatus = await LeadStatus.findOne({ name: "Won" });
        if (wonStatus) {
            filter.leadStatus = wonStatus._id;
        }

        const leads = await Lead.find(filter);

        const monthlyKw = Array(12).fill(0);

        leads.forEach((lead) => {
            if (lead.kwRequirement) {
                const kwValue = parseFloat(lead.kwRequirement);
                if (!isNaN(kwValue)) {
                    const createdMonth = dayjs(lead.createdAt).month();
                    monthlyKw[createdMonth] += kwValue;
                }
            }
        });

        const chart = trimFutureMonths(
            MONTH_NAMES.map((month, i) => ({ month, kw: monthlyKw[i] })),
            selectedYear
        );
        const totalKwGrowth = monthlyKw.reduce((a, b) => a + b, 0);

        res.status(200).json({
            status: "Success",
            data: { year: selectedYear, totalKwGrowth, chart },
        });
    } catch (error) {
        console.error("KW Growth Chart API Error:", error);
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};

// FOLLOW-UP ANALYSIS CHART (month-wise completed vs upcoming)

exports.getFollowupAnalysis = async (req, res) => {
    try {
        const filter = getScopeFilter(req);
        const { startDate, endDate, selectedYear } = resolveDateRange(req);

        const leads = await Lead.find(filter);

        const completedByMonth = Array(12).fill(0);
        const upcomingByMonth = Array(12).fill(0);
        const now = dayjs();

        leads.forEach((lead) => {
            if (lead.followUps && lead.followUps.length > 0) {
                lead.followUps.forEach((f) => {
                    if (!f.date) return;
                    const fDate = dayjs(f.date);
                    if (
                        (fDate.isAfter(dayjs(startDate)) || fDate.isSame(dayjs(startDate))) &&
                        (fDate.isBefore(dayjs(endDate)) || fDate.isSame(dayjs(endDate)))
                    ) {
                        const month = fDate.month();
                        if (fDate.isBefore(now)) {
                            completedByMonth[month]++;
                        } else {
                            upcomingByMonth[month]++;
                        }
                    }
                });
            }
        });

        const chart = trimFutureMonths(
            MONTH_NAMES.map((month, i) => ({
                month,
                completed: completedByMonth[i],
                upcoming: upcomingByMonth[i],
            })),
            selectedYear
        );

        res.status(200).json({
            status: "Success",
            data: { year: selectedYear, chart },
        });
    } catch (error) {
        console.error("Follow-up Analysis API Error:", error);
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};