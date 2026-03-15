import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function FreqBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-400 font-medium">–</span>;
  const cls =
    pct >= 75 ? "text-green-700 bg-green-100 border-green-300" :
    pct >= 50 ? "text-yellow-700 bg-yellow-100 border-yellow-300" :
                "text-red-700 bg-red-100 border-red-300";
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", cls)}>
      {pct}%
    </span>
  );
}

export default function Resumo() {
  const { data: resumo = [], isLoading } = trpc.resumo.frequencia.useQuery();

  const alunosCadastrados = resumo.filter((a) => a.nome);
  const totalPresentes = alunosCadastrados.reduce((s, a) => s + a.presentes, 0);
  const totalFaltas    = alunosCadastrados.reduce((s, a) => s + a.faltas, 0);
  const totalJustif    = alunosCadastrados.reduce((s, a) => s + a.justificadas, 0);
  const mediaFreq = alunosCadastrados.length > 0
    ? Math.round(
        alunosCadastrados
          .filter((a) => a.pct !== null)
          .reduce((s, a) => s + (a.pct ?? 0), 0) /
          Math.max(alunosCadastrados.filter((a) => a.pct !== null).length, 1)
      )
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Resumo de Frequência</h2>
        <p className="text-xs text-muted-foreground">Visão geral de todos os alunos</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{alunosCadastrados.length}</p>
              <p className="text-xs text-blue-600">Alunos</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "border",
          mediaFreq === null ? "border-gray-100 bg-gray-50" :
          mediaFreq >= 75 ? "border-green-100 bg-green-50" :
          mediaFreq >= 50 ? "border-yellow-100 bg-yellow-50" :
                            "border-red-100 bg-red-50"
        )}>
          <CardContent className="p-3 flex items-center gap-3">
            <BarChart2 className={cn("w-8 h-8 flex-shrink-0",
              mediaFreq === null ? "text-gray-400" :
              mediaFreq >= 75 ? "text-green-500" :
              mediaFreq >= 50 ? "text-yellow-500" : "text-red-500"
            )} />
            <div>
              <p className={cn("text-2xl font-bold",
                mediaFreq === null ? "text-gray-400" :
                mediaFreq >= 75 ? "text-green-700" :
                mediaFreq >= 50 ? "text-yellow-700" : "text-red-700"
              )}>{mediaFreq !== null ? `${mediaFreq}%` : "–"}</p>
              <p className="text-xs text-muted-foreground">Frequência média</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50">
          <CardContent className="p-3 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-green-700">{totalPresentes}</p>
              <p className="text-xs text-green-600">Presenças totais</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50">
          <CardContent className="p-3 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-600">{totalFaltas}</p>
              <p className="text-xs text-red-600">Faltas totais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥75% boa</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 50–74% regular</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;50% atenção</span>
      </div>

      {/* Tabela de alunos */}
      {alunosCadastrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum aluno cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            <span>Aluno</span>
            <span className="text-center w-8">P</span>
            <span className="text-center w-8">F</span>
            <span className="text-center w-8">J</span>
            <span className="text-center w-12">%</span>
          </div>

          {alunosCadastrados
            .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1))
            .map((aluno) => (
              <Card key={aluno.slot} className={cn(
                "border",
                aluno.pct === null ? "border-gray-100" :
                aluno.pct >= 75 ? "border-green-100" :
                aluno.pct >= 50 ? "border-yellow-100" :
                                  "border-red-100"
              )}>
                <CardContent className="p-3">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{aluno.nome}</p>
                      {aluno.telefone && (
                        <p className="text-xs text-muted-foreground truncate">{aluno.telefone}</p>
                      )}
                    </div>
                    <span className="w-8 text-center text-sm font-bold text-green-700">{aluno.presentes}</span>
                    <span className="w-8 text-center text-sm font-bold text-red-600">{aluno.faltas}</span>
                    <span className="w-8 text-center text-sm font-bold text-yellow-600">{aluno.justificadas}</span>
                    <div className="w-12 flex justify-center">
                      <FreqBadge pct={aluno.pct} />
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  {aluno.total > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          (aluno.pct ?? 0) >= 75 ? "bg-green-500" :
                          (aluno.pct ?? 0) >= 50 ? "bg-yellow-400" : "bg-red-500"
                        )}
                        style={{ width: `${aluno.pct ?? 0}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
