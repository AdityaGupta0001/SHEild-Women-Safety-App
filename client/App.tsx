
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Index from "./pages/Index";
import SOSPage from "./pages/SOSPage";
import LocateMe from "./pages/LocateMe";
import SafePlaces from "./pages/SafePlaces";
import Profile from "./pages/Profile";
import CollabPage from "./pages/CollabPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/sos" element={<SOSPage />} />
          <Route path="/locate-me" element={<LocateMe />} />
          <Route path="/safe-places" element={<SafePlaces />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/collab" element={<CollabPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
