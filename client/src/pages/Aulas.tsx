import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Pencil, Check, X, Upload, Trash2, Play, Pause,
  Music, LogIn, ChevronDown, ChevronUp, FileText, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Player de áudio ──────────────────────────────────────────────────────────

function isGoogleDriveUrl(url: string) {
  return url.includes("drive.google.com");
}

function AudioPlayer({ url, nome }: { url: string; nome?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const isDrive = isGoogleDriveUrl(url);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => setLoadError(true)); setPlaying(true); }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Para links do Google Drive: exibe botão de abrir no Drive
  // pois o Drive bloqueia reproducão direta por CORS
  if (isDrive || loadError) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-900 truncate">{nome ?? "Áudio da aula"}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Google Drive · Abre no app do Drive</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg bg-primary hover:opacity-90 text-white flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        {loadError && (
          <p className="text-[10px] text-amber-600 mt-2 text-center">
            Não foi possível reproduzir diretamente. Use o botão para abrir no Drive.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => { const a = audioRef.current; if (a) setProgress(a.currentTime); }}
        onLoadedMetadata={() => { const a = audioRef.current; if (a) setDuration(a.duration); }}
        onEnded={() => setPlaying(false)}
        onError={() => setLoadError(true)}
      />
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-sm hover:opacity-90 active:scale-95 transition-all"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-900 truncate">{nome ?? "Áudio da aula"}</p>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="range" min={0} max={duration || 1} value={progress}
            onChange={(e) => {
              const a = audioRef.current;
              if (a) { a.currentTime = Number(e.target.value); setProgress(Number(e.target.value)); }
            }}
            className="flex-1 h-1 accent-primary cursor-pointer"
          />
          <span className="text-[10px] text-blue-700 flex-shrink-0 tabular-nums">
            {fmt(progress)}{duration ? ` / ${fmt(duration)}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Componente PDF ───────────────────────────────────────────────────────────

function PdfCard({ url, nome }: { url: string; nome?: string | null }) {
  return (
    <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3">
      <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-rose-900 truncate">{nome ?? "Material da aula"}</p>
        <p className="text-[10px] text-rose-600 mt-0.5">PDF · Toque para abrir</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Aulas() {
  const { isAuthenticated } = useAuth();
  const { data: aulas = [] } = trpc.aulas.list.useQuery();
  const utils = trpc.useUtils();

  const updateDesc = trpc.aulas.updateDescricao.useMutation({
    onSuccess: () => { utils.aulas.list.invalidate(); toast.success("Descrição salva!"); },
    onError: () => toast.error("Erro ao salvar descrição"),
  });
  const removeAudio = trpc.aulas.removeAudio.useMutation({
    onSuccess: () => { utils.aulas.list.invalidate(); toast.success("Áudio removido"); },
    onError: () => toast.error("Erro ao remover áudio"),
  });
  const removePdf = trpc.aulas.removePdf.useMutation({
    onSuccess: () => { utils.aulas.list.invalidate(); toast.success("PDF removido"); },
    onError: () => toast.error("Erro ao remover PDF"),
  });
  const setAudioLink = trpc.aulas.setAudioLink.useMutation({
    onSuccess: () => { utils.aulas.list.invalidate(); toast.success("Link salvo!"); setLinkForm(""); setEditingLink(null); },
    onError: (e) => toast.error(e.message || "Link inválido"),
  });

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingLink, setEditingLink] = useState<number | null>(null);
  const [linkForm, setLinkForm] = useState("");

  const [editingDesc, setEditingDesc] = useState<number | null>(null);
  const [descForm, setDescForm] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [uploading, setUploading] = useState<{ numero: number; type: "audio" | "pdf" } | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ numero: number; type: "audio" | "pdf" } | null>(null);

  const startEditDesc = (numero: number, current: string | null) => {
    if (!isAuthenticated) { toast.error("Entre para editar"); return; }
    setDescForm(current ?? "");
    setEditingDesc(numero);
    setExpanded(numero);
  };

  const saveDesc = (numero: number) => {
    updateDesc.mutate({ numero, descricao: descForm.trim() || null });
    setEditingDesc(null);
  };

  const handleFileUpload = async (numero: number, file: File, type: "audio" | "pdf") => {
    const MAX_MB = 100;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${MAX_MB}MB`);
      return;
    }
    setUploading({ numero, type });
    setUploadProgress(0);
    try {
      const endpoint = type === "audio" ? "/api/upload/audio" : "/api/upload/pdf";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("numero", String(numero));

      // XMLHttpRequest para acompanhar o progresso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let msg = "Erro no servidor";
            try { msg = JSON.parse(xhr.responseText)?.error ?? msg; } catch {}
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error("Falha de conexão"));
        xhr.send(formData);
      });

      await utils.aulas.list.invalidate();
      toast.success(type === "audio" ? "Áudio enviado!" : "PDF enviado!");
    } catch (err: any) {
      toast.error(err?.message ?? `Falha no upload do ${type === "pdf" ? "PDF" : "áudio"}`);
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  if (!aulas.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Aulas</h2>
          <p className="text-xs text-muted-foreground">22 aulas · Toque para expandir</p>
        </div>
        {!isAuthenticated && (
          <Button size="sm" className="bg-primary text-primary-foreground h-8 text-xs"
            onClick={() => (window.location.href = getLoginUrl())}>
            <LogIn className="w-3 h-3 mr-1" /> Entrar
          </Button>
        )}
      </div>

      {aulas.map((aula) => {
        const isExpanded = expanded === aula.numero;
        const isEditDesc = editingDesc === aula.numero;
        const isUploadingAudio = uploading?.numero === aula.numero && uploading.type === "audio";
        const isUploadingPdf = uploading?.numero === aula.numero && uploading.type === "pdf";
        const hasAudio = !!aula.audioUrl;
        const hasPdf = !!aula.pdfUrl;
        const hasDesc = !!aula.descricao;

        return (
          <Card key={aula.numero} className={cn(
            "transition-all overflow-hidden",
            isExpanded && "border-primary/40 shadow-md"
          )}>
            {/* Cabeçalho */}
            <button className="w-full" onClick={() => setExpanded(isExpanded ? null : aula.numero)}>
              <div className="flex items-center gap-3 p-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white font-bold",
                  (hasDesc || hasAudio || hasPdf) ? "bg-primary" : "bg-muted-foreground/30"
                )}>
                  <span className="text-[10px] leading-none">Aula</span>
                  <span className="text-sm leading-none">{aula.numero}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm text-foreground">{aula.data}</p>
                  <p className={cn("text-xs truncate mt-0.5", hasDesc ? "text-muted-foreground" : "text-muted-foreground/50 italic")}>
                    {aula.descricao ?? "Sem descrição"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {hasAudio && <Music className="w-3.5 h-3.5 text-blue-500" />}
                  {hasPdf && <FileText className="w-3.5 h-3.5 text-rose-500" />}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </button>

            {/* Conteúdo expandido */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-4 border-t border-border pt-3">

                {/* ── Descrição ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo da Aula</p>
                    {isAuthenticated && !isEditDesc && (
                      <Button size="sm" variant="ghost" onClick={() => startEditDesc(aula.numero, aula.descricao ?? null)}
                        className="h-6 px-2 text-xs text-primary">
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                    )}
                  </div>
                  {isEditDesc ? (
                    <div className="space-y-2">
                      <Textarea
                        value={descForm}
                        onChange={(e) => setDescForm(e.target.value)}
                        placeholder="Descreva o conteúdo desta aula..."
                        className="text-sm min-h-[100px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveDesc(aula.numero)}
                          className="bg-primary text-primary-foreground h-8 text-xs flex-1">
                          <Check className="w-3 h-3 mr-1" /> Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingDesc(null)} className="h-8 text-xs">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className={cn("text-sm", hasDesc ? "text-foreground" : "text-muted-foreground italic")}>
                      {aula.descricao ?? "Nenhuma descrição adicionada."}
                    </p>
                  )}
                </div>

                {/* ── PDF ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Material em PDF
                    </p>
                    {isAuthenticated && hasPdf && (
                      <Button size="sm" variant="ghost"
                        onClick={() => removePdf.mutate({ numero: aula.numero })}
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3 mr-1" /> Remover
                      </Button>
                    )}
                  </div>

                  {hasPdf ? (
                    <>
                      <PdfCard url={aula.pdfUrl!} nome={aula.pdfNome} />
                      {isAuthenticated && (
                        <Button size="sm" variant="outline"
                          onClick={() => { setPendingUpload({ numero: aula.numero, type: "pdf" }); pdfInputRef.current?.click(); }}
                          disabled={isUploadingPdf}
                          className="mt-2 h-8 text-xs w-full border-rose-300 text-rose-700 hover:bg-rose-50">
                          {isUploadingPdf ? `Enviando... ${uploadProgress}%` : <><Upload className="w-3 h-3 mr-1" /> Substituir PDF</>}
                        </Button>
                      )}
                      {isUploadingPdf && (
                        <div className="mt-1 h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-rose-200 rounded-xl bg-rose-50/50">
                      <FileText className="w-8 h-8 mx-auto text-rose-300 mb-2" />
                      <p className="text-xs text-rose-500">Nenhum PDF enviado</p>
                      {isAuthenticated && (
                        <>
                          <Button size="sm" variant="outline"
                            onClick={() => { setPendingUpload({ numero: aula.numero, type: "pdf" }); pdfInputRef.current?.click(); }}
                            disabled={isUploadingPdf}
                            className="mt-2 h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50">
                            {isUploadingPdf ? (
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                {uploadProgress}%
                              </span>
                            ) : (
                              <><Upload className="w-3 h-3 mr-1" /> Enviar PDF</>
                            )}
                          </Button>
                          {isUploadingPdf && (
                            <div className="mt-2 h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Áudio ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Áudio da Aula</p>
                    {isAuthenticated && hasAudio && (
                      <Button size="sm" variant="ghost"
                        onClick={() => removeAudio.mutate({ numero: aula.numero })}
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3 mr-1" /> Remover
                      </Button>
                    )}
                  </div>

                  {hasAudio ? (
                    <>
                      <AudioPlayer url={aula.audioUrl!} nome={aula.audioNome} />
                      {isAuthenticated && (
                        <div className="mt-2 space-y-1">
                          <Button size="sm" variant="outline"
                            onClick={() => { setPendingUpload({ numero: aula.numero, type: "audio" }); audioInputRef.current?.click(); }}
                            disabled={isUploadingAudio}
                            className="h-8 text-xs w-full">
                            {isUploadingAudio ? `Enviando... ${uploadProgress}%` : <><Upload className="w-3 h-3 mr-1" /> Substituir arquivo</>}
                          </Button>
                          <Button size="sm" variant="ghost"
                            onClick={() => { setEditingLink(aula.numero); setLinkForm(aula.audioUrl ?? ""); }}
                            className="h-8 text-xs w-full text-blue-600">
                            <ExternalLink className="w-3 h-3 mr-1" /> Usar link do Google Drive
                          </Button>
                        </div>
                      )}
                      {isUploadingAudio && (
                        <div className="mt-1 h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-xl p-4">
                      <div className="text-center mb-3">
                        <Music className="w-8 h-8 mx-auto text-muted-foreground/40 mb-1" />
                        <p className="text-xs text-muted-foreground">Nenhum áudio adicionado</p>
                      </div>
                      {isAuthenticated && (
                        <div className="space-y-2">
                          {/* Opção 1: Upload de arquivo */}
                          <Button size="sm" variant="outline"
                            onClick={() => { setPendingUpload({ numero: aula.numero, type: "audio" }); audioInputRef.current?.click(); }}
                            disabled={isUploadingAudio}
                            className="h-8 text-xs w-full">
                            {isUploadingAudio ? (
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                {uploadProgress}%
                              </span>
                            ) : (
                              <><Upload className="w-3 h-3 mr-1" /> Enviar arquivo de áudio</>
                            )}
                          </Button>
                          {isUploadingAudio && (
                            <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          )}

                          {/* Opção 2: Link do Google Drive */}
                          <div className="relative">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center">
                              <div className="flex-1 border-t border-border" />
                              <span className="px-2 text-[10px] text-muted-foreground bg-background">ou</span>
                              <div className="flex-1 border-t border-border" />
                            </div>
                          </div>

                          {editingLink === aula.numero ? (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] text-muted-foreground">Cole o link de compartilhamento do Google Drive:</p>
                              <input
                                type="url"
                                value={linkForm}
                                onChange={(e) => setLinkForm(e.target.value)}
                                placeholder="https://drive.google.com/file/d/..."
                                className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <Button size="sm"
                                  onClick={() => setAudioLink.mutate({ numero: aula.numero, link: linkForm.trim() })}
                                  disabled={!linkForm.trim() || setAudioLink.isPending}
                                  className="flex-1 h-8 text-xs bg-primary text-primary-foreground">
                                  {setAudioLink.isPending ? "Salvando..." : <><Check className="w-3 h-3 mr-1" /> Salvar link</>}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingLink(null)} className="h-8 text-xs">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline"
                              onClick={() => { setEditingLink(aula.numero); setLinkForm(""); }}
                              className="h-8 text-xs w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                              <ExternalLink className="w-3 h-3 mr-1" /> Usar link do Google Drive
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </Card>
        );
      })}

      {/* Inputs de arquivo ocultos */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingUpload) handleFileUpload(pendingUpload.numero, file, "audio");
          e.target.value = "";
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingUpload) handleFileUpload(pendingUpload.numero, file, "pdf");
          e.target.value = "";
        }}
      />
    </div>
  );
}
