import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./api/index";

const PORT = 3000;

async function startServer() {
  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite loading in development mode as middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Vite loading in production mode serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Toppers Batch Hub proxy server is live at http://0.0.0.0:${PORT}`);
  });
}

startServer();
