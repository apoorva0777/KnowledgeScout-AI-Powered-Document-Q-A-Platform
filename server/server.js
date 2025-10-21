const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const documentProcessor = require('./documentProcessor');
const chatHandler = require('./chatHandler');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');
const auth = require('./middleware/auth');  // Add this import

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes (require auth)
app.use(auth);  // Apply auth middleware globally to protected routes below

// Protected upload route
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // Now pass req.user._id (from auth middleware)
    const documentData = await documentProcessor.processDocument(filePath, fileExtension, req.user._id);

    res.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      documentId: documentData.id,
      filename: req.file.originalname,
      wordCount: documentData.wordCount,
      charCount: documentData.charCount
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('📝 Make sure to set GROQ_API_KEY and MONGODB_URI in your .env file');
  console.log('🔑 Get your free Groq API key at: https://console.groq.com/keys');
});