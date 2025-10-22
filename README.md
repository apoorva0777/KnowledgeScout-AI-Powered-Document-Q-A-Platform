# KnowledgeScout

AI-powered Document Q&A platform that lets users upload documents (PDF, DOC/DOCX, TXT) and ask natural-language questions to get instant, context-aware answers.

## Features

- User authentication (JWT)
- File upload and processing (Multer + pdf-parse + Mammoth)
- AI-driven Q&A using Groq SDK (LLM)
- Persistent document metadata and chat history stored in MongoDB
- React + Vite frontend with responsive UI

## Tech Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- AI: Groq SDK (LLM)
- File processing: pdf-parse, Mammoth.js

## Quickstart (local)

1. Clone the repo

```powershell
git clone <repo-url>
cd KnowledgeScout-AI-Powered-Document-Q-A-Platform
```

2. Backend

```powershell
cd server
npm install
# create .env with MONGODB_URI, JWT_SECRET, GROQ_API_KEY, PORT
node server.js
```

3. Frontend

```powershell
cd ../client
npm install
npm run dev
# open http://localhost:3000
```

## Notes

- Uploaded files are stored on disk in `server/uploads`; extracted text and metadata are stored in MongoDB.
- Keep your `GROQ_API_KEY` and `JWT_SECRET` secret and do not commit `.env` to source control.

## License

MIT
