import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Phone, LogIn, UserPlus, Camera, Trash2, FileDown, ChevronDown, ChevronUp, Image } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Sacramento = "batismo" | "primeira_comunhao" | "crisma" | "matrimonio";

const SACRAMENTOS: { key: Sacramento; label: string; short: string; color: string }[] = [
  { key: "batismo",          label: "Batismo",     short: "Bat", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "primeira_comunhao",label: "1ª Comunhão", short: "Com", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { key: "crisma",           label: "Crisma",      short: "Cri", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "matrimonio",       label: "Matrimônio",  short: "Mat", color: "bg-rose-100 text-rose-800 border-rose-300" },
];

type AlunoEdit = { nome: string; telefone: string; sacramentos: Sacramento[] };

type Foto = { id: number; ordem: number; url: string; nomeArquivo: string | null };

// ─── Galeria de fotos de um aluno ────────────────────────────────────────────

function FotosAluno({ slot, nome, isAuthenticated }: { slot: number; nome: string | null; isAuthenticated: boolean }) {
  const { data: fotos = [], refetch } = trpc.fotos.list.useQuery({ slot });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFoto = async (file: File) => {
    if (fotos.length >= 7) { toast.error("Máximo de 7 fotos por aluno"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Foto muito grande. Máximo: 20MB"); return; }

    setUploading(true);
    setUploadProgress(0);

    const ordem = fotos.length + 1;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("slot", String(slot));
    formData.append("ordem", String(ordem));

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload/foto-aluno");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(JSON.parse(xhr.responseText)?.error ?? "Erro no upload"));
        };
        xhr.onerror = () => reject(new Error("Falha na conexão"));
        xhr.send(formData);
      });
      await refetch();
      toast.success("Foto enviada!");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar foto");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFoto = async (id: number) => {
    try {
      const res = await fetch(`/api/upload/foto-aluno/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      await refetch();
      toast.success("Foto removida");
    } catch {
      toast.error("Erro ao remover foto");
    }
  };

  const handleGerarPdf = async () => {
    if (fotos.length === 0) { toast.error("Nenhuma foto para gerar PDF"); return; }
    setGerandoPdf(true);
    try {
      // Importa jsPDF dinamicamente
      const jsPDFModule = await import("jspdf");
        const jsPDF = jsPDFModule.default ?? (jsPDFModule as any).jsPDF;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 10;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Documentos – ${nome ?? `Aluno ${slot}`}`, margin, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Catequese 2026/2027  |  ${fotos.length} foto(s)`, margin, 28);

      let y = 38;
      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];
        // Carrega imagem via fetch para base64
        const resp = await fetch(foto.url);
        const blob = await resp.blob();
        const base64 = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const imgW = pageW - margin * 2;
        const imgH = 120;

        if (y + imgH > pageH - margin) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Foto ${i + 1}${foto.nomeArquivo ? ` – ${foto.nomeArquivo}` : ""}`, margin, y);
        y += 5;

        doc.addImage(base64, "JPEG", margin, y, imgW, imgH);
        y += imgH + 8;
      }

      doc.save(`documentos-${(nome ?? `aluno-${slot}`).replace(/\s+/g, "-").toLowerCase()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Image className="w-3 h-3" /> Documentos ({fotos.length}/7)
        </p>
        <div className="flex gap-1.5">
          {fotos.length > 0 && (
            <Button size="sm" variant="outline"
              onClick={handleGerarPdf}
              disabled={gerandoPdf}
              className="h-7 px-2 text-[10px] border-green-300 text-green-700 hover:bg-green-50">
              {gerandoPdf ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  Gerando...
                </span>
              ) : (
                <><FileDown className="w-3 h-3 mr-1" /> Gerar PDF</>
              )}
            </Button>
          )}
          {isAuthenticated && fotos.length < 7 && (
            <Button size="sm" variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-7 px-2 text-[10px]">
              {uploading ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  {uploadProgress}%
                </span>
              ) : (
                <><Camera className="w-3 h-3 mr-1" /> Adicionar foto</>
              )}
            </Button>
          )}
        </div>
      </div>

      {uploading && (
        <div className="mb-2 h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {fotos.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed border-border rounded-xl">
          <Camera className="w-7 h-7 mx-auto text-muted-foreground/30 mb-1" />
          <p className="text-[10px] text-muted-foreground">Nenhuma foto de documento</p>
          {isAuthenticated && (
            <Button size="sm" variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 h-7 text-[10px] text-primary">
              Adicionar primeira foto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {fotos.map((foto, idx) => (
            <div key={foto.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={foto.url}
                alt={`Documento ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">{idx + 1}</span>
                {isAuthenticated && (
                  <button
                    onClick={() => handleDeleteFoto(foto.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isAuthenticated && fotos.length < 7 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px]">Adicionar</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFoto(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Alunos() {
  const { isAuthenticated } = useAuth();
  const { data: alunos = [] } = trpc.alunos.list.useQuery();
  const utils = trpc.useUtils();
  const upsert = trpc.alunos.upsert.useMutation({
    onSuccess: () => { utils.alunos.list.invalidate(); toast.success("Aluno salvo!"); },
    onError: () => toast.error("Erro ao salvar aluno"),
  });

  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<AlunoEdit>({ nome: "", telefone: "", sacramentos: [] });
  const [expandedFotos, setExpandedFotos] = useState<number | null>(null);

  const startEdit = (slot: number) => {
    if (!isAuthenticated) { toast.error("Entre para editar alunos"); return; }
    const a = alunos.find((x) => x.slot === slot);
    setForm({
      nome: a?.nome ?? "",
      telefone: a?.telefone ?? "",
      sacramentos: (a?.sacramentos as Sacramento[]) ?? [],
    });
    setEditing(slot);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = (slot: number) => {
    upsert.mutate({
      slot,
      nome: form.nome.trim() || null,
      telefone: form.telefone.trim() || null,
      sacramentos: form.sacramentos,
    });
    setEditing(null);
  };

  const toggleSacramento = (s: Sacramento) => {
    setForm((prev) => ({
      ...prev,
      sacramentos: prev.sacramentos.includes(s)
        ? prev.sacramentos.filter((x) => x !== s)
        : [...prev.sacramentos, s],
    }));
  };

  const cadastrados = alunos.filter((a) => a.nome).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Alunos</h2>
          <p className="text-xs text-muted-foreground">{cadastrados} de 25 cadastrados</p>
        </div>
        {!isAuthenticated && (
          <Button size="sm" className="bg-primary text-primary-foreground h-8 text-xs"
            onClick={() => (window.location.href = getLoginUrl())}>
            <LogIn className="w-3 h-3 mr-1" /> Entrar
          </Button>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {alunos.map((aluno) => {
          const isEdit = editing === aluno.slot;
          const hasName = !!aluno.nome;
          const sacramentos = (aluno.sacramentos as Sacramento[]) ?? [];
          const showFotos = expandedFotos === aluno.slot;

          return (
            <Card key={aluno.slot} className={cn(
              "transition-all",
              isEdit && "border-primary ring-1 ring-primary/30",
              !hasName && "border-dashed opacity-60"
            )}>
              <CardContent className="p-3">
                {isEdit ? (
                  /* Modo edição */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center">{aluno.slot}</span>
                      <Input
                        placeholder="Nome do aluno"
                        value={form.nome}
                        onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                        className="h-9 text-sm flex-1"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-2 pl-7">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <Input
                        placeholder="Telefone"
                        value={form.telefone}
                        onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                        className="h-9 text-sm flex-1"
                        type="tel"
                      />
                    </div>
                    <div className="pl-7">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Sacramentos:</p>
                      <div className="flex flex-wrap gap-2">
                        {SACRAMENTOS.map((s) => (
                          <button
                            key={s.key}
                            onClick={() => toggleSacramento(s.key)}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                              form.sacramentos.includes(s.key)
                                ? s.color + " shadow-sm scale-105"
                                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pl-7">
                      <Button size="sm" onClick={() => saveEdit(aluno.slot)}
                        className="bg-primary text-primary-foreground h-8 text-xs flex-1">
                        <Check className="w-3 h-3 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 text-xs">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Modo visualização */
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center flex-shrink-0">
                        {aluno.slot}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold text-sm truncate", !hasName && "text-muted-foreground italic")}>
                          {aluno.nome ?? "— vazio —"}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {aluno.telefone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />{aluno.telefone}
                            </span>
                          )}
                          {sacramentos.map((s) => {
                            const cfg = SACRAMENTOS.find((x) => x.key === s);
                            return cfg ? (
                              <span key={s} className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-semibold", cfg.color)}>
                                {cfg.short}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {hasName && (
                          <Button size="icon" variant="ghost"
                            onClick={() => setExpandedFotos(showFotos ? null : aluno.slot)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary">
                            {showFotos ? <ChevronUp className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                        {isAuthenticated && (
                          <Button size="icon" variant="ghost" onClick={() => startEdit(aluno.slot)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary">
                            {hasName ? <Pencil className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Galeria de fotos expandível */}
                    {showFotos && hasName && (
                      <FotosAluno slot={aluno.slot} nome={aluno.nome} isAuthenticated={isAuthenticated} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
