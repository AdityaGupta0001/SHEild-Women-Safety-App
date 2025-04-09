
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import SheildButton from '@/components/SheildButton';
import { Shield, MapPin, Users, Bell, Phone, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
}

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = async () => {
    try {
      // Call to your backend API
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
      });
      
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const features: Feature[] = [
    {
      icon: <Shield className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "SOS Emergency",
      description: "Send immediate alerts to emergency contacts and authorities",
      path: "/sos"
    },
    {
      icon: <MapPin className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "Safe Navigation",
      description: "Find and share the safest routes to your destination",
      path: "/locate-me"
    },
    {
      icon: <Users className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "Travel Partners",
      description: "Connect with verified companions traveling in the same direction",
      path: "/collab"
    },
    {
      icon: <Bell className="h-6 w-6 md:h-8 md:w-8 text-sheild-purple" />,
      title: "Safety Reports",
      description: "Check and report safety incidents in your area",
      path: "/safe-places"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sheild-darkblue to-black">
      {/* Header */}
      <header className="py-4 px-4 flex justify-between items-center">
        <Logo size={isMobile ? "sm" : "md"} />
        
        {isMobile ? (
          <div>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-white rounded-full hover:bg-sheild-purple/20"
            >
              <Menu size={24} />
            </button>
            
            {menuOpen && (
              <div className="absolute top-16 right-4 bg-sheild-darkblue/95 backdrop-blur-sm rounded-lg shadow-xl z-50 p-3 w-48 animate-fade-in">
                {isLoggedIn ? (
                  <>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>
                      <div className="py-2 px-3 hover:bg-sheild-purple/20 rounded-md text-white">Profile</div>
                    </Link>
                    <div 
                      className="py-2 px-3 hover:bg-sheild-purple/20 rounded-md text-white cursor-pointer"
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                    >
                      Logout
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      <div className="py-2 px-3 hover:bg-sheild-purple/20 rounded-md text-white">Login</div>
                    </Link>
                    <Link to="/signup" onClick={() => setMenuOpen(false)}>
                      <div className="py-2 px-3 hover:bg-sheild-purple/20 rounded-md text-white">Sign Up</div>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            {isLoggedIn ? (
              <div className="flex space-x-3">
                <Link to="/profile">
                  <SheildButton variant="secondary" size="sm">Profile</SheildButton>
                </Link>
                <SheildButton variant="primary" size="sm" onClick={handleLogout}>
                  Logout
                </SheildButton>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link to="/login">
                  <SheildButton variant="secondary" size="sm">Login</SheildButton>
                </Link>
                <Link to="/signup">
                  <SheildButton variant="primary" size="sm">Sign Up</SheildButton>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <section className="text-center my-8 md:my-12 max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-5xl font-bold text-white mb-3">
            Your Personal Safety Companion
          </h1>
          <p className="text-gray-300 text-sm md:text-lg mb-6">
            SHEild provides tools and features designed to keep women safe in any situation
          </p>
          
          {isLoggedIn ? (
            <Link to="/sos">
              <SheildButton variant="danger" size={isMobile ? "md" : "lg"}>
                <div className="flex items-center">
                  <Phone className="mr-2" size={isMobile ? 16 : 20} />
                  Emergency SOS
                </div>
              </SheildButton>
            </Link>
          ) : (
            <Link to="/signup">
              <SheildButton variant="primary" size={isMobile ? "md" : "lg"}>Get Started Now</SheildButton>
            </Link>
          )}
        </section>

        {/* Features Grid */}
        <section className="my-12">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-6">Our Safety Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-sheild-darkblue/50 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl hover:bg-sheild-darkblue/60 transition-all"
              >
                <div className="mb-3">{feature.icon}</div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{feature.description}</p>
                <Link to={feature.path}>
                  <SheildButton variant="primary" size="sm">
                    Access Feature
                  </SheildButton>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & Safety */}
        <section className="my-12 text-center max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Trust & Safety</h2>
          <p className="text-gray-300 text-sm md:text-base mb-8">
            SHEild prioritizes your privacy and safety. All user data is encrypted, and your location is only shared when you choose to do so. Our verification system ensures all users are authenticated for a secure community.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-gray-800">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-3 md:mb-0">
            <Logo size="sm" />
          </div>
          <div className="text-gray-400 text-xs">
            © {new Date().getFullYear()} SHEild. All rights reserved.
          </div>
          <div className="mt-3 md:mt-0 flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white text-xs md:text-sm">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white text-xs md:text-sm">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white text-xs md:text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
