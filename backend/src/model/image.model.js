const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    SystemIdentifier: { type: String, required: true, unique: true },
    Title: { type: String },
    d2lFullImageUrl: { type: String },
    d2lImageUrl: { type: String },
    Path_TR1: { type: mongoose.Schema.Types.Mixed },
    Path_TR7: { type: mongoose.Schema.Types.Mixed },
    MediaNumber: { type: String },
    MediaEncryptedIdentifier: { type: String },
    RecordID: { type: String },
    FileMD5: { type: String },
    CaptionShort: { type: String },
    CaptionLong: { type: String },
    Caption: { type: String },
    MediaDate: { type: String },
    CreateDate: { type: String },
    EditDate: { type: String },
    MediaType: { type: String },
    Artist: { type: String },
    ParentFolderTitle: { type: String },
    ParentFolderNumber: { type: String },
    ParentFolderIdentifier: { type: String },
    ParentFolderEncryptedIdentifier: { type: String },
    Keyword: { type: String },
    mimetype: { type: String },
    DocSubType: { type: String },
    LinkType: { type: String },
    KeywordType: { type: String },
    Directory: { type: String },
    UsageDescription: { type: String },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },

    altText: { type: String, default: "" },
    isDecorative: { type: Boolean, default: false },
    keywords: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
