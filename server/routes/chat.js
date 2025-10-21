// New file: routes/chat.js
const express = require('express');
const chatHandler = require('../chatHandler');
const auth = require('../middleware/auth');

const router = express.Router();

// Chat with document
router.post('/', auth, async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ error: 'Document ID and question are required' });
    }

    const answer = await chatHandler.answerQuestion(documentId, question, req.user._id);

    res.json({
      success: true,
      answer: answer.text,
      tokensUsed: answer.tokensUsed
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
router.get('/:documentId', auth, async (req, res) => {
  try {
    const history = await chatHandler.getHistory(req.params.documentId, req.user._id);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear chat history
router.post('/clear/:documentId', auth, async (req, res) => {
  try {
    await chatHandler.clearHistory(req.params.documentId, req.user._id);
    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;