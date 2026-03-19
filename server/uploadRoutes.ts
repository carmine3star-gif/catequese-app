import { Router, Request, Response } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { listAulas, upsertAula, listFotosByAluno, insertFoto, deleteFoto, getAulaExtraById, upsertAulaExtra } from "./db";
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

// POST /api/upload/foto-aluno  — multipart/form-data: file + slot + ordem
router.post(
  "/foto-aluno",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const slot = parseInt(req.body.slot ?? "0", 10);
      const ordem = parseInt(req.body.ordem ?? "1", 10);

      if (!file) { res.status(400).json({ error: "Arquivo não enviado" }); return; }
      if (!slot || slot < 1 || slot > 25) { res.status(400).json({ error: "Slot inválido" }); return; }
      if (!ordem || ordem < 1 || ordem > 7) { res.status(400).json({ error: "Ordem inválida (1-7)" }); return; }

      const ext = (file.originalname.split(".").pop() ?? "jpg").toLowerCase();
      const key = `catequese/alunos/slot-${slot}-foto-${ordem}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype || "image/jpeg");

      await insertFoto(slot, ordem, url, key, file.originalname);

      res.json({ success: true, url, key, nome: file.originalname, slot, ordem });
    } catch (err: any) {
      console.error("[Upload Foto Aluno]", err);
      res.status(500).json({ error: err?.message ?? "Erro interno" });
    }
  }
);

// POST /api/upload/aula-extra  — multipart/form-data: file + aulaExtraId + tipo (audio|pdf)
router.post(
  "/aula-extra",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const aulaExtraId = parseInt(req.body.aulaExtraId ?? "0", 10);
      const tipo = req.body.tipo as "audio" | "pdf";

      if (!file) {
        res.status(400).json({ error: "Arquivo não enviado" });
        return;
      }
      if (!aulaExtraId || aulaExtraId < 1) {
        res.status(400).json({ error: "ID de aula extra inválido" });
        return;
      }
      if (tipo !== "audio" && tipo !== "pdf") {
        res.status(400).json({ error: "Tipo inválido (audio ou pdf)" });
        return;
      }

      const aulaExtra = await getAulaExtraById(aulaExtraId);
      if (!aulaExtra) {
        res.status(404).json({ error: "Aula extra não encontrada" });
        return;
      }

      if (tipo === "audio") {
        const ext = (file.originalname.split(".").pop() ?? "mp3").toLowerCase();
        const key = `catequese/aulas-extras/audio-${aulaExtraId}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, file.buffer, file.mimetype || "audio/mpeg");
        await upsertAulaExtra({ ...aulaExtra, audioUrl: url, audioKey: key, audioNome: file.originalname });
        res.json({ success: true, url, key, nome: file.originalname });
      } else {
        const key = `catequese/aulas-extras/pdf-${aulaExtraId}-${nanoid(8)}.pdf`;
        const { url } = await storagePut(key, file.buffer, "application/pdf");
        await upsertAulaExtra({ ...aulaExtra, pdfUrl: url, pdfKey: key, pdfNome: file.originalname });
        res.json({ success: true, url, key, nome: file.originalname });
      }
    } catch (err: any) {
      console.error("[Upload Aula Extra]", err);
      res.status(500).json({ error: err?.message ?? "Erro interno" });
    }
  }
);

// DELETE /api/upload/foto-aluno/:id
router.delete(
  "/foto-aluno/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id ?? "0", 10);
      if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
      await deleteFoto(id);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Delete Foto Aluno]", err);
      res.status(500).json({ error: err?.message ?? "Erro interno" });
    }
  }
);

export { router as uploadRouter };
