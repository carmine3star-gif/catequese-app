import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  deletePresenca,
  listAlunos,
  listAulas,
  listPresencas,
  seedAulas,
  upsertAluno,
  upsertAula,
  upsertPresenca,
  listFotosByAluno,
  listAulasExtras,
  upsertAulaExtra,
  deleteAulaExtra,
  listLinksByAulaExtra,
  addLinkAulaExtra,
  deleteLinkAulaExtra,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const sacramentoEnum = z.enum(["batismo", "primeira_comunhao", "crisma", "matrimonio"]);

/**
 * Converte qualquer formato de link do Google Drive para URL de stream direto.
 * Formatos suportados:
 *   https://drive.google.com/file/d/{ID}/view
 *   https://drive.google.com/open?id={ID}
 *   https://drive.google.com/uc?id={ID}
 */
function convertGoogleDriveLink(link: string): string {
  // Extrai o ID do arquivo de qualquer formato de link do Drive
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,   // /file/d/{ID}/view
    /[?&]id=([a-zA-Z0-9_-]+)/,        // ?id={ID} ou &id={ID}
  ];
  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  // Se não reconhecer o padrão, retorna o link original
  return link;
}

// ─── Aulas Extras Router ──────────────────────────────────────────────────────
const aulasExtrasRouter = router({
  list: publicProcedure.query(async () => {
    return listAulasExtras();
  }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      titulo: z.string().min(1),
      tema: z.string().optional().nullable(),
      descricao: z.string().optional().nullable(),
      textoLivre: z.string().optional().nullable(),
      data: z.string().optional().nullable(),
      linkExterno: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const id = await upsertAulaExtra(input);
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAulaExtra(input.id);
      return { success: true };
    }),

  setAudioLink: protectedProcedure
    .input(z.object({ id: z.number(), link: z.string() }))
    .mutation(async ({ input }) => {
      const url = convertGoogleDriveLink(input.link);
      const aulaExtra = await (await import("./db")).getAulaExtraById(input.id);
      if (!aulaExtra) throw new Error("Aula extra não encontrada");
      await upsertAulaExtra({ ...aulaExtra, audioUrl: url, audioKey: null, audioNome: "Link externo" });
      return { url };
    }),

  removeAudio: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const aulaExtra = await (await import("./db")).getAulaExtraById(input.id);
      if (!aulaExtra) throw new Error("Aula extra não encontrada");
      await upsertAulaExtra({ ...aulaExtra, audioUrl: null, audioKey: null, audioNome: null });
      return { success: true };
    }),

  removePdf: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const aulaExtra = await (await import("./db")).getAulaExtraById(input.id);
      if (!aulaExtra) throw new Error("Aula extra não encontrada");
      await upsertAulaExtra({ ...aulaExtra, pdfUrl: null, pdfKey: null, pdfNome: null });
      return { success: true };
    }),

  listLinks: publicProcedure
    .input(z.object({ aulaExtraId: z.number() }))
    .query(async ({ input }) => {
      return listLinksByAulaExtra(input.aulaExtraId);
    }),

  addLink: protectedProcedure
    .input(z.object({ aulaExtraId: z.number(), url: z.string().url(), titulo: z.string().optional() }))
    .mutation(async ({ input }) => {
      const id = await addLinkAulaExtra(input.aulaExtraId, input.url, input.titulo);
      return { id };
    }),

  deleteLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteLinkAulaExtra(input.id);
      return { success: true };
    }),
});

