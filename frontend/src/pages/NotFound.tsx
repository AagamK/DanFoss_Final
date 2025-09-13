import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <p className="text-2xl md:text-3xl font-light text-muted-foreground mt-4">
          Oops! Page not found.
        </p>
        <p className="mt-2 text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button onClick={() => navigate("/")} className="mt-6">
          Go back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
