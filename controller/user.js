const USER = require("../model/user");
const { encryptData, decryptData } = require("../utils/crypto");
const { deleteUploadedFile } = require("../utils/fileHelper");
const jwt = require("jsonwebtoken");

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, department, status } = req.body;

    const encryptedPassword = encryptData(password);

    const userData = {
      profileImage: req.file ? req.file.filename : null,
      fullName,
      email,
      phone,
      password: encryptedPassword,
      status: status || "active",
      department: department,
    };

    const UserDetails = await USER.create(userData);

    return res.status(201).json({
      status: "Success",
      message: "User created successfully",
      data: UserDetails,
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("images/UserProfileImages", req.file.filename);
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
    let userverify = await USER.findOne({ email });
    if (!userverify) {
      throw new Error("Invalid Email or password");
    }
    let decryptedPassword = decryptData(userverify.password);

    if (String(decryptedPassword) !== password) {
      throw new Error("Invalid password");
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

    const totalUsers = await USER.countDocuments(query);
    const usersData = await USER.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("department");
   

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
    let userData = await USER.findById(userId).populate("department");
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
    let userID = req.params.id;
    let oldUser = await USER.findById(userID);

    if (!oldUser) {
      throw new Error("User not found");
    }

    if (req.body.password) {
      req.body.password = encryptData(req.body.password);
    }

    if (req.file) {
      deleteUploadedFile("images/UserProfileImages", oldUser.profileImage);
      req.body.profileImage = req.file.filename;
    }

    let updatedUser = await USER.findByIdAndUpdate(userID, req.body, {
      new: true,
    });
    return res.status(200).json({
      status: "Success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("images/UserProfileImages", req.file.filename);
    }
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.userDelete = async (req, res) => {
  try {
    let userID = req.params.id;
    let oldUser = await USER.findById(userID);

    if (!oldUser) {
      throw new Error("User not found");
    }
    if (oldUser.profileImage) {
      deleteUploadedFile("images/UserProfileImages", oldUser.profileImage);
    }
    await USER.findByIdAndDelete(userID);

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
