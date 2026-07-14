const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Error: File upload only supports images (jpeg/jpg/png) or PDF!'));
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 1024 * 1024 * 5 } });

const uploadBufferToCloudinary = ({ buffer, folder, resourceType, fileName }) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                ...(fileName ? { public_id: path.parse(fileName).name } : {}),
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        stream.end(buffer);
    });

const getChatFileType = (mimetype) => (mimetype.startsWith('image/') ? 'image' : 'document');

upload.uploadApplicationFiles = async (files) => {
    const result = {};

    for (const [field, fileArr] of Object.entries(files)) {
        const file = fileArr[0];
        const isPassport = field === 'passport';
        const isImage = file.mimetype.startsWith('image/');

        if (isPassport && isImage) {
            const processed = await sharp(file.buffer)
                .resize(400, 533, { fit: 'cover', position: 'top' })
                .jpeg({ quality: 90 })
                .withMetadata(false)
                .toBuffer();

            const uploaded = await uploadBufferToCloudinary({
                buffer: processed,
                folder: 'aeroconsult/passports',
                resourceType: 'image',
                fileName: file.originalname,
            });

            result[field] = uploaded.secure_url;
            continue;
        }

        const uploaded = await uploadBufferToCloudinary({
            buffer: file.buffer,
            folder: 'aeroconsult/applications',
            resourceType: isImage ? 'image' : 'raw',
            fileName: file.originalname,
        });

        result[field] = uploaded.secure_url;
    }

    return result;
};

const chatStorage = multer.memoryStorage();

const chatFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images (jpg/png/gif), PDF, and Word documents are allowed'));
};

upload.chatFile = multer({ storage: chatStorage, fileFilter: chatFileFilter, limits: { fileSize: 1024 * 1024 * 10 } });

upload.uploadChatFileToCloudinary = async (file) => {
    if (!file) {
        throw new Error('No file uploaded');
    }

    const uploaded = await uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: 'aeroconsult/chat-uploads',
        resourceType: getChatFileType(file.mimetype),
        fileName: file.originalname,
    });

    return {
        fileUrl: uploaded.secure_url,
        fileType: getChatFileType(file.mimetype),
        originalName: file.originalname,
    };
};

module.exports = upload;