// ─── App Router ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Alunos ────────────────────────────────────────────────────────────────
  alunos: router({
    list: publicProcedure.query(async () => {
      const rows = await listAlunos();
      // Garante 25 slots sempre
      const map = new Map(rows.map((r) => [r.slot, r]));
      return Array.from({ length: 25 }, (_, i) => {
        const slot = i + 1;
        const row = map.get(slot);
        return {
          slot,
          nome: row?.nome ?? null,
          telefone: row?.telefone ?? null,
          sacramentos: (row?.sacramentos as string[] | null) ?? [],
        };
      });
    }),

    upsert: protectedProcedure
      .input(
        z.object({
          slot: z.number().min(1).max(25),
          nome: z.string().max(120).nullable(),
          telefone: z.string().max(30).nullable(),
          sacramentos: z.array(sacramentoEnum).default([]),
        })
      )
      .mutation(async ({ input }) => {
        await upsertAluno(input.slot, input.nome, input.telefone, input.sacramentos);
        return { success: true };
      }),
  }),

  // ─── Aulas ─────────────────────────────────────────────────────────────────
  aulas: router({
    list: publicProcedure.query(async () => {
      await seedAulas(); // garante que as 22 aulas existam
      return listAulas();
    }),

    updateDescricao: protectedProcedure
      .input(
        z.object({
          numero: z.number().min(1).max(22),
          descricao: z.string().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const rows = await listAulas();
        const aula = rows.find((a) => a.numero === input.numero);
        await upsertAula(
          input.numero,
          input.descricao,
          aula?.audioUrl ?? null,
          aula?.audioKey ?? null,
          aula?.audioNome ?? null
        );
        return { success: true };
      }),

    uploadAudio: protectedProcedure
      .input(
        z.object({
          numero: z.number().min(1).max(22),
          fileName: z.string(),
          mimeType: z.string(),
          base64: z.string(), // base64 do arquivo
        })
      )
      .mutation(async ({ input }) => {
        const rows = await listAulas();
        const aula = rows.find((a) => a.numero === input.numero);

        const ext = input.fileName.split(".").pop() ?? "mp3";
        const key = `catequese/aulas/aula-${input.numero}-${nanoid(8)}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);

        await upsertAula(
          input.numero,
          aula?.descricao ?? null,
          url,
          key,
          input.fileName
        );
        return { success: true, url, key };
      }),

    removeAudio: protectedProcedure
      .input(z.object({ numero: z.number().min(1).max(22) }))
      .mutation(async ({ input }) => {
        const rows = await listAulas();
        const aula = rows.find((a) => a.numero === input.numero);
        await upsertAula(input.numero, aula?.descricao ?? null, null, null, null, aula?.pdfUrl ?? null, aula?.pdfKey ?? null, aula?.pdfNome ?? null);
        return { success: true };
      }),

    // Salva um link externo (Google Drive, etc.) como fonte de áudio
    setAudioLink: protectedProcedure
      .input(
        z.object({
          numero: z.number().min(1).max(22),
          link: z.string().url(),
        })
      )
      .mutation(async ({ input }) => {
        const rows = await listAulas();
        const aula = rows.find((a) => a.numero === input.numero);
        // Salva o link original do Drive (será aberto diretamente no Drive)
        const url = input.link;
        const nome = "Link do Google Drive";
        await upsertAula(
          input.numero,
          aula?.descricao ?? null,
          url,
          null, // sem key S3
          nome,
          aula?.pdfUrl ?? null,
          aula?.pdfKey ?? null,
          aula?.pdfNome ?? null
        );
        return { success: true, url };
      }),

    uploadPdf: protectedProcedure
      .input(
        z.object({
          numero: z.number().min(1).max(22),
          fileName: z.string(),
          base64: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const rows = await listAulas();
        const aula = rows.find((a) => a.numero === input.numero);
        const key = `catequese/aulas/pdf-aula-${input.numero}-${nanoid(8)}.pdf`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, "application/pdf");
        await upsertAula(
          input.numero,
          aula?.descricao ?? null,
          aula?.audioUrl ?? null,
          aula?.audioKey ?? null,
          aula?.audioNome ?? null,
          url,
          key,
          input.fileName
        );
        return { success: true, url, key };
      }),

    removePdf: protectedProcedure
      .input(z.object({ numero: z.number().min(1).max(22) }))
      .mutation(async ({ input }) => {
        const rows = await listAulas();
        const aula = rows.find((a) => a.numero === input.numero);
        await upsertAula(
          input.numero,
          aula?.descricao ?? null,
          aula?.audioUrl ?? null,
          aula?.audioKey ?? null,
          aula?.audioNome ?? null,
          null,
          null,
          null
        );
        return { success: true };
      }),
  }),

  // ─── Presenças ─────────────────────────────────────────────────────────────
  presencas: router({
    list: publicProcedure.query(async () => listPresencas()),

    upsert: protectedProcedure
      .input(
        z.object({
          alunoSlot: z.number().min(1).max(25),
          aulaNumero: z.number().min(1).max(22),
          status: z.enum(["P", "F", "J"]),
        })
      )
      .mutation(async ({ input }) => {
        await upsertPresenca(input.alunoSlot, input.aulaNumero, input.status);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(
        z.object({
          alunoSlot: z.number().min(1).max(25),
          aulaNumero: z.number().min(1).max(22),
        })
      )
      .mutation(async ({ input }) => {
        await deletePresenca(input.alunoSlot, input.aulaNumero);
        return { success: true };
      }),
  }),

  // ─── Fotos dos Alunos ────────────────────────────────────────────────────────────────────────────
  fotos: router({
    list: publicProcedure
      .input(z.object({ slot: z.number().min(1).max(25) }))
      .query(async ({ input }) => listFotosByAluno(input.slot)),
  }),

  // ─── Resumo ──────────────────────────────────────────────────────────────────────────────
  resumo: router({
    frequencia: publicProcedure.query(async () => {
      const [alunosRows, presencasRows] = await Promise.all([
        listAlunos(),
        listPresencas(),
      ]);

      const map = new Map(alunosRows.map((r) => [r.slot, r]));

      return Array.from({ length: 25 }, (_, i) => {
        const slot = i + 1;
        const aluno = map.get(slot);
        const pres = presencasRows.filter((p) => p.alunoSlot === slot);
        const presentes = pres.filter((p) => p.status === "P").length;
        const faltas = pres.filter((p) => p.status === "F").length;
        const justificadas = pres.filter((p) => p.status === "J").length;
        const total = presentes + faltas + justificadas;
        const pct = total > 0 ? Math.round((presentes / total) * 100) : null;
        return {
          slot,
          nome: aluno?.nome ?? null,
          telefone: aluno?.telefone ?? null,
          sacramentos: (aluno?.sacramentos as string[] | null) ?? [],
          presentes,
          faltas,
          justificadas,
          total,
          pct,
        };
      });
    }),
  }),
  aulasExtras: aulasExtrasRouter,
});

export type AppRouter = typeof appRouter;
