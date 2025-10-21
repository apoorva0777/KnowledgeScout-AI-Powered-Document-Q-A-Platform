// Updated src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Vite exposes env vars on import.meta.env. Use VITE_API_URL for config or fallback to localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login'); // 'login', 'register', 'upload', 'chat', 'history'
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
      fetchDocuments();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data.user);
    } catch (error) {
      // Log the error and clear auth state
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`);
      setDocuments(res.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setView('upload');
      setEmail('');
      setPassword('');
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { email, password, name });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setView('upload');
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('login');
    setMessages([]);
    setDocumentId(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilename(selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setDocumentId(response.data.documentId);
      setMessages([{
        type: 'system',
        text: `Document "${response.data.filename}" uploaded successfully! You can now ask questions about it.`
      }]);
      setFile(null);
      fetchDocuments();
      setView('chat');
    } catch (error) {
      alert('Error uploading file: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || !documentId) {
      return;
    }

    const userMessage = { type: 'user', text: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        documentId,
        question: userMessage.text
      });

      const assistantMessage = {
        type: 'assistant',
        text: response.data.answer
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'error',
        text: 'Error: ' + (error.response?.data?.error || error.message)
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async (docId) => {
    try {
      const res = await axios.get(`${API_URL}/chat/${docId}`);
      const historyMessages = res.data.history.map(msg => ({
        type: msg.role,
        text: msg.content
      }));
      setMessages(historyMessages);
      setDocumentId(docId);
      setView('chat');
      // Set filename from document
      const doc = documents.find(d => d.id === docId);
      if (doc) setFilename(doc.filename);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleNewDocument = () => {
    setDocumentId(null);
    setMessages([]);
    setFilename('');
    setView('upload');
  };

  const showHistory = () => {
    setView('history');
  };

  if (view === 'login') {
    return (
      <div className="App login-page">
        <header className="header">
          <h1>📚 KnowledgeScout</h1>
          <p>Upload documents and ask questions</p>
        </header>
        <div className="container">
          <div className="upload-section">
            <div className="upload-card">
              <h2>Login</h2>
              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="question-input"
                  style={{ marginBottom: '1rem', width: '100%' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="question-input"
                  style={{ marginBottom: '1rem', width: '100%' }}
                />
                <button type="submit" className="upload-button" style={{ width: '100%' }}>
                  Login
                </button>
              </form>
              <p style={{ marginTop: '1rem' }}>Don't have an account? <button onClick={() => setView('register')} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}>Register</button></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="App sign-up-page">
        <header className="header">
          <h1>📚 KnowledgeScout</h1>
          <p>Upload documents and ask questions</p>
        </header>
        <div className="container">
          <div className="upload-section">
            <div className="upload-card">
              <h2>Register</h2>
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="question-input"
                  style={{ marginBottom: '1rem', width: '100%' }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="question-input"
                  style={{ marginBottom: '1rem', width: '100%' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="question-input"
                  style={{ marginBottom: '1rem', width: '100%' }}
                />
                <button type="submit" className="upload-button" style={{ width: '100%' }}>
                  Register
                </button>
              </form>
              <p style={{ marginTop: '1rem' }}>Already have an account? <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}>Login</button></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Common header for authenticated views
  const AuthHeader = () => (
    <header className="header">
      <h1>📚 KnowledgeScout</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <p>Welcome, {user?.name}!</p>
        <button onClick={() => setView('upload')} className="new-doc-button" style={{ marginRight: '0.5rem' }}>
          Upload
        </button>
        <button onClick={showHistory} className="new-doc-button" style={{ marginRight: '0.5rem' }}>
          History
        </button>
        <button onClick={handleLogout} className="new-doc-button">
          Logout
        </button>
      </div>
    </header>
  );

  if (view === 'upload') {
    return (
      <div className="App default-page">
        <AuthHeader />
        <div className="container">
          <div className="upload-section">
            <div className="upload-card">
              <h2>Upload New Document</h2>
              <p className="subtitle">Supported formats: PDF, DOC, DOCX, TXT</p>
              
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  {file ? file.name : 'Choose a file'}
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="upload-button"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="App default-page">
        <AuthHeader />
        <div className="container">
          <div className="upload-section">
            <div className="upload-card" style={{ maxWidth: '800px' }}>
              <h2>Chat History</h2>
              <p className="subtitle">Select a document to view its chat history</p>
              <div className="documents-grid">
                {documents.length === 0 ? (
                  <p>No documents or chat history yet. <button onClick={() => setView('upload')} className="new-doc-button" style={{ padding: '0.5rem 1rem' }}>Upload one</button></p>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="document-history-item" style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '10px', cursor: 'pointer', border: '1px solid #e0e0e0' }} onClick={() => loadChatHistory(doc.id)}>
                      <h4 style={{ marginBottom: '0.5rem' }}>{doc.filename}</h4>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{doc.wordCount} words • Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                      {/* Preview last message if history exists */}
                      <small style={{ color: '#999' }}>Click to load chat history</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App default-page">
      <AuthHeader />
      <div className="container">
        <div className="chat-section">
          <div className="chat-header">
            <div>
              <h3>{filename}</h3>
              <p>Ask questions about your document</p>
            </div>
            <button onClick={handleNewDocument} className="new-doc-button">
              New Document
            </button>
          </div>

          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAskQuestion} className="input-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your document..."
              disabled={loading}
              className="question-input"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="send-button"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;