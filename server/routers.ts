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
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const sacramentoEnum = z.enum(["batismo", "primeira_comunhao", "crisma", "matrimonio"]);

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
        await upsertAula(input.numero, aula?.descricao ?? null, null, null, null);
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

  // ─── Resumo ────────────────────────────────────────────────────────────────
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
});

export type AppRouter = typeof appRouter;
