import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
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

function Router() {
  const [location] = useLocation();
  const isPortal = location.startsWith("/portal");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isPortal && <AppHeader />}
      <main className={`flex-1 overflow-y-auto ${isPortal ? "" : "pb-nav"}`}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/chamada" component={Chamada} />
          <Route path="/alunos" component={Alunos} />
          <Route path="/aulas" component={Aulas} />
          <Route path="/resumo" component={Resumo} />
          <Route path="/aulas-extras" component={AulasExtras} />
          <Route path="/portal" component={PortalAluno} />
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
