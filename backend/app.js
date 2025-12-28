import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import connectDB from './config/db.js';
import productRoutes from './rote/productRoute.js';

const app = express();

dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory (needed for multer temporary storage)
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

connectDB();

app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
    res.send('🤖 Robotics Store API is running');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.log('Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

const PORT = process.env.PORT || 50000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});