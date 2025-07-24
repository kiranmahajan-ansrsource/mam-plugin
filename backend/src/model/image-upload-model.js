const mongoose = require("mongoose");

const imageCacheSchema = new mongoose.Schema({
  imageId: { type: String, required: true, unique: true },
  mayoUrl: { type: String },
  d2lImageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },

  altText: { type: String },
  isDecorative: { type: Boolean },
  title: { type: String },
  keywords: [String],
});

module.exports = mongoose.model("ImageCache", imageCacheSchema);
