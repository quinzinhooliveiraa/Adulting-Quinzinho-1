import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import Journal from "@/pages/Journal";
import Questions from "@/pages/Questions";
import Journey from "@/pages/Journey";
import Book from "@/pages/Book";

function Router() {
  return (
    <MobileLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/journal" component={Journal} />
        <Route path="/questions" component={Questions} />
        <Route path="/journey" component={Journey} />
        <Route path="/book" component={Book} />
        <Route component={NotFound} />
      </Switch>
    </MobileLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="casa-dos-20-theme" attribute="class">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
