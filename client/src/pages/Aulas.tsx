import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, Upload, Trash2, Play, Pause, Music, LogIn, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function AudioPlayer({ url, nome }: { url: string; nome?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a) setProgress(a.currentTime);
        }}
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (a) setDuration(a.duration);
        }}
        onEnded={() => setPlaying(false)}
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
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
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

export default function Aulas() {
  const { isAuthenticated } = useAuth();
  const { data: aulas = [] } = trpc.aulas.list.useQuery();
  const utils = trpc.useUtils();

  const updateDesc = trpc.aulas.updateDescricao.useMutation({
    onSuccess: () => { utils.aulas.list.invalidate(); toast.success("Descrição salva!"); },
    onError: () => toast.error("Erro ao salvar descrição"),
  });
  const uploadAudio = trpc.aulas.uploadAudio.useMutation({
    onSuccess: () => { utils.aulas.list.invalidate(); toast.success("Áudio enviado!"); },
    onError: () => toast.error("Erro ao enviar áudio"),
  });
  const removeAudio = trpc.aulas.removeAudio.useMutation({
    onSuccess: () => { utils.aulas.list.invalidate(); toast.success("Áudio removido"); },
    onError: () => toast.error("Erro ao remover áudio"),
  });

  const [editingDesc, setEditingDesc] = useState<number | null>(null);
  const [descForm, setDescForm] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

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

  const handleFileUpload = async (numero: number, file: File) => {
    const MAX_MB = 16;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${MAX_MB}MB`);
      return;
    }
    setUploading(numero);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      await uploadAudio.mutateAsync({
        numero,
        fileName: file.name,
        mimeType: file.type || "audio/mpeg",
        base64,
      });
    } catch {
      toast.error("Falha no upload do áudio");
    } finally {
      setUploading(null);
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
        const isUploading = uploading === aula.numero;
        const hasAudio = !!aula.audioUrl;
        const hasDesc = !!aula.descricao;

        return (
          <Card key={aula.numero} className={cn(
            "transition-all overflow-hidden",
            isExpanded && "border-primary/40 shadow-md"
          )}>
            {/* Header da aula */}
            <button
              className="w-full"
              onClick={() => setExpanded(isExpanded ? null : aula.numero)}
            >
              <div className="flex items-center gap-3 p-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white font-bold",
                  hasDesc || hasAudio ? "bg-primary" : "bg-muted-foreground/30"
                )}>
                  <span className="text-[10px] leading-none">Aula</span>
                  <span className="text-sm leading-none">{aula.numero}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm text-foreground">{aula.data}</p>
                  <p className={cn(
                    "text-xs truncate mt-0.5",
                    hasDesc ? "text-muted-foreground" : "text-muted-foreground/50 italic"
                  )}>
                    {aula.descricao ?? "Sem descrição"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {hasAudio && <Music className="w-3.5 h-3.5 text-blue-500" />}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </button>

            {/* Conteúdo expandido */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                {/* Descrição */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Conteúdo da Aula
                    </p>
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
                        <Button size="sm" variant="outline" onClick={() => setEditingDesc(null)}
                          className="h-8 text-xs">
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

                {/* Áudio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Áudio da Aula
                    </p>
                    {isAuthenticated && hasAudio && (
                      <Button size="sm" variant="ghost"
                        onClick={() => removeAudio.mutate({ numero: aula.numero })}
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3 mr-1" /> Remover
                      </Button>
                    )}
                  </div>

                  {hasAudio ? (
                    <AudioPlayer url={aula.audioUrl!} nome={aula.audioNome} />
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-border rounded-xl">
                      <Music className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhum áudio enviado</p>
                      {isAuthenticated && (
                        <Button size="sm" variant="outline"
                          onClick={() => {
                            setUploadingSlot(aula.numero);
                            fileInputRef.current?.click();
                          }}
                          disabled={isUploading}
                          className="mt-2 h-8 text-xs">
                          {isUploading ? (
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Enviando...
                            </span>
                          ) : (
                            <><Upload className="w-3 h-3 mr-1" /> Enviar áudio</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {isAuthenticated && hasAudio && (
                    <Button size="sm" variant="outline"
                      onClick={() => {
                        setUploadingSlot(aula.numero);
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                      className="mt-2 h-8 text-xs w-full">
                      {isUploading ? "Enviando..." : <><Upload className="w-3 h-3 mr-1" /> Substituir áudio</>}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingSlot !== null) {
            handleFileUpload(uploadingSlot, file);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
