// Updated chatHandler.js
const Groq = require('groq-sdk');
const ChatHistory = require('./models/ChatHistory');
const Document = require('./models/Document');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

class ChatHandler {
  async answerQuestion(documentId, question, userId) {
    // Get the document
    const document = await require('./documentProcessor').getDocument(documentId, userId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    // Get or create conversation history
    let history = await ChatHistory.findOne({ documentId, userId });
    if (!history) {
      history = new ChatHistory({ documentId, userId, messages: [] });
    }

    // Get the full document text
    const documentText = document.text;

    // Truncate document if it's too long
    const maxChars = 15000; // Groq has good context length
    const truncatedText = documentText.length > maxChars 
      ? documentText.substring(0, maxChars) + '\n\n[Document truncated due to length...]'
      : documentText;

    try {
      // Build messages array
      const messages = [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions about documents. You have access to the following document content. Answer questions based solely on this document. If the answer cannot be found in the document, say "I cannot find this information in the document."\n\nDocument Content:\n${truncatedText}`
        },
        ...history.messages.map(msg => ({ role: msg.role, content: msg.content })),
        {
          role: 'user',
          content: question
        }
      ];

      // Call Groq API
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Fast and accurate model
        messages: messages,
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      });

      const answer = response.choices[0].message.content;

      // Update conversation history
      history.messages.push(
        { role: 'user', content: question },
        { role: 'assistant', content: answer, tokensUsed: response.usage.total_tokens }
      );

      // Keep only last 10 exchanges (20 messages) to avoid token limits
      if (history.messages.length > 20) {
        history.messages.splice(0, history.messages.length - 20);
      }

      await history.save();

      return {
        text: answer,
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      // Handle specific Groq errors
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (error.status === 401) {
        throw new Error('Invalid Groq API key. Please check your .env file.');
      }
      throw new Error(`Error calling Groq API: ${error.message}`);
    }
  }

  async getHistory(documentId, userId) {
    const history = await ChatHistory.findOne({ documentId, userId });
    return history ? history.messages : [];
  }

  async clearHistory(documentId, userId) {
    await ChatHistory.findOneAndDelete({ documentId, userId });
  }
}

module.exports = new ChatHandler();