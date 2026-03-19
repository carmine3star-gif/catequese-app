import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, Music, FileText,
  Link as LinkIcon, X, Check, LogIn, ExternalLink, Save, Mic, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type AulaExtra = {
  id: number;
  titulo: string;
  tema: string | null;
  descricao: string | null;
  textoLivre: string | null;
  data: string | null;
  audioUrl: string | null;
  audioKey: string | null;
  audioNome: string | null;
  linkExterno: string | null;
  pdfUrl: string | null;
  pdfKey: string | null;
  pdfNome: string | null;
  createdAt: Date;
};

type AulaExtraLink = {
  id: number;
  aulaExtraId: number;
  titulo: string | null;
  url: string;
  createdAt: Date;
};

const MAX_MB = 100;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// ─── Componente de Player de Áudio ────────────────────────────────────────────
function AudioPlayer({ url, nome }: { url: string; nome: string | null }) {
  const isGoogleDrive = url.includes("drive.google.com");
  if (isGoogleDrive) {
    return (
      <a
        href={url.replace("uc?export=download&", "file/d/").replace(/&id=/, "/view?id=")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        <ExternalLink className="w-4 h-4" />
        Abrir no Google Drive
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

// ─── Componente de Links ───────────────────────────────────────────────────────
function LinksSection({ aulaId, isAuthenticated }: { aulaId: number; isAuthenticated: boolean }) {
  const utils = trpc.useUtils();
  const { data: links = [] } = trpc.aulasExtras.listLinks.useQuery({ aulaExtraId: aulaId });
  const addLink = trpc.aulasExtras.addLink.useMutation({
    onSuccess: () => { utils.aulasExtras.listLinks.invalidate({ aulaExtraId: aulaId }); toast.success("Link adicionado!"); setNewUrl(""); setNewTitulo(""); },
    onError: () => toast.error("URL inválida"),
  });
  const deleteLink = trpc.aulasExtras.deleteLink.useMutation({
    onSuccess: () => utils.aulasExtras.listLinks.invalidate({ aulaExtraId: aulaId }),
  });

  const [newUrl, setNewUrl] = useState("");
  const [newTitulo, setNewTitulo] = useState("");
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold text-foreground">Links e Referências</span>
      </div>

      {/* Lista de links */}
      {links.length > 0 && (
        <div className="space-y-1.5">
          {(links as AulaExtraLink[]).map((l) => (
            <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 border border-violet-100">
              <ExternalLink className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <a href={l.url} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-sm text-violet-700 hover:underline truncate">
                {l.titulo || l.url}
              </a>
              {isAuthenticated && (
                <button onClick={() => deleteLink.mutate({ id: l.id })}
                  className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Adicionar novo link */}
      {isAuthenticated && (
        adding ? (
          <div className="space-y-2 p-3 rounded-lg border border-violet-200 bg-violet-50/50">
            <Input placeholder="URL (ex: https://...)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
              className="text-sm" />
            <Input placeholder="Título (opcional)" value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)}
              className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => { if (newUrl) addLink.mutate({ aulaExtraId: aulaId, url: newUrl, titulo: newTitulo || undefined }); }}
                disabled={!newUrl || addLink.isPending}>
                <Check className="w-3.5 h-3.5 mr-1" /> Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewUrl(""); setNewTitulo(""); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar link
          </button>
        )
      )}
    </div>
  );
}

// ─── Componente de Aula Extra ─────────────────────────────────────────────────
function AulaExtraCard({ aula, isAuthenticated }: { aula: AulaExtra; isAuthenticated: boolean }) {
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(aula.titulo);
  const [tema, setTema] = useState(aula.tema ?? "");
  const [descricao, setDescricao] = useState(aula.descricao ?? "");
  const [textoLivre, setTextoLivre] = useState(aula.textoLivre ?? "");
  const [data, setData] = useState(aula.data ?? "");
  const [audioLinkInput, setAudioLinkInput] = useState("");
  const [showAudioLink, setShowAudioLink] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const upsert = trpc.aulasExtras.upsert.useMutation({
    onSuccess: () => { utils.aulasExtras.list.invalidate(); setEditing(false); toast.success("Salvo!"); },
    onError: () => toast.error("Erro ao salvar"),
  });
  const deleteAula = trpc.aulasExtras.delete.useMutation({
    onSuccess: () => { utils.aulasExtras.list.invalidate(); toast.success("Aula extra removida"); },
    onError: () => toast.error("Erro ao remover"),
  });
  const setAudioLink = trpc.aulasExtras.setAudioLink.useMutation({
    onSuccess: () => { utils.aulasExtras.list.invalidate(); setAudioLinkInput(""); setShowAudioLink(false); toast.success("Link de áudio salvo!"); },
    onError: () => toast.error("Erro ao salvar link"),
  });
  const removeAudio = trpc.aulasExtras.removeAudio.useMutation({
    onSuccess: () => { utils.aulasExtras.list.invalidate(); toast.success("Áudio removido"); },
  });
  const removePdf = trpc.aulasExtras.removePdf.useMutation({
    onSuccess: () => { utils.aulasExtras.list.invalidate(); toast.success("PDF removido"); },
  });

  const handleUpload = async (file: File, type: "audio" | "pdf") => {
    if (file.size > MAX_BYTES) { toast.error(`Arquivo muito grande. Máximo ${MAX_MB}MB`); return; }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("aulaExtraId", String(aula.id));
    formData.append("tipo", type);

    setUploadProgress(0);
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(xhr.responseText)); };
        xhr.onerror = () => reject(new Error("Erro de rede"));
        xhr.open("POST", "/api/upload/aula-extra");
        xhr.send(formData);
      });
      utils.aulasExtras.list.invalidate();
      toast.success(`${type === "audio" ? "Áudio" : "PDF"} enviado com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setUploadProgress(null);
    }
  };

  const hasAudio = !!aula.audioUrl;
  const hasPdf = !!aula.pdfUrl;

  return (
    <Card className={cn("border transition-all", expanded ? "border-emerald-300 shadow-md" : "border-border")}>
      <CardContent className="p-0">
        {/* Cabeçalho */}
        <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setExpanded(!expanded)}>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Mic className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{aula.titulo}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {aula.tema && <span className="text-xs text-muted-foreground truncate">{aula.tema}</span>}
              {aula.data && <span className="text-xs text-muted-foreground">· {aula.data}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasAudio && <Music className="w-4 h-4 text-emerald-500" />}
            {hasPdf && <FileText className="w-4 h-4 text-rose-500" />}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Conteúdo expandido */}
        {expanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">

            {/* Edição dos campos principais */}
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Título *</label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da aula extra" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Tema</label>
                  <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: Oração, Sacramento, Reflexão..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Data</label>
                  <Input value={data} onChange={(e) => setData(e.target.value)} placeholder="Ex: 20/04/2026" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Descrição / Conteúdo</label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o conteúdo abordado..." rows={3} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Texto livre / Anotações</label>
                  <Textarea value={textoLivre} onChange={(e) => setTextoLivre(e.target.value)}
                    placeholder="Orações, reflexões, avisos, observações..." rows={4} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => upsert.mutate({ id: aula.id, titulo, tema: tema || null, descricao: descricao || null, textoLivre: textoLivre || null, data: data || null })}
                    disabled={!titulo || upsert.isPending}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
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
                {isAuthenticated && (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Editar informações
                  </button>
                )}
              </div>
            )}

            {/* Seção de Áudio */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">Áudio da Aula</span>
              </div>
              {hasAudio ? (
                <div className="space-y-2">
                  <AudioPlayer url={aula.audioUrl!} nome={aula.audioNome} />
                  {isAuthenticated && (
                    <button onClick={() => removeAudio.mutate({ id: aula.id })}
                      className="flex items-center gap-1.5 text-xs text-destructive hover:underline">
                      <Trash2 className="w-3 h-3" /> Remover áudio
                    </button>
                  )}
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  {/* Upload de arquivo */}
                  <input ref={audioRef} type="file" accept="audio/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "audio"); e.target.value = ""; }} />
                  {uploadProgress !== null ? (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full border-emerald-300 text-emerald-700"
                      onClick={() => audioRef.current?.click()}>
                      <Music className="w-3.5 h-3.5 mr-1.5" /> Enviar arquivo de áudio
                    </Button>
                  )}
                  {/* Link externo */}
                  {showAudioLink ? (
                    <div className="space-y-2">
                      <Input placeholder="Cole o link do Google Drive..." value={audioLinkInput}
                        onChange={(e) => setAudioLinkInput(e.target.value)} className="text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => { if (audioLinkInput) setAudioLink.mutate({ id: aula.id, link: audioLinkInput }); }}
                          disabled={!audioLinkInput || setAudioLink.isPending}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Salvar link
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setShowAudioLink(false); setAudioLinkInput(""); }}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAudioLink(true)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <LinkIcon className="w-3.5 h-3.5" /> Usar link do Google Drive
                    </button>
                  )}
                </div>
              ) : <p className="text-sm text-muted-foreground">Nenhum áudio adicionado.</p>}
            </div>

            {/* Seção de PDF */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-semibold text-foreground">Material em PDF</span>
              </div>
              {hasPdf ? (
                <div className="space-y-2">
                  <a href={aula.pdfUrl!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 hover:bg-rose-100 transition-colors">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{aula.pdfNome ?? "Material da aula"}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                  {isAuthenticated && (
                    <button onClick={() => removePdf.mutate({ id: aula.id })}
                      className="flex items-center gap-1.5 text-xs text-destructive hover:underline">
                      <Trash2 className="w-3 h-3" /> Remover PDF
                    </button>
                  )}
                </div>
              ) : isAuthenticated ? (
                <div>
                  <input ref={pdfRef} type="file" accept="application/pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "pdf"); e.target.value = ""; }} />
                  <Button size="sm" variant="outline" className="w-full border-rose-300 text-rose-700"
                    onClick={() => pdfRef.current?.click()}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Enviar PDF da aula
                  </Button>
                </div>
              ) : <p className="text-sm text-muted-foreground">Nenhum PDF adicionado.</p>}
            </div>

            {/* Seção de Links */}
            <div className="pt-2 border-t border-border">
              <LinksSection aulaId={aula.id} isAuthenticated={isAuthenticated} />
            </div>

            {/* Comentários dos Alunos */}
            <ComentariosAdminExtra aulaId={aula.id} />

            {/* Deletar aula */}
            {isAuthenticated && (
              <div className="pt-2 border-t border-border flex justify-end">
                <button onClick={() => { if (confirm("Remover esta aula extra?")) deleteAula.mutate({ id: aula.id }); }}
                  className="flex items-center gap-1.5 text-xs text-destructive hover:underline">
                  <Trash2 className="w-3 h-3" /> Remover aula extra
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Comentários Admin (Aulas Extras) ────────────────────────────────────────

function ComentariosAdminExtra({ aulaId }: { aulaId: number }) {
  const utils = trpc.useUtils();
  const { data: comentarios = [] } = trpc.comentarios.list.useQuery({ tipo: "aulaExtra", referenciaId: aulaId });
  const deleteComentario = trpc.comentarios.delete.useMutation({
    onSuccess: () => utils.comentarios.list.invalidate({ tipo: "aulaExtra", referenciaId: aulaId }),
  });

  if ((comentarios as any[]).length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground">
        <MessageCircle className="w-3.5 h-3.5" />
        <span className="text-xs italic">Nenhum comentário dos alunos ainda.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5" />
        Comentários dos Alunos ({(comentarios as any[]).length})
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {(comentarios as any[]).map((c: any) => (
          <div key={c.id} className="flex items-start gap-2 bg-muted/40 rounded-xl p-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-foreground">{c.autor}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{c.texto}</p>
            </div>
            <Button size="sm" variant="ghost"
              onClick={() => deleteComentario.mutate({ id: c.id })}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0">
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Formulário de Nova Aula Extra ────────────────────────────────────────────
function NovaAulaForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [titulo, setTitulo] = useState("");
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [textoLivre, setTextoLivre] = useState("");
  const [data, setData] = useState("");
  // Áudio
  const [audioLink, setAudioLink] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  // Links
  const [links, setLinks] = useState<{ url: string; titulo: string }[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTitulo, setNewLinkTitulo] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const upsert = trpc.aulasExtras.upsert.useMutation({
    onError: () => toast.error("Erro ao criar aula extra"),
  });
  const setAudioLinkMutation = trpc.aulasExtras.setAudioLink.useMutation();
  const addLinkMutation = trpc.aulasExtras.addLink.useMutation();

  const handleCreate = async () => {
    if (!titulo) return;
    try {
      // 1. Criar a aula
      const result = await upsert.mutateAsync({
        titulo, tema: tema || null, descricao: descricao || null,
        textoLivre: textoLivre || null, data: data || null,
      });
      const aulaId = (result as any).id;

      // 2. Upload de áudio (arquivo)
      if (audioFile && aulaId) {
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("aulaExtraId", String(aulaId));
        formData.append("tipo", "audio");
        setUploadProgress(0);
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
          xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(xhr.responseText)); };
          xhr.onerror = () => reject(new Error("Erro de rede"));
          xhr.open("POST", "/api/upload/aula-extra");
          xhr.send(formData);
        });
        setUploadProgress(null);
      }

      // 3. Link de áudio (Google Drive)
      if (audioLink && aulaId) {
        await setAudioLinkMutation.mutateAsync({ id: aulaId, link: audioLink });
      }

      // 4. Upload de PDF
      if (pdfFile && aulaId) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        formData.append("aulaExtraId", String(aulaId));
        formData.append("tipo", "pdf");
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(xhr.responseText)); };
          xhr.onerror = () => reject(new Error("Erro de rede"));
          xhr.open("POST", "/api/upload/aula-extra");
          xhr.send(formData);
        });
      }

      // 5. Links externos
      for (const l of links) {
        if (l.url && aulaId) {
          await addLinkMutation.mutateAsync({ aulaExtraId: aulaId, url: l.url, titulo: l.titulo || undefined });
        }
      }

      utils.aulasExtras.list.invalidate();
      toast.success("Aula extra criada!");
      onClose();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
      setUploadProgress(null);
    }
  };

  return (
    <Card className="border-emerald-300 shadow-md">
      <CardContent className="p-4 space-y-3">
        <p className="font-semibold text-sm text-emerald-700">Nova Aula Extra</p>

        {/* Título */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Título *</label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Reflexão sobre a Páscoa" />
        </div>

        {/* Tema */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Tema</label>
          <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: Páscoa, Sacramento, Oração..." />
        </div>

        {/* Data */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Data</label>
          <Input value={data} onChange={(e) => setData(e.target.value)} placeholder="Ex: 20/04/2026" />
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Descrição / Conteúdo</label>
          <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o conteúdo abordado..." rows={3} />
        </div>

        {/* Texto livre */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Texto livre / Anotações</label>
          <Textarea value={textoLivre} onChange={(e) => setTextoLivre(e.target.value)}
            placeholder="Orações, reflexões, avisos, observações..." rows={3} />
        </div>

        {/* Áudio */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Áudio da Aula</span>
          </div>
          {/* Opção 1: arquivo */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Enviar arquivo (mp3, m4a, wav — máx. 100MB)</p>
            <input ref={audioRef} type="file" accept="audio/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); setAudioLink(""); } }} />
            {audioFile ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100 border border-emerald-200">
                <Music className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-800 flex-1 truncate">{audioFile.name}</span>
                <button onClick={() => { setAudioFile(null); if (audioRef.current) audioRef.current.value = ""; }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 w-full"
                onClick={() => audioRef.current?.click()}>
                <Music className="w-3.5 h-3.5 mr-1.5" /> Selecionar arquivo de áudio
              </Button>
            )}
          </div>
          {/* Opção 2: link Google Drive */}
          {!audioFile && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ou cole o link do Google Drive</p>
              <Input value={audioLink} onChange={(e) => setAudioLink(e.target.value)}
                placeholder="https://drive.google.com/..." className="text-sm" />
            </div>
          )}
        </div>

        {/* PDF */}
        <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Material em PDF</span>
          </div>
          <input ref={pdfRef} type="file" accept=".pdf,application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setPdfFile(f); }} />
          {pdfFile ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-100 border border-rose-200">
              <FileText className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="text-sm text-rose-800 flex-1 truncate">{pdfFile.name}</span>
              <button onClick={() => { setPdfFile(null); if (pdfRef.current) pdfRef.current.value = ""; }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 w-full"
              onClick={() => pdfRef.current?.click()}>
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Selecionar PDF
            </Button>
          )}
        </div>

        {/* Links externos */}
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Links e Referências</span>
          </div>
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-violet-100 border border-violet-200">
              <ExternalLink className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <span className="text-sm text-violet-800 flex-1 truncate">{l.titulo || l.url}</span>
              <button onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
          <div className="space-y-1.5">
            <Input value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="URL (ex: https://...)" className="text-sm" />
            <Input value={newLinkTitulo} onChange={(e) => setNewLinkTitulo(e.target.value)}
              placeholder="Título do link (opcional)" className="text-sm" />
            <Button size="sm" variant="outline" className="border-violet-300 text-violet-700 w-full"
              onClick={() => {
                if (newLinkUrl) {
                  setLinks([...links, { url: newLinkUrl, titulo: newLinkTitulo }]);
                  setNewLinkUrl(""); setNewLinkTitulo("");
                }
              }}
              disabled={!newLinkUrl}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar link
            </Button>
          </div>
        </div>

        {/* Barra de progresso */}
        {uploadProgress !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Enviando arquivo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2 pt-1">
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCreate}
            disabled={!titulo || upsert.isPending || uploadProgress !== null}>
            <Check className="w-4 h-4 mr-1.5" />
            {upsert.isPending || uploadProgress !== null ? "Criando..." : "Criar aula extra"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={upsert.isPending || uploadProgress !== null}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AulasExtras() {
  const { isAuthenticated } = useAuth();
  const { data: aulas = [], isLoading } = trpc.aulasExtras.list.useQuery();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Aulas Extras</h1>
          <p className="text-sm text-muted-foreground">
            {(aulas as AulaExtra[]).length} aula{(aulas as AulaExtra[]).length !== 1 ? "s" : ""} extra{(aulas as AulaExtra[]).length !== 1 ? "s" : ""}
            {" "}· não contam como presença
          </p>
        </div>
        {isAuthenticated && !showForm && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova
          </Button>
        )}
      </div>

      {/* Login CTA */}
      {!isAuthenticated && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3 flex items-center gap-3">
            <LogIn className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <p className="text-sm text-amber-800 flex-1">Entre para adicionar e editar aulas extras</p>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
              onClick={() => (window.location.href = getLoginUrl())}>
              Entrar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulário de nova aula */}
      {showForm && <NovaAulaForm onClose={() => setShowForm(false)} />}

      {/* Lista de aulas extras */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (aulas as AulaExtra[]).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma aula extra ainda.</p>
          {isAuthenticated && (
            <p className="text-xs mt-1">Clique em "Nova" para adicionar uma aula extra.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(aulas as AulaExtra[]).map((aula) => (
            <AulaExtraCard key={aula.id} aula={aula} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  );
}
