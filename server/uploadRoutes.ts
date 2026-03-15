import { Router, Request, Response } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { listAulas, upsertAula } from "./db";
import { sdk } from "./_core/sdk";

const router = Router();

// Multer: armazena em memória (buffer), limite de 100MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Middleware de autenticação simples para as rotas de upload
async function requireAuth(req: Request, res: Response, next: Function) {
  try {
    const user = await sdk.authenticateRequest(req);
    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ error: "Não autenticado" });
  }
}

// POST /api/upload/audio  — multipart/form-data: file + numero
router.post(
  "/audio",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const numero = parseInt(req.body.numero ?? "0", 10);

      if (!file) {
        res.status(400).json({ error: "Arquivo não enviado" });
        return;
      }
      if (!numero || numero < 1 || numero > 22) {
        res.status(400).json({ error: "Número de aula inválido" });
        return;
      }

      const ext = (file.originalname.split(".").pop() ?? "mp3").toLowerCase();
      const key = `catequese/aulas/audio-aula-${numero}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype || "audio/mpeg");

      const rows = await listAulas();
      const aula = rows.find((a) => a.numero === numero);
      await upsertAula(
        numero,
        aula?.descricao ?? null,
        url,
        key,
        file.originalname,
        aula?.pdfUrl ?? null,
        aula?.pdfKey ?? null,
        aula?.pdfNome ?? null
      );

      res.json({ success: true, url, key, nome: file.originalname });
    } catch (err: any) {
      console.error("[Upload Audio]", err);
      res.status(500).json({ error: err?.message ?? "Erro interno" });
    }
  }
);

// POST /api/upload/pdf  — multipart/form-data: file + numero
router.post(
  "/pdf",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const numero = parseInt(req.body.numero ?? "0", 10);

      if (!file) {
        res.status(400).json({ error: "Arquivo não enviado" });
        return;
      }
      if (!numero || numero < 1 || numero > 22) {
        res.status(400).json({ error: "Número de aula inválido" });
        return;
      }

      const key = `catequese/aulas/pdf-aula-${numero}-${nanoid(8)}.pdf`;
      const { url } = await storagePut(key, file.buffer, "application/pdf");

      const rows = await listAulas();
      const aula = rows.find((a) => a.numero === numero);
      await upsertAula(
        numero,
        aula?.descricao ?? null,
        aula?.audioUrl ?? null,
        aula?.audioKey ?? null,
        aula?.audioNome ?? null,
        url,
        key,
        file.originalname
      );

      res.json({ success: true, url, key, nome: file.originalname });
    } catch (err: any) {
      console.error("[Upload PDF]", err);
      res.status(500).json({ error: err?.message ?? "Erro interno" });
    }
  }
);

export { router as uploadRouter };
