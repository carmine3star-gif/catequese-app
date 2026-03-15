import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Phone, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Sacramento = "batismo" | "primeira_comunhao" | "crisma" | "matrimonio";

const SACRAMENTOS: { key: Sacramento; label: string; short: string; color: string }[] = [
  { key: "batismo",          label: "Batismo",        short: "Bat", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "primeira_comunhao",label: "1ª Comunhão",    short: "Com", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { key: "crisma",           label: "Crisma",         short: "Cri", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "matrimonio",       label: "Matrimônio",     short: "Mat", color: "bg-rose-100 text-rose-800 border-rose-300" },
];

type AlunoEdit = { nome: string; telefone: string; sacramentos: Sacramento[] };

export default function Alunos() {
  const { isAuthenticated } = useAuth();
  const { data: alunos = [], refetch } = trpc.alunos.list.useQuery();
  const utils = trpc.useUtils();
  const upsert = trpc.alunos.upsert.useMutation({
    onSuccess: () => { utils.alunos.list.invalidate(); toast.success("Aluno salvo!"); },
    onError: () => toast.error("Erro ao salvar aluno"),
  });

  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<AlunoEdit>({ nome: "", telefone: "", sacramentos: [] });

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
                    {/* Sacramentos */}
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
                    {/* Ações */}
                    <div className="flex gap-2 pl-7">
                      <Button size="sm" onClick={() => saveEdit(aluno.slot)}
                        className="bg-primary text-primary-foreground h-8 text-xs flex-1">
                        <Check className="w-3 h-3 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}
                        className="h-8 text-xs">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Modo visualização */
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
                    {isAuthenticated && (
                      <Button size="icon" variant="ghost" onClick={() => startEdit(aluno.slot)}
                        className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-primary">
                        {hasName ? <Pencil className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      </Button>
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
