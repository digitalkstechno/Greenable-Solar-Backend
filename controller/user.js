const STAFF = require("../model/staff");
const { encryptData, decryptData } = require("../utils/crypto");
const { deleteUploadedFile } = require("../utils/fileHelper");
const { uploadToExternalService, deleteFileFromExternalService } = require("../utils/externalUploader");
const jwt = require("jsonwebtoken");

exports.createUser = async (req, res) => {
  let profileImage = null;
  try {
    const { fullName, email, phone, role, password, status } = req.body;

    const parseIds = (val) => {
      if (!val) return [];
      try { return JSON.parse(val); } catch { return Array.isArray(val) ? val : [val]; }
    };

    const encryptedPassword = encryptData(password);

    if (req.file) {
      profileImage = await uploadToExternalService(req.file, "StaffProfileImages");
    }

    const userData = {
      profileImage,
      fullName,
      email,
      phone,
      role,
      status: status || "active",
      password: encryptedPassword,
      teams: parseIds(req.body.teams),
      organizations: parseIds(req.body.organizations),
    };

    const userDetails = await STAFF.create(userData);

    return res.status(201).json({
      status: "Success",
      message: "User created successfully",
      data: userDetails,
    });
  } catch (error) {
    if (profileImage) {
      await deleteFileFromExternalService(profileImage).catch(console.error);
    } else if (req.file && req.file.filename) {
      deleteUploadedFile("images/StaffProfileImages", req.file.filename);
    }
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: "Fail",
        message: `A user with this ${duplicateField} already exists.`,
      });
    }

    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    let userverify = await STAFF.findOne({ email }).populate("role").populate("teams").populate("organizations");
    if (!userverify) {
      throw new Error("Invalid Email or password");
    }
    let decryptedPassword = decryptData(userverify.password);

    if (String(decryptedPassword) !== password) {
      throw new Error("Invalid password");
    }

    if (userverify.status && userverify.status.toLowerCase() === "inactive") {
      return res.status(403).json({
        status: "Fail",
        message: "Your account is inactive. Please contact the administrator.",
      });
    }

    let token = jwt.sign({ id: userverify._id }, process.env.JWT_SECRET_KEY);
    return res.status(200).json({
      status: "Success",
      message: "User logged in successfully",
      data: userverify,
      token,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const query = {
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ],
    };

    const totalUsers = await STAFF.countDocuments(query);
    const usersData = await STAFF.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("role")
      .populate("teams")
      .populate("organizations");

    return res.status(200).json({
      status: "Success",
      message: "Users fetched successfully",
      pagination: {
        totalRecords: totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        limit,
      },
      data: usersData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchUserById = async (req, res) => {
  try {
    let userId = req.params.id;
    let userData = await STAFF.findById(userId).populate("role").populate("teams").populate("organizations");
    if (!userData) {
      throw new Error("User not found");
    }
    return res.status(200).json({
      status: "Success",
      message: "User fetched successfully",
      data: userData,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "Fail",
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      status: "Success",
      data: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.userUpdate = async (req, res) => {
  try {
    let userId = req.params.id;
    let oldUser = await STAFF.findById(userId);

    if (!oldUser) {
      throw new Error("User not found");
    }

    const parseIds = (val) => {
      if (!val) return [];
      try { return JSON.parse(val); } catch { return Array.isArray(val) ? val : [val]; }
    };

    if (req.body.teams !== undefined) req.body.teams = parseIds(req.body.teams);
    if (req.body.organizations !== undefined) req.body.organizations = parseIds(req.body.organizations);

    if (req.body.password) {
      req.body.password = encryptData(req.body.password);
    }

    if (req.file) {
      if (oldUser.profileImage && oldUser.profileImage.startsWith('http')) {
        await deleteFileFromExternalService(oldUser.profileImage).catch(console.error);
      } else if (oldUser.profileImage) {
        deleteUploadedFile("images/StaffProfileImages", oldUser.profileImage);
      }
      req.body.profileImage = await uploadToExternalService(req.file, "StaffProfileImages");
    }

    let updatedUser = await STAFF.findByIdAndUpdate(userId, req.body, {
      new: true,
    });
    return res.status(200).json({
      status: "Success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (req.file && req.body.profileImage && req.body.profileImage.startsWith('http')) {
      await deleteFileFromExternalService(req.body.profileImage).catch(console.error);
    } else if (req.file && req.file.filename) {
      deleteUploadedFile("images/StaffProfileImages", req.file.filename);
    }
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: "Fail",
        message: `A user with this ${duplicateField} already exists.`,
      });
    }

    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.userDelete = async (req, res) => {
  try {
    let userId = req.params.id;
    let oldUser = await STAFF.findById(userId);

    if (!oldUser) {
      throw new Error("User not found");
    }
    if (oldUser.profileImage && oldUser.profileImage.startsWith('http')) {
      await deleteFileFromExternalService(oldUser.profileImage).catch(console.error);
    } else if (oldUser.profileImage) {
      deleteUploadedFile("images/StaffProfileImages", oldUser.profileImage);
    }
    await STAFF.findByIdAndDelete(userId);

    return res.status(200).json({
      status: "Success",
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};
