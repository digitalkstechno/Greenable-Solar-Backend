const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileSchema = new Schema(
  {
    originalName: String,
    filename: String,
    path: String,
    url: String,
  },
  { _id: false }
);

const ProjectDetailSchema = new Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      unique: true,
    },

    // ── Project Details ──────────────────────────────────────────────────────
    projectCode: { type: String },
    srNo: { type: String },
    salesPersonName: { type: String },
    creatorName: { type: String },
    customerFullName: { type: String },
    registerMobileNumber: { type: String },
    locationLink: { type: String },
    address: { type: String },
    city: { type: String },
    pincode: { type: String },
    consumerNo: { type: String },
    division: { type: String },
    subDivision: { type: String },
    registrationPortal: { type: String },
    panelType: { type: String },
    panelMake: { type: String },
    panelWp: { type: Number },
    noOfPanel: { type: Number },
    totalKw: { type: Number },
    inverterMake: { type: String },
    inverterKw: { type: Number },
    inverterPhase: { type: String },
    installationRoof: { type: String },
    discom: { type: String },
    consumerConnectionType: { type: String },
    elcbInstalled: { type: String },
    elcbProvideBy: { type: String },
    wiringType: { type: String },
    homeFloor: { type: String },
    walkway: { type: String },
    walkwayLengthFeet: { type: Number },
    ladder: { type: String },
    ladderLengthFeet: { type: Number },
    hdgiPipeMake: { type: String },

    // HDGI Pipe sizes (in feet, 00 = acceptable)
    hdgiPipe80x40: { type: Number, default: 0 },
    hdgiPipe60x40: { type: Number, default: 0 },
    hdgiPipe40x40: { type: Number, default: 0 },
    hdgiPipe20x40PatiPipe: { type: Number, default: 0 },

    // ── Registration & Feasibility ──────────────────────────────────────────
    meterChargeAmount: { type: Number },
    meterChargePayableBy: { type: String },
    registrationDate: { type: String },
    registrationNo: { type: String },
    registrationName: { type: String },
    documentFeasibilityDate: { type: String },
    registrationDone: { type: String },
    meterPaymentDone: { type: String },

    // ── Bank and Payment Details ──────────────────────────────────────────────
    bankName: { type: String },
    accountNo: { type: String },
    ifscCode: { type: String },
    branchName: { type: String },
    accountHolderName: { type: String },

    // ── Required Photos for Installation ────────────────────────────────────
    photoTerraceLayout: fileSchema,
    photoPanelLayout: fileSchema,
    photoSolarInstallation: fileSchema,
    photoInverterLocation: fileSchema,
    photoEarthingLocation: fileSchema,
    photoMeterBox: fileSchema,

    // Image 1: Required Photos for Installation
    photoSiteOverview: fileSchema,
    photoPanelSrNo: fileSchema,
    photoInverterSrNo: fileSchema,
    photoPanelPlacement: fileSchema,
    photoMountingStructure: fileSchema,
    photoInverterInstalled: fileSchema,
    photoAcdbDcdb: fileSchema,
    photoEarthingConnection: fileSchema,
    photoCableWiringRoute1: fileSchema,
    photoCableWiringRoute2: fileSchema,
    photoCableWiringRoute3: fileSchema,
    photoEarthingPit: fileSchema,
    photoJioTagCustomer: fileSchema,

    // ── Required Documents for Registration ─────────────────────────────────
    docLatestLightBill: fileSchema,
    docLatestTaxBill: fileSchema,
    docCancelCheck: fileSchema,
    docPanCard: fileSchema,
    docAadhaarCard: fileSchema,

    // ── Payment Details ──────────────────────────────────────────────────────
    paymentMode: { type: String },
    projectAmount: { type: Number },
    subsidyLessProject: { type: String },
    applyForLoan: { type: Boolean, default: false },
    loanPortal: { type: String },

    // ── Payment Amounts & Proof Documents ─────────────────────────────────
    downPaymentAmount: { type: Number },
    downPaymentDoc: fileSchema,
    loanFirstPaymentAmount: { type: Number },
    loanFirstPaymentDoc: fileSchema,
    loanSecondPaymentAmount: { type: Number },
    loanSecondPaymentDoc: fileSchema,

    // ── Required Documents for Loan ──────────────────────────────────────────
    loanDocQuotation: fileSchema,
    loanDocBankStatement: fileSchema,
    loanDocITRReturn: fileSchema,
    loanDocPanCard: fileSchema,
    loanDocAadhaarCard: fileSchema,

    isFullyCompleted: { type: Boolean, default: false },

    isExecutiveVerified: { type: Boolean, default: false },
    executiveVerifiedAt: { type: Date },
    executiveVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    // ── Installation Details (After Executive Verification) ────────────────
    installationStatus: { type: String, default: "Pending" },
    installationDate: { type: String },
    pipeDispatchDate: { type: String },
    pipeDispatchNote: { type: String },
    panelDispatchDate: { type: String },
    panelDispatchNote: { type: String },
    fabricationDate: { type: String },
    fabricationTeamName: { type: String },
    fabricationNote: { type: String },
    wiringDate: { type: String },
    wiringTeamName: { type: String },
    wiringNote: { type: String },
    elcbStatus: { type: String, default: "Pending" },
    elcbNote: { type: String },
    giPipe80x40Consumption: { type: Number },
    giPipe60x40Consumption: { type: Number },
    giPipe40x40Consumption: { type: Number },
    giPipe20x40PatiPipeConsumption: { type: Number },
    giPipeConsumptionNote: { type: String },

    // ── Meter File Details (Image 2) ────────────────────────────────────────
    meterFileMakeDate: { type: String },
    meterFileRegDate: { type: String },
    meterFileMakePersonName: { type: String },
    dcrReportNo: { type: String },
    docDcrReport: fileSchema,
    dcrDate: { type: String },

    // ── After Installation Final Data (Image 2) ──────────────────────────────
    finalPanelMake: { type: String },
    finalPanelWp: { type: Number },
    finalNoOfPanel: { type: Number },
    finalProjectKw: { type: Number },
    finalInverterMake: { type: String },
    finalInverterKw: { type: Number },
    docPanelInverterSrNo: fileSchema,

    // ── Intimation and Subsidy (Image 2) ────────────────────────────────────
    intimationDate: { type: String },
    intimationRejectDate: { type: String },
    intimationRejectReason: { type: String },
    meterInstolationDate: { type: String },
    intimationApprovalDate: { type: String },
    subsidyRedeem: { type: String },
    subsidyRedeemName: { type: String },
    subsidyAmount: { type: Number },
    subsidyDisbusmentDate: { type: String },

    // ── Invoice & Warranty / Account Department Flow (Image 2) ───────────────
    makeInvoice: { type: String, default: "NO" },
    docInvoice: fileSchema,
    docWarrantyCertificate: fileSchema,
    consumerFile: { type: String, default: "PENDING" },
    currentDepartment: { type: String, default: "Project Back Office" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const ProjectDetail = mongoose.model("ProjectDetail", ProjectDetailSchema);
module.exports = ProjectDetail;
