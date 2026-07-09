const ProjectDetail = require("../model/projectDetail");
const Lead = require("../model/lead");
const { uploadToExternalService } = require("../utils/externalUploader");

// ── Helpers ─────────────────────────────────────────────────────────────────
const fileField = (file, url) => {
  if (!file) return undefined;
  return {
    originalName: file.originalname,
    filename: file.filename || file.originalname,
    path: file.path || "",
    url: url || file.url || (file.path ? `/${file.path}` : ""),
  };
};

// ── Create or Update Project Detail ─────────────────────────────────────────
exports.upsertProjectDetail = async (req, res) => {
  try {
    const { leadId } = req.params;

    // Make sure the lead exists and is Won
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ status: "Error", message: "Lead not found" });
    }

    // Parse body (text fields)
    const {
      creatorName, panelMake, panelWp, noOfPanel,
      inverterMake, inverterKw, inverterPhase, installationRoof,
      discom, consumerConnectionType, elcbInstalled, elcbProvideBy,
      wiringType, homeFloor, walkway, walkwayLengthFeet,
      ladder, ladderLengthFeet, hdgiPipeMake,
      hdgiPipe80x40, hdgiPipe60x40, hdgiPipe40x40, hdgiPipe20x40PatiPipe,
      paymentMode, projectAmount, subsidyLessProject,
    } = req.body;

    // Map uploaded files by fieldname
    const files = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f) => {
        files[f.fieldname] = f;
      });
    }

    const update = {
      lead: leadId,
      creatorName, panelMake,
      panelWp: panelWp ? Number(panelWp) : undefined,
      noOfPanel: noOfPanel ? Number(noOfPanel) : undefined,
      inverterMake,
      inverterKw: inverterKw ? Number(inverterKw) : undefined,
      inverterPhase, installationRoof, discom,
      consumerConnectionType, elcbInstalled, elcbProvideBy,
      wiringType, homeFloor, walkway,
      walkwayLengthFeet: walkwayLengthFeet ? Number(walkwayLengthFeet) : undefined,
      ladder,
      ladderLengthFeet: ladderLengthFeet ? Number(ladderLengthFeet) : undefined,
      hdgiPipeMake,
      hdgiPipe80x40: hdgiPipe80x40 !== undefined ? Number(hdgiPipe80x40) : undefined,
      hdgiPipe60x40: hdgiPipe60x40 !== undefined ? Number(hdgiPipe60x40) : undefined,
      hdgiPipe40x40: hdgiPipe40x40 !== undefined ? Number(hdgiPipe40x40) : undefined,
      hdgiPipe20x40PatiPipe: hdgiPipe20x40PatiPipe !== undefined ? Number(hdgiPipe20x40PatiPipe) : undefined,
      paymentMode, subsidyLessProject,
      projectAmount: projectAmount ? Number(projectAmount) : undefined,
      createdBy: req.user?._id,
    };

    // File fields
    const fileFieldMap = {
      photoTerraceLayout: "photoTerraceLayout",
      photoPanelLayout: "photoPanelLayout",
      photoSolarInstallation: "photoSolarInstallation",
      photoInverterLocation: "photoInverterLocation",
      photoEarthingLocation: "photoEarthingLocation",
      photoMeterBox: "photoMeterBox",
      docLatestLightBill: "docLatestLightBill",
      docLatestTaxBill: "docLatestTaxBill",
      docCancelCheck: "docCancelCheck",
      docPanCard: "docPanCard",
      docAadhaarCard: "docAadhaarCard",
      loanDocQuotation: "loanDocQuotation",
      loanDocBankStatement: "loanDocBankStatement",
      loanDocITRReturn: "loanDocITRReturn",
      loanDocPanCard: "loanDocPanCard",
      loanDocAadhaarCard: "loanDocAadhaarCard",
    };

    // Upload each file to external service
    for (const [reqField, modelField] of Object.entries(fileFieldMap)) {
      if (files[reqField]) {
        const fileUrl = await uploadToExternalService(files[reqField], 'ProjectDetail');
        update[modelField] = fileField(files[reqField], fileUrl);
      }
    }

    // Remove undefined keys so we don't overwrite existing data with undefined
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const detail = await ProjectDetail.findOneAndUpdate(
      { lead: leadId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    ).populate("lead", "fullName contact email");

    return res.status(200).json({
      status: "Success",
      message: "Project details saved successfully",
      data: detail,
    });
  } catch (error) {
    console.error("upsertProjectDetail error:", error);
    return res.status(500).json({ status: "Error", message: error.message });
  }
};

