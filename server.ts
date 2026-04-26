import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory users for demonstration (Ideally move to Supabase/DB)
  const users: any[] = [];
  const JWT_SECRET = process.env.JWT_SECRET || "nyayasaathi-secret-key-123";

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = { id: Date.now().toString(), email, password, name };
    users.push(newUser);

    res.status(201).json({ message: "User created successfully", userId: newUser.id });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: { id: user.id, email: user.email, name: user.name } });
  });

  // Helper for Supabase
  const getSupabase = () => {
    let supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    if (supabaseUrl.includes('/rest/v1')) {
      supabaseUrl = supabaseUrl.split('/rest/v1')[0];
    }
    return createClient(supabaseUrl, supabaseKey);
  };

  // API Route: AI Legal Assistant (Deprecated: Moved to frontend)
  app.post("/api/legal-ai", async (req, res) => {
    res.status(410).json({ error: "This endpoint has been moved to the frontend." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
