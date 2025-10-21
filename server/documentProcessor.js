const fs = require('fs').promises;
const path = require('path');  // Add this line
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Document = require('./models/Document');

// Connect to MongoDB (rest unchanged)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

class DocumentProcessor {
  async processDocument(filePath, fileExtension, userId) {  // userId now properly used
    // Extract text based on file type
    let text = '';
    
    switch (fileExtension) {
      case '.pdf':
        text = await this.extractPdfText(filePath);
        break;
      case '.docx':
      case '.doc':
        text = await this.extractDocxText(filePath);
        break;
      case '.txt':
        text = await this.extractTxtText(filePath);
        break;
      default:
        throw new Error('Unsupported file type');
    }

    // Create document object
    const documentId = uuidv4();
    const documentData = new Document({
      userId,  // Now required and passed
      id: documentId,
      filename: path.basename(filePath),  // Now path is defined
      text: text,
      wordCount: text.split(/\s+/).length,
      charCount: text.length,
      filePath: filePath
    });

    // Save to DB
    await documentData.save();

    return documentData;
  }

  // Rest of methods unchanged...
  async extractPdfText(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } catch (error) {
      throw new Error(`Error extracting PDF text: ${error.message}`);
    }
  }

  async extractDocxText(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`Error extracting DOCX text: ${error.message}`);
    }
  }

  async extractTxtText(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Error extracting TXT text: ${error.message}`);
    }
  }

  async getDocument(documentId, userId) {
    return await Document.findOne({ id: documentId, userId }).lean();
  }

  async getUserDocuments(userId) {
    return await Document.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async deleteDocument(documentId, userId) {
    const doc = await Document.findOneAndDelete({ id: documentId, userId });
    if (doc) {
      await fs.unlink(doc.filePath).catch(err => console.error('Error deleting file:', err));
    }
    return doc;
  }
}

module.exports = new DocumentProcessor();