// ── Get Project Detail by Lead ID ────────────────────────────────────────────
exports.getProjectDetail = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { qIdx, optIdx = '0' } = req.query;

    const detail = await ProjectDetail.findOne({ lead: leadId }).populate(
      "lead",
      "fullName contact email quotations"
    );

    if (detail) {
      return res.status(200).json({ status: "Success", data: detail });
    }

    // If no project detail found, try to auto-extract from the latest or selected quotation
    const lead = await Lead.findById(leadId).populate('createdBy assignedTo');
    if (!lead || !lead.quotations || lead.quotations.length === 0) {
      return res.status(200).json({ status: "Success", data: null });
    }

    const quotationIndex = qIdx !== undefined ? parseInt(qIdx, 10) : lead.quotations.length - 1;
    const selectedQ = lead.quotations[quotationIndex];
    if (!selectedQ) {
      return res.status(200).json({ status: "Success", data: null });
    }

    const optionIndex = parseInt(optIdx, 10);

    const getValByKeywords = (keywords) => {
      const row = (selectedQ.rows || []).find((r) => {
        const title = (r.title || '').toUpperCase();
        return keywords.some(kw => title.includes(kw));
      });
      return row?.values?.[optionIndex] || '';
    };

    const panelMake = getValByKeywords(['SOLAR MODULE MAKE', 'PANEL MAKE', 'MODULE MAKE', 'PANEL BRAND', 'MODULE BRAND', 'MODULE COMPANY']);
    const panelWp = getValByKeywords(['SYSTEM CAPACITY', 'PANEL WP', 'WATTAGE', 'PANEL CAPACITY']);
    const noOfPanel = getValByKeywords(['NO OF PANEL', 'NO. OF PANELS', 'PANEL COUNT', 'PANEL QTY', 'PANEL QUANTITY']);
    const inverterMake = getValByKeywords(['INVERTER MAKE', 'INVERTER BRAND', 'INVERTER COMPANY', 'INVERTER']);
    const inverterKw = getValByKeywords(['INVERTER KW', 'INVERTER CAPACITY', 'INVERTER SIZE', 'KW']);
    const discom = getValByKeywords(['DISCOM', 'DISCOM NAME']);
    const roof = getValByKeywords(['ROOF', 'ROOF TYPE', 'INSTALLATION ROOF']);
    const connType = getValByKeywords(['CONNECTION', 'CONNECTION TYPE']);
    const wiringType = getValByKeywords(['WIRING', 'WIRING TYPE']);
    const homeFloor = getValByKeywords(['FLOOR', 'HOME FLOOR']);
    const hdgiPipeMake = getValByKeywords(['PIPE MAKE', 'PIPE BRAND', 'HDGI PIPE', 'HDGI']);
    const projectAmount = getValByKeywords(['CUSTOMER PAYABLE AMOUNT', 'PROJECT AMOUNT', 'TOTAL PRICE', 'PAYABLE AMOUNT', 'AMOUNT']);

    const finalPanelMake = panelMake || selectedQ.solarModule || '';
    const finalInverterMake = inverterMake || selectedQ.inverter || '';

    const autoFillData = {
      lead: {
        _id: lead._id,
        fullName: lead.fullName,
        contact: lead.contact,
        email: lead.email,
        quotations: lead.quotations
      },
      creatorName: lead.createdBy?.fullName || lead.assignedTo?.fullName || undefined,
      panelMake: finalPanelMake,
      panelWp: panelWp ? Number(panelWp) : undefined,
      noOfPanel: noOfPanel ? Number(noOfPanel) : undefined,
      inverterMake: finalInverterMake,
      inverterKw: inverterKw ? Number(inverterKw) : undefined,
      discom: discom ? discom.toLowerCase() : undefined,
      installationRoof: roof ? roof.toLowerCase() : undefined,
      consumerConnectionType: connType ? connType.toLowerCase() : undefined,
      wiringType: wiringType ? wiringType.toLowerCase() : undefined,
      homeFloor,
      hdgiPipeMake,
      projectAmount: projectAmount ? Number(projectAmount) : undefined,
    };

    return res.status(200).json({ status: "Success", data: autoFillData });
  } catch (error) {
    console.error("getProjectDetail error:", error);
    return res.status(500).json({ status: "Error", message: error.message });
  }
};
