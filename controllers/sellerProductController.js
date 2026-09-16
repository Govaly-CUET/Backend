const Product = require('../models/productModel');
const { getSellerProducts } = require('../services/sellerProductService');

// @desc    Create a new product
// @route   POST /seller/products
// @access  Private (Seller only)
const createProduct = async (req, res) => {
    try {
        const { name, category, sale_price, description, image, stock, status } = req.body;

        if (!name || !category || !sale_price || !description || !image || stock === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: name, category, sale_price, description, image, stock",
            });
        }

        const product = await Product.create({
            name,
            category,
            sale_price,
            description,
            image,
            stock,
            status: status || "in_stock",
            seller: req.seller._id, // logged-in seller theke ashbe (auth middleware)
        });

        res.status(201).json({
            success: true,
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    List the logged-in seller's own products
// @route   GET /seller/products
// @access  Private (Seller only)
const listMyProducts = async (req, res) => {
    try {
        const products = await getSellerProducts(req.seller._id, req.query);

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createProduct,
    listMyProducts,
};