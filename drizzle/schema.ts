import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Sacramentos disponíveis
export type Sacramento =
  | "batismo"
  | "primeira_comunhao"
  | "crisma"
  | "matrimonio";

// Tabela de alunos: 25 slots fixos (slot 1–25)
export const alunos = mysqlTable("alunos", {
  id: int("id").autoincrement().primaryKey(),
  slot: int("slot").notNull().unique(), // 1–25
  nome: varchar("nome", { length: 120 }),
  telefone: varchar("telefone", { length: 30 }),
  sacramentos: json("sacramentos").$type<Sacramento[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aluno = typeof alunos.$inferSelect;
export type InsertAluno = typeof alunos.$inferInsert;

// Tabela de aulas: 22 aulas fixas
export const aulas = mysqlTable("aulas", {
  id: int("id").autoincrement().primaryKey(),
  numero: int("numero").notNull().unique(), // 1–22
  data: varchar("data", { length: 10 }).notNull(), // "DD/MM"
  descricao: text("descricao"),
  audioUrl: text("audioUrl"),
  audioKey: varchar("audioKey", { length: 255 }),
  audioNome: varchar("audioNome", { length: 255 }),
  pdfUrl: text("pdfUrl"),
  pdfKey: varchar("pdfKey", { length: 255 }),
  pdfNome: varchar("pdfNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aula = typeof aulas.$inferSelect;
export type InsertAula = typeof aulas.$inferInsert;

// Tabela de presenças: status por aluno por aula
export const presencas = mysqlTable("presencas", {
  id: int("id").autoincrement().primaryKey(),
  alunoSlot: int("alunoSlot").notNull(),
  aulaNumero: int("aulaNumero").notNull(),
  status: mysqlEnum("status", ["P", "F", "J"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Presenca = typeof presencas.$inferSelect;
export type InsertPresenca = typeof presencas.$inferInsert;

// Tabela de fotos de documentos dos alunos (máx 7 por aluno)
export const alunoFotos = mysqlTable("aluno_fotos", {
  id: int("id").autoincrement().primaryKey(),
  alunoSlot: int("alunoSlot").notNull(),
  ordem: int("ordem").notNull().default(1), // 1-7
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  nomeArquivo: varchar("nomeArquivo", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlunoFoto = typeof alunoFotos.$inferSelect;
export type InsertAlunoFoto = typeof alunoFotos.$inferInsert;
