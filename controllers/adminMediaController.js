const {
  listMedia,
  updateMediaMeta,
  replaceMediaFile,
} = require('../services/adminMediaService');

/*
 * @desc    List uploaded media (optionally filtered)
 * @route   GET /api/v1/admin/media
 * @access  Private (Admin)
 * @query   uploadedByType, uploadedById, dateStart, dateEnd
 */
const getMedia = async (req, res) => {
  try {
    const { uploadedByType, uploadedById, dateStart, dateEnd } = req.query;

    const media = await listMedia({
      uploadedByType,
      uploadedById,
      dateStart,
      dateEnd,
    });

    return res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to load media.',
    });
  }
};

/*
 * @desc    Update a media item's Title / Alternative Text
 * @route   PATCH /api/v1/admin/media/:id
 * @access  Private (Admin)
 */
const updateMedia = async (req, res) => {
  try {
    const { title, altText } = req.body;

    const media = await updateMediaMeta(req.params.id, { title, altText });

    return res.status(200).json({
      success: true,
      message: 'Media updated successfully.',
      data: media,
    });
  } catch (error) {
    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to update media.',
    });
  }
};

/*
 * @desc    Replace a media item's underlying file ("Change Image")
 * @route   PATCH /api/v1/admin/media/:id/file
 * @access  Private (Admin)
 */
const replaceMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded.',
      });
    }

    const media = await replaceMediaFile(
      req.params.id,
      req.file,
      req.body.folder
    );

    return res.status(200).json({
      success: true,
      message: 'Media file replaced successfully.',
      data: media,
    });
  } catch (error) {
    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to replace media file.',
    });
  }
};

module.exports = { getMedia, updateMedia, replaceMedia };
