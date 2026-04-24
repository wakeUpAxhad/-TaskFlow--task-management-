import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database initialization
  const db = new Database("taskflow.db");
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      position INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      column_id TEXT NOT NULL,
      content TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
    );
  `);

  // Seed initial data if empty
  const columnCount = db.prepare("SELECT COUNT(*) as count FROM columns").get() as { count: number };
  if (columnCount.count === 0) {
    const todoId = uuidv4();
    const inProgressId = uuidv4();
    const doneId = uuidv4();

    const insertColumn = db.prepare("INSERT INTO columns (id, title, position) VALUES (?, ?, ?)");
    insertColumn.run(todoId, "To Do", 0);
    insertColumn.run(inProgressId, "In Progress", 1);
    insertColumn.run(doneId, "Done", 2);

    const insertTask = db.prepare("INSERT INTO tasks (id, column_id, content, position) VALUES (?, ?, ?, ?)");
    insertTask.run(uuidv4(), todoId, "Design TaskFlow UI", 0);
    insertTask.run(uuidv4(), todoId, "Setup backend API", 1);
    insertTask.run(uuidv4(), inProgressId, "Implement drag and drop", 0);
  }

  app.use(express.json());

  // API Routes
  app.get("/api/board", (req, res) => {
    try {
      const columns = db.prepare("SELECT * FROM columns ORDER BY position ASC").all();
      const tasks = db.prepare("SELECT * FROM tasks ORDER BY position ASC").all();
      res.json({ columns, tasks });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/columns", (req, res) => {
    const { title } = req.body;
    const id = uuidv4();
    const position = (db.prepare("SELECT MAX(position) as maxPos FROM columns").get() as any).maxPos + 1 || 0;
    try {
      db.prepare("INSERT INTO columns (id, title, position) VALUES (?, ?, ?)").run(id, title, position);
      res.json({ id, title, position });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/tasks", (req, res) => {
    const { columnId, content } = req.body;
    const id = uuidv4();
    const position = (db.prepare("SELECT MAX(position) as maxPos FROM tasks WHERE column_id = ?").get(columnId) as any).maxPos + 1 || 0;
    try {
      db.prepare("INSERT INTO tasks (id, column_id, content, position) VALUES (?, ?, ?, ?)").run(id, columnId, content, position);
      res.json({ id, column_id: columnId, content, position });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { columnId, position, content } = req.body;
    try {
      if (content !== undefined) {
        db.prepare("UPDATE tasks SET content = ? WHERE id = ?").run(content, id);
      }
      if (columnId !== undefined && position !== undefined) {
        db.prepare("UPDATE tasks SET column_id = ?, position = ? WHERE id = ?").run(columnId, position, id);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite integration
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
