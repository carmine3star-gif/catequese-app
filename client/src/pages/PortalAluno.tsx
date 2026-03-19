import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Mic, ChevronDown, ChevronUp,
  Music, FileText, ExternalLink, Link as LinkIcon, Cross, Share2, Check
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

// ─── Player de Áudio ──────────────────────────────────────────────────────────
function AudioPlayer({ url, nome }: { url: string; nome: string | null }) {
  const isGoogleDrive = url.includes("drive.google.com");
  if (isGoogleDrive) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 hover:bg-blue-100 transition-colors font-medium">
        <Music className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{nome ?? "Ouvir áudio"}</span>
        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
      </a>
    );
  }
  return (
    <div className="space-y-1.5">
      {nome && <p className="text-xs text-muted-foreground font-medium">{nome}</p>}
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const aulasComConteudo = (aulas as Aula[]).filter(a => a.descricao || a.audioUrl || a.pdfUrl);
  const aulasSemConteudo = (aulas as Aula[]).filter(a => !a.descricao && !a.audioUrl && !a.pdfUrl);

  return (
    <div className="space-y-3">
      {/* Aulas com conteúdo */}
      {aulasComConteudo.length > 0 && (
        <div className="space-y-2">
          {aulasComConteudo.map((aula) => {
            const isOpen = expanded === aula.id;
            return (
              <Card key={aula.id} className={cn(
                "border-2 transition-all overflow-hidden",
                isOpen ? "border-blue-400 shadow-md" : "border-border hover:border-blue-200"
              )}>
                <CardContent className="p-0">
                  <button className="w-full p-4 flex items-center gap-3 text-left"
                    onClick={() => setExpanded(isOpen ? null : aula.id)}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-sm font-bold text-white">{aula.numero}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Aula {aula.numero}</p>
                      <p className="text-xs text-muted-foreground">{aula.data}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {aula.audioUrl && (
                        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Music className="w-2.5 h-2.5 text-emerald-600" />
                        </span>
                      )}
                      {aula.pdfUrl && (
                        <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                          <FileText className="w-2.5 h-2.5 text-rose-600" />
                        </span>
                      )}
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-blue-500 ml-1" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-blue-100 pt-3 bg-blue-50/30">
                      {aula.descricao && (
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">Conteúdo da Aula</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aula.descricao}</p>
                        </div>
                      )}
                      {aula.audioUrl && (
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">Áudio</p>
                          <AudioPlayer url={aula.audioUrl} nome={aula.audioNome} />
                        </div>
                      )}
                      {aula.pdfUrl && (
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">Material</p>
                          <a href={aula.pdfUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 hover:bg-rose-100 transition-colors">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 truncate font-medium">{aula.pdfNome ?? "Material da aula"}</span>
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
      )}

      {/* Aulas sem conteúdo ainda */}
      {aulasSemConteudo.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Próximas aulas
          </p>
          <div className="space-y-1.5">
            {aulasSemConteudo.map((aula) => (
              <div key={aula.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{aula.numero}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aula {aula.numero}</p>
                  <p className="text-xs text-muted-foreground/70">{aula.data}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(aulas as Aula[]).length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nenhuma aula disponível ainda.</p>
        </div>
      )}
    </div>
  );
}

// ─── Aba: Aulas Extras ────────────────────────────────────────────────────────
function AbasExtras() {
  const { data: aulas = [], isLoading } = trpc.aulasExtras.list.useQuery();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if ((aulas as AulaExtra[]).length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Mic className="w-14 h-14 mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium">Nenhuma aula extra disponível ainda.</p>
        <p className="text-xs mt-1 opacity-70">O catequista adicionará conteúdos extras em breve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(aulas as AulaExtra[]).map((aula) => {
        const isOpen = expanded === aula.id;
        return (
          <Card key={aula.id} className={cn(
            "border-2 transition-all overflow-hidden",
            isOpen ? "border-emerald-400 shadow-md" : "border-border hover:border-emerald-200"
          )}>
            <CardContent className="p-0">
              <button className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : aula.id)}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{aula.titulo}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {aula.tema && <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full">{aula.tema}</span>}
                    {aula.data && <span className="text-xs text-muted-foreground">{aula.data}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {aula.audioUrl && (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Music className="w-2.5 h-2.5 text-emerald-600" />
                    </span>
                  )}
                  {aula.pdfUrl && (
                    <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                      <FileText className="w-2.5 h-2.5 text-rose-600" />
                    </span>
                  )}
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-emerald-500 ml-1" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-emerald-100 pt-3 bg-emerald-50/30">
                  {aula.descricao && (
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Conteúdo</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aula.descricao}</p>
                    </div>
                  )}
                  {aula.textoLivre && (
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Texto / Anotações</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">{aula.textoLivre}</p>
                    </div>
                  )}
                  {aula.audioUrl && (
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Áudio</p>
                      <AudioPlayer url={aula.audioUrl} nome={aula.audioNome} />
                    </div>
                  )}
                  {aula.pdfUrl && (
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Material</p>
                      <a href={aula.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 hover:bg-rose-100 transition-colors">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate font-medium">{aula.pdfNome ?? "Material"}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                  <LinksExtraView aulaId={aula.id} />
                  {!aula.descricao && !aula.textoLivre && !aula.audioUrl && !aula.pdfUrl && (
                    <p className="text-sm text-muted-foreground text-center py-2 italic">
                      O catequista ainda não adicionou conteúdo para esta aula.
                    </p>
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

function LinksExtraView({ aulaId }: { aulaId: number }) {
  const { data: links = [] } = trpc.aulasExtras.listLinks.useQuery({ aulaExtraId: aulaId });
  if ((links as AulaExtraLink[]).length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Links</p>
      {(links as AulaExtraLink[]).map((l) => (
        <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-sm text-violet-700 hover:bg-violet-100 transition-colors">
          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 truncate font-medium">{l.titulo || l.url}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

// ─── Banner de Instalação PWA ────────────────────────────────────────────────
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Android/Chrome: capturar evento de instalação
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: detectar Safari no iPhone/iPad
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    if (isIos && isSafari) setShowIosBanner(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed) return null;
  if (!deferredPrompt && !showIosBanner) return null;

  return (
    <div className="mx-4 mt-3 mb-1 rounded-2xl border border-blue-200 bg-blue-50 p-3 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-lg font-bold">✝</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900">Instalar na tela inicial</p>
        {deferredPrompt ? (
          <p className="text-xs text-blue-700 mt-0.5">Adicione o app à sua tela inicial para acesso rápido.</p>
        ) : (
          <p className="text-xs text-blue-700 mt-0.5">No Safari, toque em <strong>Compartilhar</strong> → <strong>"Adicionar à Tela de Início"</strong>.</p>
        )}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {deferredPrompt && (
          <button
            onClick={async () => { await deferredPrompt.prompt(); setDeferredPrompt(null); }}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            Instalar
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="px-2 py-1.5 rounded-xl text-blue-500 text-xs hover:bg-blue-100 transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
type Tab = "aulas" | "extras";

export default function PortalAluno() {
  const [tab, setTab] = useState<Tab>("aulas");
  const [copied, setCopied] = useState(false);

  const tabs: { key: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { key: "aulas",  label: "Aulas",        icon: BookOpen, color: "blue"    },
    { key: "extras", label: "Aulas Extras",  icon: Mic,      color: "emerald" },
  ];

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "Catequese 2026/2027", url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Banner com imagem */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(https://d2xsxph8kpxj0f.cloudfront.net/310519663085088869/Te4tc5XKf7enc9Yair9yqx/vaticano_2c2c454e.webp)" }}
        />
        {/* Gradiente azul sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-800/75 to-blue-700/90" />

        {/* Conteúdo do header */}
        <div className="relative z-10 px-4 pt-8 pb-0 max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                <Cross className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">Catequese 2026/2027</h1>
                <p className="text-sm text-white/70">Portal do Catequizando</p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium hover:bg-white/30 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Compartilhar"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold rounded-t-xl transition-all",
                  tab === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xs:inline">{label}</span>
                <span className="xs:hidden">{key === "aulas" ? "Aulas" : "Extras"}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Banner de instalação PWA */}
      <InstallBanner />

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {tab === "aulas"  && <AbasAulas />}
          {tab === "extras" && <AbasExtras />}
        </div>
      </main>

      {/* Rodapé */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border bg-background">
        <p>Catequese 2026/2027 · Visualização somente leitura</p>
        <p className="mt-0.5 opacity-60">Os dados dos alunos são protegidos e não estão visíveis aqui.</p>
      </footer>
    </div>
  );
}
