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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const ProjectDetail = mongoose.model("ProjectDetail", ProjectDetailSchema);
module.exports = ProjectDetail;
