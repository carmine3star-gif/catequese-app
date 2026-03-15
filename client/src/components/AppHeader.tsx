import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Cross } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AppHeader() {
  const { user, isAuthenticated } = useAuth();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Saiu com sucesso");
      window.location.reload();
    },
  });

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">✝</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Catequese</p>
            <p className="text-xs text-primary-foreground/70 leading-tight">2026 / 2027</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary-foreground/80 hidden sm:block max-w-[120px] truncate">
                {user?.name ?? user?.email}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/20 h-8 px-2"
                onClick={() => logout.mutate()}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/20 h-8 px-3 text-xs"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <LogIn className="w-4 h-4 mr-1" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
