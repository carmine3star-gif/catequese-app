import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Mic, BarChart2, ChevronDown, ChevronUp,
  Music, FileText, ExternalLink, Link as LinkIcon, Cross
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Aula = {
  id: number;
  numero: number;
  data: string;
  descricao: string | null;
  audioUrl: string | null;
  audioNome: string | null;
  pdfUrl: string | null;
  pdfNome: string | null;
};

type AulaExtra = {
  id: number;
  titulo: string;
  tema: string | null;
  descricao: string | null;
  textoLivre: string | null;
  data: string | null;
  audioUrl: string | null;
  audioNome: string | null;
  linkExterno: string | null;
  pdfUrl: string | null;
  pdfNome: string | null;
};

type AulaExtraLink = {
  id: number;
  aulaExtraId: number;
  titulo: string | null;
  url: string;
};

type ResumoAluno = {
  slot: number;
  nome: string | null;
  telefone?: string | null;
  sacramentos?: string[];
  presentes: number;
  faltas: number;
  justificadas: number;
  total: number;
  pct: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctColor(pct: number) {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-600";
}

function pctBg(pct: number) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Player de Áudio ──────────────────────────────────────────────────────────
function AudioPlayer({ url, nome }: { url: string; nome: string | null }) {
  const isGoogleDrive = url.includes("drive.google.com");
  if (isGoogleDrive) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
        <ExternalLink className="w-4 h-4" /> Ouvir no Google Drive
      </a>
    );
  }
  return (
    <div className="space-y-1">
      {nome && <p className="text-xs text-muted-foreground">{nome}</p>}
      <audio controls className="w-full h-10" src={url}>
        Seu navegador não suporta áudio.
      </audio>
    </div>
  );
}

// ─── Aba: Aulas ───────────────────────────────────────────────────────────────
function AbasAulas() {
  const { data: aulas = [], isLoading } = trpc.aulas.list.useQuery();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-2">
      {(aulas as Aula[]).map((aula) => {
        const isOpen = expanded === aula.id;
        const hasContent = aula.descricao || aula.audioUrl || aula.pdfUrl;
        return (
          <Card key={aula.id} className={cn("border transition-all", isOpen ? "border-blue-300 shadow-sm" : "border-border")}>
            <CardContent className="p-0">
              <button className="w-full p-3 flex items-center gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : aula.id)}>
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-700">{aula.numero}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Aula {aula.numero}</p>
                  <p className="text-xs text-muted-foreground">{aula.data}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {aula.audioUrl && <Music className="w-3.5 h-3.5 text-emerald-500" />}
                  {aula.pdfUrl && <FileText className="w-3.5 h-3.5 text-rose-500" />}
                  {hasContent && (isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
                </div>
              </button>
              {isOpen && hasContent && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {aula.descricao && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Conteúdo da Aula</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{aula.descricao}</p>
                    </div>
                  )}
                  {aula.audioUrl && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Áudio</p>
                      <AudioPlayer url={aula.audioUrl} nome={aula.audioNome} />
                    </div>
                  )}
                  {aula.pdfUrl && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Material</p>
                      <a href={aula.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 hover:bg-rose-100 transition-colors">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{aula.pdfNome ?? "Material da aula"}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Aba: Aulas Extras ────────────────────────────────────────────────────────
function AbasExtras() {
  const { data: aulas = [], isLoading } = trpc.aulasExtras.list.useQuery();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) return <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>;

  if ((aulas as AulaExtra[]).length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nenhuma aula extra disponível ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(aulas as AulaExtra[]).map((aula) => {
        const isOpen = expanded === aula.id;
        return (
          <Card key={aula.id} className={cn("border transition-all", isOpen ? "border-emerald-300 shadow-sm" : "border-border")}>
            <CardContent className="p-0">
              <button className="w-full p-3 flex items-center gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : aula.id)}>
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{aula.titulo}</p>
                  <div className="flex gap-2">
                    {aula.tema && <p className="text-xs text-muted-foreground truncate">{aula.tema}</p>}
                    {aula.data && <p className="text-xs text-muted-foreground">· {aula.data}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {aula.audioUrl && <Music className="w-3.5 h-3.5 text-emerald-500" />}
                  {aula.pdfUrl && <FileText className="w-3.5 h-3.5 text-rose-500" />}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {aula.descricao && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Conteúdo</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{aula.descricao}</p>
                    </div>
                  )}
                  {aula.textoLivre && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Texto / Anotações</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-lg p-3">{aula.textoLivre}</p>
                    </div>
                  )}
                  {aula.audioUrl && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Áudio</p>
                      <AudioPlayer url={aula.audioUrl} nome={aula.audioNome} />
                    </div>
                  )}
                  {aula.pdfUrl && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Material</p>
                      <a href={aula.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 hover:bg-rose-100 transition-colors">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{aula.pdfNome ?? "Material"}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                  {/* Links */}
                  <LinksExtraView aulaId={aula.id} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function LinksExtraView({ aulaId }: { aulaId: number }) {
  const { data: links = [] } = trpc.aulasExtras.listLinks.useQuery({ aulaExtraId: aulaId });
  if ((links as AulaExtraLink[]).length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Links</p>
      {(links as AulaExtraLink[]).map((l) => (
        <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 border border-violet-100 text-sm text-violet-700 hover:bg-violet-100 transition-colors">
          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 truncate">{l.titulo || l.url}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

// ─── Aba: Frequência ──────────────────────────────────────────────────────────
function AbasFrequencia() {
  const { data: resumo = [], isLoading } = trpc.resumo.frequencia.useQuery();

  if (isLoading) return <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>;

  const alunos = (resumo as ResumoAluno[]).filter(a => a.nome);

  return (
    <div className="space-y-2">
      {alunos.map((a) => (
        <Card key={a.slot} className="border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">{a.nome}</p>
              <span className={cn("text-sm font-bold", pctColor(a.pct ?? 0))}>{a.pct ?? 0}%</span>
            </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className={cn("h-2 rounded-full transition-all", pctBg(a.pct ?? 0))}
                  style={{ width: `${a.pct ?? 0}%` }} />
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="text-emerald-600 font-medium">✓ {a.presentes} presença{a.presentes !== 1 ? "s" : ""}</span>
              <span className="text-red-500 font-medium">✗ {a.faltas} falta{a.faltas !== 1 ? "s" : ""}</span>
              {a.justificadas > 0 && <span className="text-amber-600 font-medium">J {a.justificadas}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
type Tab = "aulas" | "extras" | "frequencia";

export default function PortalAluno() {
  const [tab, setTab] = useState<Tab>("aulas");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "aulas",      label: "Aulas",    icon: BookOpen },
    { key: "extras",     label: "Extras",   icon: Mic },
    { key: "frequencia", label: "Frequência", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-primary text-primary-foreground px-4 pt-safe-top">
        <div className="max-w-2xl mx-auto py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Cross className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Catequese 2026/2027</h1>
            <p className="text-xs text-primary-foreground/70">Portal do Catequizando</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto flex border-t border-white/20">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                "flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors",
                tab === key ? "text-white border-b-2 border-white" : "text-white/60 hover:text-white/80"
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {tab === "aulas"      && <AbasAulas />}
          {tab === "extras"     && <AbasExtras />}
          {tab === "frequencia" && <AbasFrequencia />}
        </div>
      </main>

      {/* Rodapé */}
      <footer className="text-center py-3 text-xs text-muted-foreground border-t border-border">
        Catequese 2026/2027 · Somente leitura
      </footer>
    </div>
  );
}
