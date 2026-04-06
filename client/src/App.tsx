import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chamada from "./pages/Chamada";
import Alunos from "./pages/Alunos";
import Aulas from "./pages/Aulas";
import Resumo from "./pages/Resumo";
import AulasExtras from "./pages/AulasExtras";
import PortalAluno from "./pages/PortalAluno";
import BottomNav from "./components/BottomNav";
import AppHeader from "./components/AppHeader";
import { useAuth } from "./_core/hooks/useAuth";

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = ["/portal"];

/**
 * Componente que protege rotas do painel admin.
 * Se o usuário não estiver autenticado, redireciona para /portal.
 * Enquanto o estado de autenticação está carregando, não renderiza nada
 * para evitar flash de conteúdo.
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();

  // Aguarda a verificação de autenticação antes de decidir
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/portal" />;
  }

  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const isPortal = location.startsWith("/portal");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isPortal && <AppHeader />}
      <main className={`flex-1 overflow-y-auto ${isPortal ? "" : "pb-nav"}`}>
        <Switch>
          {/* Rota pública: portal do catequizando */}
          <Route path="/portal" component={PortalAluno} />

          {/* Rotas protegidas: apenas para usuários autenticados */}
          <Route path="/">
            <ProtectedRoute component={Home} />
          </Route>
          <Route path="/chamada">
            <ProtectedRoute component={Chamada} />
          </Route>
          <Route path="/alunos">
            <ProtectedRoute component={Alunos} />
          </Route>
          <Route path="/aulas">
            <ProtectedRoute component={Aulas} />
          </Route>
          <Route path="/resumo">
            <ProtectedRoute component={Resumo} />
          </Route>
          <Route path="/aulas-extras">
            <ProtectedRoute component={AulasExtras} />
          </Route>

          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isPortal && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
