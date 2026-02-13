const { supabase, supabaseAdmin } = require('../models');
const path = require('path');

const uploadController = {
  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      const file = req.file;
      const fileExt = path.extname(file.originalname);
      const fileName = `avatars/${userId}/${Date.now()}${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Update user avatar
      await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: { url: publicUrl }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Upload post media
  async uploadPostMedia(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      const uploadedUrls = [];

      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const fileName = `posts/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

        const { data, error } = await supabase.storage
          .from('media')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        uploadedUrls.push({
          url: publicUrl,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image'
        });
      }

      res.json({
        success: true,
        message: 'Media uploaded successfully',
        data: { urls: uploadedUrls }
      });
    } catch (error) {
      console.error('Upload post media error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Upload story media
  async uploadStoryMedia(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      const file = req.file;
      const fileExt = path.extname(file.originalname);
      const fileName = `stories/${userId}/${Date.now()}${fileExt}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      res.json({
        success: true,
        message: 'Story media uploaded successfully',
        data: {
          url: publicUrl,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image'
        }
      });
    } catch (error) {
      console.error('Upload story media error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete uploaded file
  async deleteFile(req, res) {
    try {
      const userId = req.user.id;
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required'
        });
      }

      // Extract path from URL if full URL provided
      const pathMatch = filePath.match(/media\/(.+)$/);
      const storagePath = pathMatch ? pathMatch[1] : filePath;

      // Verify ownership (check if path contains userId)
      if (!storagePath.includes(userId)) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete this file'
        });
      }

      const { error } = await supabase.storage
        .from('media')
        .remove([storagePath]);

      if (error) throw error;

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get signed URL for private files
  async getSignedUrl(req, res) {
    try {
      const { filePath, expiresIn = 3600 } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required'
        });
      }

      const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;

      res.json({
        success: true,
        data: { signedUrl: data.signedUrl }
      });
    } catch (error) {
      console.error('Get signed URL error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = uploadController;
