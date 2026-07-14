const cloudinary = require('cloudinary').v2;

// Cloudinary SDK automatically reads CLOUDINARY_URL from process.env
cloudinary.config({ secure: true });

module.exports = cloudinary;
