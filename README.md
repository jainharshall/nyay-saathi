# ⚖️ Nyay-Saathi AI

**Your AI-powered legal companion — making justice accessible to everyone.**


---

## 📖 About

**NyayaSaathi AI** (न्यायसाथी) — *nyaay* (justice) + *saathi* (companion) — is an intelligent legal assistant that helps everyday users understand their legal rights, navigate complex legal language, and get instant guidance on legal matters — all powered by Google's Gemini AI.

Whether you're dealing with a landlord dispute, a workplace issue, or simply trying to understand a legal document, NyayaSaathi AI bridges the gap between citizens and the law.

---

## ✨ Features

- 🤖 **AI Legal Assistant** — Ask any legal question and get clear, actionable guidance powered by Gemini AI
- 🔐 **User Authentication** — Secure signup and login with session management
- 🗄️ **Supabase Integration** — Persistent data storage and real-time capabilities
- ⚡ **Blazing Fast** — Built with Vite for instant HMR and fast production builds
- 📱 **Responsive UI** — Works seamlessly across desktop and mobile devices
- 🌐 **Full-Stack TypeScript** — End-to-end type safety across both frontend and backend

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + TypeScript |
| **Build Tool** | Vite |
| **Backend** | Express.js (TypeScript) |
| **AI Engine** | Google Gemini AI |
| **Database** | Supabase (PostgreSQL) |
| **Styling** | CSS |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/)
- A [Google AI Studio](https://aistudio.google.com/) account (for Gemini API key)
- A [Supabase](https://supabase.com/) project (optional, for full persistence)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/jainkrish09/nyaay-ai.git
cd nyaay-ai
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Then open `.env` and fill in your credentials:
```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for Supabase persistence)
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional
JWT_SECRET=your_custom_jwt_secret
```

> 💡 Get your Gemini API key for free from [Google AI Studio](https://aistudio.google.com/).

**4. Start the development server**
```bash
npm run dev
```

The app will be running at **http://localhost:3000** 🎉

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the app in development mode with hot reload |
| `npm run build` | Build the app for production |
| `npm run start` | Run the production build (requires `npm run build` first) |
| `npm run lint` | Run the linter to check for code issues |

---

## 📁 Project Structure

```
nyaay-ai/
│
├── 📂 src/                        # React frontend source code
│   ├── 📂 components/             #   Reusable UI components
│   ├── 📂 pages/                  #   App pages / route views
│   ├── 📂 hooks/                  #   Custom React hooks
│   ├── 📂 services/               #   API calls & Gemini AI logic
│   ├── 📂 styles/                 #   Global and component CSS
│   └── main.tsx                   #   React app entry point
│
├── 📂 .vite/                      # Vite dev cache (auto-generated)
│
├── server.ts                      # Express backend server
├── index.html                     # HTML shell / Vite entry point
├── vite.config.ts                 # Vite bundler configuration
├── tsconfig.json                  # TypeScript compiler options
├── metadata.json                  # App metadata
├── package.json                   # Dependencies & npm scripts
├── package-lock.json              # Locked dependency tree
├── .gitignore                     # Git ignored files
└── .env                           # 🔒 Environment variables (not committed)
```

> **Note:** The `src/` subdirectories above reflect the recommended structure. Actual folder names may vary.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn and build together. Any contributions you make are **greatly appreciated**!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚠️ Disclaimer

NyayaSaathi AI is intended for **informational purposes only** and does not constitute legal advice. Always consult a qualified legal professional for advice specific to your situation.

