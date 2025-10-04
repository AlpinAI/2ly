import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard immediately
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono flex items-center justify-center">
      <div className="text-center">
        <img src="/favicon.ico" alt="2LY Logo" className="h-12 w-12 mx-auto mb-4" />
        <div className="text-xl font-bold text-white mb-2">2LY</div>
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    </div>
  );
};

export default Index;