import Product from '../models/product.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';

// Create product
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, features, stock, specifications } = req.body;
        
        let uploadedImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'robotics_products'
                });
                uploadedImages.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
                await fs.unlink(file.path);
            }
        }

        const featureArray = Array.isArray(features) ? features : features?.split(',').map(f => f.trim()) || [];
        const specs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications || {};

        const product = await Product.create({
            name: name,
            description: description,
            price: Number(price),
            category: category,
            images: uploadedImages,
            features: featureArray,
            stock: Number(stock) || 0,
            specifications: specs
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.log('Error creating product:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    }
};

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Products fetched successfully',
            count: products.length,
            data: products
        });
    } catch (error) {
        console.log('Error fetching products:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

// Get single product
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Product fetched successfully',
            data: product
        });
    } catch (error) {
        console.log('Error fetching product:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updates = { ...req.body };
        
        if (req.files && req.files.length > 0) {
            let newImages = [];
            
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'robotics_products'
                });
                newImages.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
                await fs.unlink(file.path);
            }
            
            if (req.body.keepOldImages === 'true') {
                updates.images = [...product.images, ...newImages];
            } else {
                for (const image of product.images) {
                    await cloudinary.uploader.destroy(image.public_id);
                }
                updates.images = newImages;
            }
        }

        if (updates.specifications && typeof updates.specifications === 'string') {
            updates.specifications = JSON.parse(updates.specifications);
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.log('Error updating product:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.images.length > 0) {
            for (const image of product.images) {
                await cloudinary.uploader.destroy(image.public_id);
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.log('Error deleting product:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message
        });
    }
};