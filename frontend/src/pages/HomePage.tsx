import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calculator, Activity } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Hydraulic Press Control Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced monitoring, simulation, and AI-powered diagnostics for hydraulic press systems
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary/20" onClick={() => navigate('/simulator')}>
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Hydraulic Press Simulator</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
              <br/>
              <br/>
                Design and simulate hydraulic press systems with custom parameters, analyze performance, and get AI diagnostics.
              <br/>
              <br/>
              
              </p>
              <Button className="w-full ">
                Launch Simulator
              </Button>
            </CardContent>
          </Card>

          


          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary/20" onClick={() => navigate('/HydraulicCalculator')}>
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-secondary/10 rounded-full w-fit mb-4">
                <Activity className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Hydraulic Simulator Calculator</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Calculate hydraulic system parameters such as pressure, flow rate, and force based on custom inputs. Simulate real-time scenarios to optimize system design and performance with precision.
              </p>
              <Button className="w-full">
                Calculator Data
              </Button>
            </CardContent>
          </Card>


          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary/20" onClick={() => navigate('/monitoring')}>
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-secondary/10 rounded-full w-fit mb-4">
                <Activity className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Sensor Data Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
              <br/>
              <br/>

                Upload and analyze real-world sensor data from your hydraulic systems to identify issues and receive AI-powered advice.
              <br/>
              
              </p>
              <Button className="w-full">
                Analyze Sensor Data
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
};

export default HomePage;

