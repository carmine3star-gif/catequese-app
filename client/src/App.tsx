import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 pb-nav overflow-y-auto">
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
      <BottomNav />
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
