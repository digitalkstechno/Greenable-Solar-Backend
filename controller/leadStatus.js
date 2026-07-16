const LEADSTATUS = require("../model/leadStatus");
const LEAD = require("../model/lead");

exports.createLeadStatus = async (req, res) => {
  try {
    let leadStatusCreate = req.body;
    if (!leadStatusCreate.name) {
      return res.status(400).json({ status: "Fail", message: "Name is required" });
    }
    const existing = await LEADSTATUS.findOne({
      name: { $regex: new RegExp(`^${leadStatusCreate.name.trim()}$`, "i") }
    });
    if (existing) {
      return res.status(400).json({
        status: "Fail",
        message: "Lead status with this name already exists"
      });
    }
    let newLeadStatus = await LEADSTATUS.create(leadStatusCreate);
    res.status(201).json({
      status: "Success",
      data: newLeadStatus,
    });
  } catch (error) {
    res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllLeadStatus = async (req, res) => {
  try {

    const allStatuses = await LEADSTATUS.find();
    // for (const status of allStatuses) {
    //   const actualCount = await LEAD.countDocuments({ leadStatus: status._id });
    //   await LEADSTATUS.findByIdAndUpdate(status._id, { count: actualCount });
    // }

    // Get counts for ALL statuses in a single aggregation query
    const countsAgg = await LEAD.aggregate([
      { $group: { _id: "$leadStatus", count: { $sum: 1 } } },
    ]);

    // Build a quick lookup map: statusId -> count
    const countMap = {};
    countsAgg.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    // Prepare bulk update operations (only for statuses whose count actually changed)
    const bulkOps = allStatuses
      .filter((status) => (status.count || 0) !== (countMap[status._id.toString()] || 0))
      .map((status) => ({
        updateOne: {
          filter: { _id: status._id },
          update: { count: countMap[status._id.toString()] || 0 },
        },
      }));

    if (bulkOps.length > 0) {
      await LEADSTATUS.bulkWrite(bulkOps);
    }

    const search = req.query.search || "";

    const query = {
      $or: [{ name: { $regex: search, $options: "i" } }],
    };

    // check if pagination params exist
    const hasPagination = req.query.page || req.query.limit;

    if (hasPagination) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalStatus = await LEADSTATUS.countDocuments(query);

      const StatusData = await LEADSTATUS.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ order: 1 });

      return res.status(200).json({
        status: "Success",
        message: "Leads Status fetched successfully",
        pagination: {
          totalRecords: totalStatus,
          currentPage: page,
          totalPages: Math.ceil(totalStatus / limit),
          limit,
        },
        data: StatusData,
      });
    } else {
      // 👉 No pagination → return all data
      const StatusData = await LEADSTATUS.find(query).sort({ order: 1 });

      return res.status(200).json({
        status: "Success",
        message: "All Leads Status fetched successfully",
        data: StatusData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchLeadStatusById = async (req, res) => {
  try {
    let StatusId = req.params.id;
    let StatusData = await LEADSTATUS.findById(StatusId);
    if (!StatusData) {
      throw new Error("Lead Status not found");
    }
    return res.status(200).json({
      status: "Success",
      message: "Lead Status fetched successfully",
      data: StatusData,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.LeadStatusUpdate = async (req, res) => {
  try {
    let StatusId = req.params.id;
    let oldLeadStatus = await LEADSTATUS.findById(StatusId);
    if (!oldLeadStatus) {
      throw new Error("Lead Status not found");
    }
    if (req.body.name) {
      const existing = await LEADSTATUS.findOne({
        name: { $regex: new RegExp(`^${req.body.name.trim()}$`, "i") },
        _id: { $ne: StatusId }
      });
      if (existing) {
        return res.status(400).json({
          status: "Fail",
          message: "Lead status with this name already exists"
        });
      }
    }
    let updatedStatus = await LEADSTATUS.findByIdAndUpdate(StatusId, req.body, {
      new: true,
    });
    return res.status(200).json({
      status: "Success",
      message: "Lead Status updated successfully",
      data: updatedStatus,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.LeadStatusDelete = async (req, res) => {
  try {
    let StatusId = req.params.id;
    let oldLeadStatus = await LEADSTATUS.findById(StatusId);

    if (!oldLeadStatus) {
      throw new Error("Lead Status not found");
    }
    const deletedOrder = oldLeadStatus.order;
    await LEADSTATUS.findByIdAndDelete(StatusId);

    if (typeof deletedOrder === 'number') {
      await LEADSTATUS.updateMany(
        { order: { $gt: deletedOrder } },
        { $inc: { order: -1 } }
      );
    }

    return res.status(200).json({
      status: "Success",
      message: "Lead Status deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.setupDefaultLeadStatuses = async () => {
  try {
    const defaultStatuses = [
      { name: "New Lead", order: 1 },
      { name: "Won", order: 2 },
      { name: "Lost", order: 3 },
    ];

    for (const status of defaultStatuses) {
      const existingStatus = await LEADSTATUS.findOne({ name: status.name });
      if (!existingStatus) {
        await LEADSTATUS.create(status);
      }
    }
  } catch (error) {
    console.error("Error setting up default lead statuses:", error);
  }
};