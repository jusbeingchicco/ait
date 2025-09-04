import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {/* Use the provided logo (place logo at /logo.png in the public folder) */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-white">
              <img
                src="/logo.png"
                alt="AIT logo"
                className="w-full h-full object-contain app-logo"
                data-testid="img-logo"
              />
            </div>
            <span className="text-2xl font-bold text-foreground">AIT</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Agricultural Innovations & Technology
          </h1>
          <p className="text-muted-foreground text-lg">
            Connecting farmers directly with buyers
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-tractor text-primary"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">For Farmers</h3>
                  <p className="text-sm text-muted-foreground">
                    List your produce and reach buyers directly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-basket text-accent"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">For Buyers</h3>
                  <p className="text-sm text-muted-foreground">
                    Find fresh local produce at fair prices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-secondary"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Verified Sellers</h3>
                  <p className="text-sm text-muted-foreground">
                    Trust and quality guaranteed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Button 
            className="w-full py-6 text-lg font-semibold"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Get Started
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Join thousands of farmers and buyers in Zimbabwe
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-map-marker-alt text-primary text-xl"></i>
            </div>
            <h4 className="font-semibold text-foreground">Location Based</h4>
            <p className="text-xs text-muted-foreground">Find farms near you</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-mobile-alt text-primary text-xl"></i>
            </div>
            <h4 className="font-semibold text-foreground">Mobile First</h4>
            <p className="text-xs text-muted-foreground">Works offline too</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-handshake text-primary text-xl"></i>
            </div>
            <h4 className="font-semibold text-foreground">Direct Trade</h4>
            <p className="text-xs text-muted-foreground">No middlemen</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-shield-alt text-primary text-xl"></i>
            </div>
            <h4 className="font-semibold text-foreground">Secure</h4>
            <p className="text-xs text-muted-foreground">Safe payments</p>
          </div>
        </div>
      </div>
    </div>
  );
}