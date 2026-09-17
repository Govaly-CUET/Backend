const Category = require('../models/categoryModel');
const Media = require('../models/mediaModel');
const cloudinary = require('../config/cloudinary');

const HEADER_TITLES = ['top banner', 'logo', 'thank you'];

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject({
            status: 502,
            message: 'Image upload failed.',
          });
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );

    stream.end(fileBuffer);
  });
};

const getHomePage = async (req, res) => {
  try {
    const [topBanner, logo, categories] = await Promise.all([
      Media.findOne({ title: 'top banner' }),
      Media.findOne({ title: 'logo' }),
      Category.find().select('name subcategory'),
    ]);

    const carousal1 = [];
    const carousal2 = [];

    categories.forEach((category) => {
      category.subcategory.forEach((sub) => {
        if (sub.isBody && sub.carousal === 1) {
          carousal1.push({
            _id: sub._id,
            name: sub.name,
            image: sub.image,
            parentCategory: category.name,
            carousal: sub.carousal,
          });
        }

        if (sub.isBody && sub.carousal === 2) {
          carousal2.push({
            _id: sub._id,
            name: sub.name,
            image: sub.image,
            parentCategory: category.name,
            carousal: sub.carousal,
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        header: {
          topBanner,
          logo,
        },
        body: {
          carousal1,
          carousal2,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const listCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .select('name subcategory')
      .sort({ name: 1 });

    const result = [];

    categories.forEach((category) => {
      category.subcategory.forEach((sub) => {
        result.push({
          _id: sub._id,
          name: sub.name,
          image: sub.image,
          parentCategory: category.name,
          isBody: sub.isBody,
          carousal: sub.carousal,
        });
      });
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addCategoryTocarousal = async (req, res) => {
  try {
    const { id } = req.params;
    const { carousal } = req.body;

    if (![1, 2].includes(Number(carousal))) {
      return res.status(400).json({
        success: false,
        message: 'carousal must be 1 or 2.',
      });
    }

    const category = await Category.findOne({
      'subcategory._id': id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found.',
      });
    }

    const subcategory = category.subcategory.id(id);

    subcategory.isBody = true;
    subcategory.carousal = Number(carousal);

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Added to carousal.',
      data: subcategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// const removeCategoryFromcarousal = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const category = await Category.findOne({
//       'subcategory._id': id,
//     });

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: 'Subcategory not found.',
//       });
//     }

//     const subcategory = category.subcategory.id(id);

//     subcategory.isBody = false;
//     subcategory.carousal = 0;

//     await category.save();

//     res.status(200).json({
//       success: true,
//       message: 'Removed from carousal.',
//       data: subcategory,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const removeCategoryFromcarousal = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      'subcategory._id': id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found.',
      });
    }

    const subcategory = category.subcategory.id(id);

    subcategory.isBody = false;
    subcategory.carousal = 0;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Removed from carousal.',
      data: {
        _id: subcategory._id,
        name: subcategory.name,
        image: subcategory.image,
        parentCategory: category.name,
        isBody: subcategory.isBody,
        carousal: subcategory.carousal,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadHeaderMedia = async (req, res) => {
    console.log(">>> uploadHeaderMedia CALLED");

  try {
    const rawTitle = (req.body.title || '').trim().toLowerCase();

    if (!HEADER_TITLES.includes(rawTitle)) {
      return res.status(400).json({
        success: false,
        message: 'title must be "top banner", "logo", or "thank you".',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an image to upload.',
      });
    }

    const existing = await Media.findOne({
      title: rawTitle,
    });

    if (existing) {
      await existing.deleteOne();
    }

    const uploaded = await uploadToCloudinary(req.file, 'govaly/pages');

    const media = await Media.create({
      title: rawTitle,
      url: uploaded.url,
      publicId: uploaded.publicId,
      fileType: req.file.mimetype,
      size: req.file.size,
      width: uploaded.width,
      height: uploaded.height,
      uploadedByType: 'admin',
      uploadedById: req.admin._id,
      uploadedByModel: 'Admin',
    });

    res.status(201).json({
      success: true,
      message: 'Applied successfully.',
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeHeaderMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.',
      });
    }

    await media.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Removed.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getHomePage,
  listCategories,
  addCategoryTocarousal,
  removeCategoryFromcarousal,
  uploadHeaderMedia,
  removeHeaderMedia,
};
