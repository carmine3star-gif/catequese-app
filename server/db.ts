import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, alunos, aulas, presencas, users } from "../drizzle/schema";
import type { Sacramento } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Alunos ───────────────────────────────────────────────────────────────────

export async function listAlunos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alunos).orderBy(alunos.slot);
}

export async function upsertAluno(slot: number, nome: string | null, telefone: string | null, sacramentos: Sacramento[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .insert(alunos)
    .values({ slot, nome, telefone, sacramentos: sacramentos as unknown as null })
    .onDuplicateKeyUpdate({ set: { nome, telefone, sacramentos: sacramentos as unknown as null } });
}

// ─── Aulas ────────────────────────────────────────────────────────────────────

export const AULAS_DATA = [
  { numero: 1,  data: "01/03" },
  { numero: 2,  data: "15/03" },
  { numero: 3,  data: "05/04" },
  { numero: 4,  data: "19/04" },
  { numero: 5,  data: "03/05" },
  { numero: 6,  data: "17/05" },
  { numero: 7,  data: "07/06" },
  { numero: 8,  data: "21/06" },
  { numero: 9,  data: "05/07" },
  { numero: 10, data: "19/07" },
  { numero: 11, data: "02/08" },
  { numero: 12, data: "16/08" },
  { numero: 13, data: "06/09" },
  { numero: 14, data: "20/09" },
  { numero: 15, data: "04/10" },
  { numero: 16, data: "18/10" },
  { numero: 17, data: "01/11" },
  { numero: 18, data: "15/11" },
  { numero: 19, data: "06/12" },
  { numero: 20, data: "20/12" },
  { numero: 21, data: "03/01" },
  { numero: 22, data: "17/01" },
];

export async function seedAulas() {
  const db = await getDb();
  if (!db) return;
  for (const a of AULAS_DATA) {
    await db
      .insert(aulas)
      .values({ numero: a.numero, data: a.data })
      .onDuplicateKeyUpdate({ set: { data: a.data } });
  }
}

export async function listAulas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aulas).orderBy(aulas.numero);
}

export async function upsertAula(
  numero: number,
  descricao: string | null,
  audioUrl: string | null,
  audioKey: string | null,
  audioNome: string | null,
  pdfUrl?: string | null,
  pdfKey?: string | null,
  pdfNome?: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updateSet: Record<string, unknown> = { descricao, audioUrl, audioKey, audioNome };
  if (pdfUrl !== undefined) updateSet.pdfUrl = pdfUrl;
  if (pdfKey !== undefined) updateSet.pdfKey = pdfKey;
  if (pdfNome !== undefined) updateSet.pdfNome = pdfNome;
  await db
    .insert(aulas)
    .values({ numero, data: AULAS_DATA[numero - 1]?.data ?? "", descricao, audioUrl, audioKey, audioNome, pdfUrl: pdfUrl ?? null, pdfKey: pdfKey ?? null, pdfNome: pdfNome ?? null })
    .onDuplicateKeyUpdate({ set: updateSet });
}

// ─── Presenças ────────────────────────────────────────────────────────────────

export async function listPresencas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(presencas);
}

export async function upsertPresenca(
  alunoSlot: number,
  aulaNumero: number,
  status: "P" | "F" | "J"
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .insert(presencas)
    .values({ alunoSlot, aulaNumero, status })
    .onDuplicateKeyUpdate({ set: { status } });
}

export async function deletePresenca(alunoSlot: number, aulaNumero: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(presencas)
    .where(and(eq(presencas.alunoSlot, alunoSlot), eq(presencas.aulaNumero, aulaNumero)));
}
