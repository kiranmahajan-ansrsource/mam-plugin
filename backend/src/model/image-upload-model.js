const mongoose = require("mongoose");

const imageMetaSchema = new mongoose.Schema({
  imageId: { type: String, required: true}, 
  title: String,
  mayoUrl: String, 
  d2lImageUrl: String,
  width: Number,
  height: Number,
  directory: String,
  path: String,
  mediaNumber: String,
  mediaEncryptedIdentifier: String,
  recordID: String,
  fileMD5: String,
  captionShort: String,
  captionLong: String,
  caption: String,
  mediaDate: String,
  createDate: String,
  editDate: String,
  mediaType: String,
  artist: String,
  parentFolderTitle: String,
  parentFolderNumber: String,
  parentFolderIdentifier: String,
  parentFolderEncryptedIdentifier: String,
  keyword: String,
  mimetype: String,
  linkType: String,
  keywordType: String,
organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  altText: String,
  isDecorative: Boolean,
  keywords: [String], // For search
});

module.exports = mongoose.model("ImageCache", imageMetaSchema);
