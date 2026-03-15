import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do banco de dados
vi.mock("./db", () => ({
  listAlunos: vi.fn().mockResolvedValue([
    { slot: 1, nome: "Barbara", telefone: null, sacramentos: [] },
    { slot: 2, nome: "Theo", telefone: "11999999999", sacramentos: ["batismo"] },
  ]),
  upsertAluno: vi.fn().mockResolvedValue(undefined),
  listAulas: vi.fn().mockResolvedValue([
    { id: 1, numero: 1, data: "01/03", descricao: "Introdução", audioUrl: null, audioKey: null, audioNome: null },
    { id: 2, numero: 2, data: "15/03", descricao: null, audioUrl: "https://example.com/audio.mp3", audioKey: "key", audioNome: "aula2.mp3" },
  ]),
  seedAulas: vi.fn().mockResolvedValue(undefined),
  upsertAula: vi.fn().mockResolvedValue(undefined),
  listPresencas: vi.fn().mockResolvedValue([
    { id: 1, alunoSlot: 1, aulaNumero: 1, status: "P" },
    { id: 2, alunoSlot: 2, aulaNumero: 1, status: "F" },
    { id: 3, alunoSlot: 1, aulaNumero: 2, status: "J" },
  ]),
  upsertPresenca: vi.fn().mockResolvedValue(undefined),
  deletePresenca: vi.fn().mockResolvedValue(undefined),
  AULAS_DATA: Array.from({ length: 22 }, (_, i) => ({ numero: i + 1, data: `${String(i + 1).padStart(2, "0")}/01` })),
}));

// Mock do storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/audio.mp3" }),
}));

function createCtx(authenticated = false): TrpcContext {
  return {
    user: authenticated
      ? { id: 1, openId: "test-user", name: "Catequista", email: "test@test.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Alunos ────────────────────────────────────────────────────────────────────

describe("alunos.list", () => {
  it("retorna 25 slots sempre, preenchendo os vazios", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.alunos.list();
    expect(result).toHaveLength(25);
    expect(result[0].nome).toBe("Barbara");
    expect(result[2].nome).toBeNull(); // slot 3 vazio
  });

  it("slot 2 tem telefone e sacramento", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.alunos.list();
    expect(result[1].telefone).toBe("11999999999");
    expect(result[1].sacramentos).toContain("batismo");
  });
});

describe("alunos.upsert", () => {
  it("requer autenticação", async () => {
    const caller = appRouter.createCaller(createCtx(false));
    await expect(
      caller.alunos.upsert({ slot: 1, nome: "Novo", telefone: null, sacramentos: [] })
    ).rejects.toThrow();
  });

  it("salva aluno quando autenticado", async () => {
    const { upsertAluno } = await import("./db");
    const caller = appRouter.createCaller(createCtx(true));
    const result = await caller.alunos.upsert({ slot: 3, nome: "Maria", telefone: "11988887777", sacramentos: ["crisma"] });
    expect(result.success).toBe(true);
    expect(upsertAluno).toHaveBeenCalledWith(3, "Maria", "11988887777", ["crisma"]);
  });
});

// ─── Aulas ─────────────────────────────────────────────────────────────────────

describe("aulas.list", () => {
  it("retorna lista de aulas com seed", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.aulas.list();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].numero).toBe(1);
  });
});

describe("aulas.updateDescricao", () => {
  it("requer autenticação", async () => {
    const caller = appRouter.createCaller(createCtx(false));
    await expect(caller.aulas.updateDescricao({ numero: 1, descricao: "Teste" })).rejects.toThrow();
  });

  it("atualiza descrição quando autenticado", async () => {
    const caller = appRouter.createCaller(createCtx(true));
    const result = await caller.aulas.updateDescricao({ numero: 1, descricao: "Nova descrição" });
    expect(result.success).toBe(true);
  });
});

// ─── Presenças ─────────────────────────────────────────────────────────────────

describe("presencas.list", () => {
  it("retorna lista de presenças", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.presencas.list();
    expect(result).toHaveLength(3);
    expect(result[0].status).toBe("P");
  });
});

describe("presencas.upsert", () => {
  it("requer autenticação", async () => {
    const caller = appRouter.createCaller(createCtx(false));
    await expect(caller.presencas.upsert({ alunoSlot: 1, aulaNumero: 1, status: "P" })).rejects.toThrow();
  });

  it("salva presença quando autenticado", async () => {
    const { upsertPresenca } = await import("./db");
    const caller = appRouter.createCaller(createCtx(true));
    const result = await caller.presencas.upsert({ alunoSlot: 1, aulaNumero: 1, status: "P" });
    expect(result.success).toBe(true);
    expect(upsertPresenca).toHaveBeenCalledWith(1, 1, "P");
  });
});

// ─── Resumo ────────────────────────────────────────────────────────────────────

describe("resumo.frequencia", () => {
  it("retorna 25 entradas com cálculo de frequência", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.resumo.frequencia();
    expect(result).toHaveLength(25);
  });

  it("calcula frequência corretamente para Barbara (1P, 1J = 50%)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.resumo.frequencia();
    const barbara = result.find((a) => a.slot === 1);
    expect(barbara?.presentes).toBe(1);
    expect(barbara?.justificadas).toBe(1);
    expect(barbara?.faltas).toBe(0);
    expect(barbara?.pct).toBe(50); // 1P / (1P+1J) = 50%
  });

  it("calcula frequência de Theo (1F = 0%)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.resumo.frequencia();
    const theo = result.find((a) => a.slot === 2);
    expect(theo?.faltas).toBe(1);
    expect(theo?.pct).toBe(0);
  });

  it("slots sem aluno têm pct null", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.resumo.frequencia();
    const vazio = result.find((a) => a.slot === 25);
    expect(vazio?.nome).toBeNull();
    expect(vazio?.pct).toBeNull();
  });
});

// ─── Auth ──────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("limpa cookie e retorna success", async () => {
    const ctx = createCtx(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
