import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Users, BookOpen, BarChart2, LogIn, Share2, Droplets, Flame, Star, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const VATICANO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663085088869/Te4tc5XKf7enc9Yair9yqx/vaticano_2c2c454e.webp";

const quickLinks = [
  { path: "/chamada", label: "Chamada",  icon: ClipboardList, color: "bg-blue-500",   desc: "Registrar presença" },
  { path: "/alunos",  label: "Alunos",   icon: Users,         color: "bg-violet-500", desc: "Gerenciar alunos" },
  { path: "/aulas",   label: "Aulas",    icon: BookOpen,      color: "bg-emerald-500",desc: "Conteúdo e áudio" },
  { path: "/resumo",  label: "Resumo",   icon: BarChart2,     color: "bg-amber-500",  desc: "Frequência geral" },
];

type Sacramento = "batismo" | "primeira_comunhao" | "crisma" | "matrimonio";

const SACRAMENTOS_CONFIG: Record<Sacramento, {
  label: string;
  icon: React.ElementType;
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  tagBg: string;
  tagText: string;
}> = {
  batismo: {
    label: "Batismo",
    icon: Droplets,
    bg: "bg-sky-50",
    border: "border-sky-200",
    iconBg: "bg-sky-500",
    iconColor: "text-white",
    titleColor: "text-sky-800",
    tagBg: "bg-sky-100",
    tagText: "text-sky-700",
  },
  primeira_comunhao: {
    label: "1ª Comunhão",
    icon: Star,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    titleColor: "text-amber-800",
    tagBg: "bg-amber-100",
    tagText: "text-amber-700",
  },
  crisma: {
    label: "Crisma",
    icon: Flame,
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-500",
    iconColor: "text-white",
    titleColor: "text-rose-800",
    tagBg: "bg-rose-100",
    tagText: "text-rose-700",
  },
  matrimonio: {
    label: "Matrimônio",
    icon: Heart,
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-500",
    iconColor: "text-white",
    titleColor: "text-purple-800",
    tagBg: "bg-purple-100",
    tagText: "text-purple-700",
  },
};

const ORDEM_SACRAMENTOS: Sacramento[] = ["batismo", "primeira_comunhao", "crisma", "matrimonio"];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: resumo } = trpc.resumo.frequencia.useQuery();
  const { data: alunosData = [] } = trpc.alunos.list.useQuery();

  const totalAlunos = resumo?.filter((a) => a.nome).length ?? 0;
  const mediaFreq = resumo
    ? Math.round(
        resumo
          .filter((a) => a.nome && a.pct !== null)
          .reduce((acc, a) => acc + (a.pct ?? 0), 0) /
          Math.max(resumo.filter((a) => a.nome && a.pct !== null).length, 1)
      )
    : null;

  // Agrupar alunos por sacramento
  const porSacramento = ORDEM_SACRAMENTOS.reduce<Record<Sacramento, string[]>>(
    (acc, s) => {
      acc[s] = (alunosData as { nome: string | null; sacramentos: string[] }[])
        .filter((a) => a.nome && a.sacramentos?.includes(s))
        .map((a) => a.nome as string);
      return acc;
    },
    { batismo: [], primeira_comunhao: [], crisma: [], matrimonio: [] }
  );

  const sacramentosComAlunos = ORDEM_SACRAMENTOS.filter((s) => porSacramento[s].length > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      {/* ── Hero Banner ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "220px" }}>
        <img
          src={VATICANO_URL}
          alt="Basílica de São Pedro"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ objectPosition: "center 30%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,30,80,0.45) 0%, rgba(10,30,80,0.55) 50%, rgba(255,255,255,1) 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-8 px-4 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-lg"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
          >
            <span className="text-white text-2xl">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow-md tracking-wide">
            Lista de Chamada
          </h1>
          <p className="text-blue-100 text-sm drop-shadow mt-0.5">Catequese 2026 / 2027</p>
          {isAuthenticated && (
            <p className="text-blue-200 text-xs mt-1 drop-shadow">
              Olá,{" "}
              <span className="font-semibold text-white">
                {user?.name ?? "catequista"}
              </span>
              !
            </p>
          )}
        </div>
      </div>

      {/* ── Conteúdo abaixo do banner ── */}
      <div className="px-4 space-y-6">

        {/* Cards de estatísticas */}
        {totalAlunos > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-700">{totalAlunos}</p>
                <p className="text-xs text-blue-600 mt-1">Alunos cadastrados</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-100 bg-emerald-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">
                  {mediaFreq !== null ? `${mediaFreq}%` : "–"}
                </p>
                <p className="text-xs text-emerald-600 mt-1">Frequência média</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Sacramentos ── */}
        {sacramentosComAlunos.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Sacramentos
            </h2>
            <div className="space-y-3">
              {sacramentosComAlunos.map((sac) => {
                const cfg = SACRAMENTOS_CONFIG[sac];
                const Icon = cfg.icon;
                const nomes = porSacramento[sac];
                return (
                  <Card key={sac} className={`border-2 ${cfg.border} ${cfg.bg} overflow-hidden`}>
                    <CardContent className="p-0">
                      {/* Cabeçalho do sacramento */}
                      <div className={`flex items-center gap-3 px-4 py-3 border-b ${cfg.border}`}>
                        <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold ${cfg.titleColor}`}>{cfg.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {nomes.length} catequizando{nomes.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className={`text-2xl font-black ${cfg.titleColor} opacity-30`}>
                          {nomes.length}
                        </span>
                      </div>
                      {/* Lista de nomes */}
                      <div className="px-4 py-3 flex flex-wrap gap-2">
                        {nomes.map((nome) => (
                          <span
                            key={nome}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.tagBg} ${cfg.tagText} border ${cfg.border}`}
                          >
                            {nome}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Acesso rápido */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Acesso rápido
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(({ path, label, icon: Icon, color, desc }) => (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Login CTA se não autenticado */}
        {!isAuthenticated && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                <LogIn className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">Modo somente leitura</p>
                <p className="text-xs text-amber-700">Entre para registrar presenças e editar dados</p>
              </div>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Entrar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Link do portal do aluno */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900">Portal do Catequizando</p>
                <p className="text-xs text-blue-700 mb-2">Compartilhe este link com os alunos para que possam ver as aulas, áudios e sua frequência</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setLocation("/portal")}>
                    Ver portal
                  </Button>
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-700"
                    onClick={() => {
                      const url = `${window.location.origin}/portal`;
                      if (navigator.share) {
                        navigator.share({ title: "Catequese 2026/2027", url });
                      } else {
                        navigator.clipboard.writeText(url);
                        import("sonner").then(({ toast }) => toast.success("Link copiado!"));
                      }
                    }}>
                    Copiar link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center text-xs text-muted-foreground pb-2">
          <p>21 aulas · 25 alunos · 4 sacramentos</p>
        </div>
      </div>
    </div>
  );
}
