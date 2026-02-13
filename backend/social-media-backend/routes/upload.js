const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { requireAuth } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload avatar (single file)
router.post('/avatar', requireAuth, upload.single('avatar'), uploadController.uploadAvatar);

// Upload post media (multiple files, up to 10)
router.post('/post-media', requireAuth, upload.array('media', 10), uploadController.uploadPostMedia);

// Upload story media (single file)
router.post('/story-media', requireAuth, upload.single('media'), uploadController.uploadStoryMedia);

// Delete file
router.delete('/file', requireAuth, uploadController.deleteFile);

// Get signed URL
router.post('/signed-url', requireAuth, uploadController.getSignedUrl);

module.exports = router;
