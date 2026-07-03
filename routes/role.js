var express = require("express");
var router = express.Router();
let {
  createRole,
  fetchAllRoles,
  fetchRoleById,
  roleUpdate,
  roleDelete
} = require("../controller/role");
let authMiddleware = require("../middleware/auth");
const { authorize } = require("../middleware/permissions");

router.post("/", authMiddleware, authorize("role", "create"), createRole);
router.get("/", authMiddleware, fetchAllRoles);
router.get(
  "/:id",
  authMiddleware,
  authorize("role", "readAll"),
  fetchRoleById,
);
router.put("/:id", authMiddleware, authorize("role", "update"), roleUpdate);
router.delete(
  "/:id",
  authMiddleware,
  authorize("role", "delete"),
  roleDelete,
);

module.exports = router;
