import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import Index from "@/pages/Index";
import SensorDataMonitoring from "@/pages/SensorDataMonitoring.tsx";
import NotFound from "@/pages/NotFound";
// import HydraulicCalculator from "@/components/HydraulicCalculator"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulator" element={<Index />} />
          <Route path="/monitoring" element={<SensorDataMonitoring />} /> 
          {/* <Route path="/HydraulicCalculator" element={<HydraulicCalculator />}/> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;