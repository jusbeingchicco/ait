import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import FarmerDashboard from "@/pages/farmer-dashboard";
import BuyerMarketplace from "@/pages/buyer-marketplace";
import ProductDetail from "@/pages/product-detail";
import AddListing from "@/pages/add-listing";
import OrderManagement from "@/pages/order-management";
import Profile from "@/pages/profile";
import WelcomeAnimation from "@/components/welcome-animation";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/farmer-dashboard" component={FarmerDashboard} />
          <Route path="/marketplace" component={BuyerMarketplace} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/add-listing" component={AddListing} />
          <Route path="/orders" component={OrderManagement} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <WelcomeAnimation />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;