const mongoose = require("mongoose");

const { Schema } = mongoose;

const LeadSchema = new Schema(
  {
    fullName: {
      type: String,
    },

    contact: {
      type: String,
    },

    email: {
      type: String,
      lowercase: true,
    },

    kwRequirement: {
      type: String,
    },

    discomName: {
      type: String,
    },

    address: {
      type: String,
    },

    locationLink: {
      type: String,
    },

    leadStatus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leadStatus",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    followUps: [
      {
        date: { type: Date },
        time: { type: String },
        note: { type: String, trim: true },
        staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attachments: [
      {
        originalName: String,
        filename: String,
        path: String,
      },
    ],
    activities: [
      {
        message: { type: String },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
        date: { type: Date, default: Date.now },
      }
    ],
    quotation: {
      date: Date,
      solarModule: String,
      inverter: String,
      options: [String],
      rows: [
        {
          title: String,
          values: [String]
        }
      ]
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metaLeadId: {
      type: String,
      unique: true,
      sparse: true
    },
    metaRawData: {
      type: Object
    },
    paymentAmount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  },
);

const LEAD = mongoose.model("Lead", LeadSchema);
module.exports = LEAD;
