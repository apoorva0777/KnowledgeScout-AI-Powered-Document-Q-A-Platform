// New file: routes/documents.js
const express = require('express');
const documentProcessor = require('../documentProcessor');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's documents
router.get('/', auth, async (req, res) => {
  try {
    const documents = await documentProcessor.getUserDocuments(req.user._id);
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific document
router.get('/:documentId', auth, async (req, res) => {
  try {
    const document = await documentProcessor.getDocument(req.params.documentId, req.user._id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:documentId', auth, async (req, res) => {
  try {
    const deleted = await documentProcessor.deleteDocument(req.params.documentId, req.user._id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }
    // Also clear chat history
    await require('../chatHandler').clearHistory(req.params.documentId, req.user._id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;