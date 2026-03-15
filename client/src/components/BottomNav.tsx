import { useLocation } from "wouter";
import { ClipboardList, Users, BookOpen, BarChart2, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/",        label: "Início",  icon: Home },
  { path: "/chamada", label: "Chamada", icon: ClipboardList },
  { path: "/alunos",  label: "Alunos",  icon: Users },
  { path: "/aulas",   label: "Aulas",   icon: BookOpen },
  { path: "/resumo",  label: "Resumo",  icon: BarChart2 },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg"
         style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-stretch max-w-2xl mx-auto">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location === path;
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium", active && "font-bold")}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
