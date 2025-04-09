
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import SheildButton from '@/components/SheildButton';
import { Shield, MapPin, Users, Bell, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    // If logged in, redirect to home
    if (token) {
      navigate('/home');
    }
  }, [navigate]);

  const features = [
    {
      icon: <Shield className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "SOS Emergency",
      description: "Immediate alerts to emergency contacts",
    },
    {
      icon: <MapPin className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "Safe Navigation",
      description: "Find the safest routes to your destination",
    },
    {
      icon: <Users className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "Travel Partners",
      description: "Connect with verified companions",
    },
    {
      icon: <Bell className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "Safety Reports",
      description: "Check and report safety incidents",
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sheild-darkblue to-black flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-5 text-center">
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
          Your Personal Safety Companion
        </h1>
        
        <p className="text-gray-300 text-base mb-8 max-w-md px-4">
          SHEild provides tools and features designed to keep women safe in any situation
        </p>
        
        <div className="space-y-3 w-full max-w-xs px-4">
          <SheildButton 
            onClick={() => navigate('/login')}
            fullWidth
            size={isMobile ? "md" : "lg"}
          >
            Login
          </SheildButton>
          
          <SheildButton 
            onClick={() => navigate('/signup')}
            variant="secondary"
            fullWidth
            size={isMobile ? "md" : "lg"}
          >
            Sign Up
          </SheildButton>
          
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center justify-center text-sheild-lightpurple hover:text-white transition-colors mt-2"
          >
            Continue as Guest
            <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
        
        <div className="mt-12 grid grid-cols-2 gap-4 md:gap-6 max-w-xs md:max-w-sm">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-2">
              <div className="mx-auto mb-2">{feature.icon}</div>
              <h3 className="text-white font-medium text-sm md:text-base mb-1">{feature.title}</h3>
              <p className="text-gray-400 text-xs md:text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="py-3 text-center">
        <p className="text-gray-400 text-xs">© {new Date().getFullYear()} SHEild Safety App</p>
      </footer>
    </div>
  );
};

export default Index;
