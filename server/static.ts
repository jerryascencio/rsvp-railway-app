import express from 'express';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { storage } from "./storage";
import { eventSlugFromPath } from "./tenancy";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (req, res) => {
    const slug = eventSlugFromPath(req.originalUrl);
    if (slug && !storage.getEventBySlug(slug)) {
      return res.status(404).type("html").send("<!doctype html><title>Not found</title><p>This invitation doesn't exist.</p>");
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
