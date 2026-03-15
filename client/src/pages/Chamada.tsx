import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, LogIn, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Status = "P" | "F" | "J";

const STATUS_CONFIG = {
  P: { label: "P", full: "Presente",    bg: "bg-green-500 hover:bg-green-600",  text: "text-white", badge: "bg-green-100 text-green-800 border-green-300" },
  F: { label: "F", full: "Falta",       bg: "bg-red-500 hover:bg-red-600",      text: "text-white", badge: "bg-red-100 text-red-800 border-red-300" },
  J: { label: "J", full: "Justificado", bg: "bg-yellow-400 hover:bg-yellow-500",text: "text-yellow-900", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
};

export default function Chamada() {
  const { isAuthenticated } = useAuth();
  const [aulaIdx, setAulaIdx] = useState(0);

  const { data: aulas = [] } = trpc.aulas.list.useQuery();
  const { data: alunos = [] } = trpc.alunos.list.useQuery();
  const { data: presencas = [], refetch } = trpc.presencas.list.useQuery();

  const utils = trpc.useUtils();
  const upsert = trpc.presencas.upsert.useMutation({
    onSuccess: () => { utils.presencas.list.invalidate(); },
    onError: () => toast.error("Erro ao salvar presença"),
  });
  const remove = trpc.presencas.remove.useMutation({
    onSuccess: () => { utils.presencas.list.invalidate(); },
    onError: () => toast.error("Erro ao remover presença"),
  });

  const aula = aulas[aulaIdx];
  const aulaNumero = aula?.numero ?? 1;

  // Mapa de presenças para a aula atual
  const presencaMap = useMemo(() => {
    const m = new Map<number, Status>();
    for (const p of presencas) {
      if (p.aulaNumero === aulaNumero) m.set(p.alunoSlot, p.status as Status);
    }
    return m;
  }, [presencas, aulaNumero]);

  const alunosCadastrados = alunos.filter((a) => a.nome);
  const presentes = Array.from(presencaMap.values()).filter((s) => s === "P").length;
  const faltas   = Array.from(presencaMap.values()).filter((s) => s === "F").length;
  const justif   = Array.from(presencaMap.values()).filter((s) => s === "J").length;

  const handleStatus = (slot: number, status: Status) => {
    if (!isAuthenticated) {
      toast.error("Entre para registrar presenças");
      return;
    }
    const current = presencaMap.get(slot);
    if (current === status) {
      // Toggle off
      remove.mutate({ alunoSlot: slot, aulaNumero });
    } else {
      upsert.mutate({ alunoSlot: slot, aulaNumero, status });
    }
  };

  const marcarTodos = (status: Status) => {
    if (!isAuthenticated) { toast.error("Entre para registrar presenças"); return; }
    const alunosComNome = alunos.filter((a) => a.nome);
    Promise.all(alunosComNome.map((a) => upsert.mutateAsync({ alunoSlot: a.slot, aulaNumero, status })))
      .then(() => { utils.presencas.list.invalidate(); toast.success(`Todos marcados como ${STATUS_CONFIG[status].full}`); })
      .catch(() => toast.error("Erro ao marcar todos"));
  };

  if (!aulas.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Seletor de aula */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost" size="icon"
              onClick={() => setAulaIdx((i) => Math.max(0, i - 1))}
              disabled={aulaIdx === 0}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Aula {aulaNumero} de {aulas.length}
              </p>
              <p className="text-2xl font-bold text-primary">{aula?.data}</p>
              {aula?.descricao && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{aula.descricao}</p>
              )}
            </div>
            <Button
              variant="ghost" size="icon"
              onClick={() => setAulaIdx((i) => Math.min(aulas.length - 1, i + 1))}
              disabled={aulaIdx === aulas.length - 1}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Contadores */}
          <div className="flex justify-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> {presentes} presentes
            </span>
            <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
              {faltas} faltas
            </span>
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
              {justif} justif.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      {isAuthenticated && alunosCadastrados.length > 0 && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8 border-green-300 text-green-700 hover:bg-green-50"
            onClick={() => marcarTodos("P")}>
            ✓ Todos presentes
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => marcarTodos("F")}>
            ✗ Todos faltaram
          </Button>
        </div>
      )}

      {/* Lista de alunos */}
      {!isAuthenticated && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3 flex items-center gap-3">
            <LogIn className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 flex-1">Entre para registrar presenças</p>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs"
              onClick={() => (window.location.href = getLoginUrl())}>
              Entrar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {alunos.map((aluno) => {
          const status = presencaMap.get(aluno.slot);
          const hasName = !!aluno.nome;
          return (
            <Card key={aluno.slot} className={cn(
              "transition-all",
              !hasName && "opacity-40",
              status === "P" && "border-green-300 bg-green-50",
              status === "F" && "border-red-300 bg-red-50",
              status === "J" && "border-yellow-300 bg-yellow-50",
            )}>
              <CardContent className="p-3 flex items-center gap-3">
                {/* Número */}
                <span className="text-xs font-bold text-muted-foreground w-5 text-center flex-shrink-0">
                  {aluno.slot}
                </span>

                {/* Nome */}
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm truncate", !hasName && "text-muted-foreground italic")}>
                    {aluno.nome ?? "— vazio —"}
                  </p>
                  {aluno.telefone && (
                    <p className="text-xs text-muted-foreground truncate">{aluno.telefone}</p>
                  )}
                </div>

                {/* Botões P/F/J */}
                {hasName && (
                  <div className="flex gap-1 flex-shrink-0">
                    {(["P", "F", "J"] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatus(aluno.slot, s)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-sm font-bold transition-all active:scale-90",
                          status === s
                            ? STATUS_CONFIG[s].bg + " " + STATUS_CONFIG[s].text + " shadow-md scale-105"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {alunosCadastrados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum aluno cadastrado ainda.</p>
          <p className="text-xs mt-1">Vá em Alunos para adicionar.</p>
        </div>
      )}
    </div>
  );
}
