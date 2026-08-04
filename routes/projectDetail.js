var express = require("express");
var router = express.Router();
const createUploader = require("../utils/multer");
const authMiddleware = require("../middleware/auth");
const { authorize } = require("../middleware/permissions");
const { upsertProjectDetail, getProjectDetail } = require("../controller/projectDetail");

// Allow any named file fields (photos, reg docs, loan docs, payment docs)
const upload = createUploader("images/ProjectDetail");
const fileFields = upload.any();

// POST /v1/api/project-detail/:leadId  – create or update
router.post(
  "/:leadId",
  authMiddleware,
  authorize("lead", "update"),
  fileFields,
  upsertProjectDetail
);

// GET /v1/api/project-detail/:leadId  – fetch
router.get("/:leadId", authMiddleware, getProjectDetail);

module.exports = router;
