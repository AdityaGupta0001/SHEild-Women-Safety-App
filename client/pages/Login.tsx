
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import SheildButton from '@/components/SheildButton';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call to your backend API
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      localStorage.setItem('token', data.token);
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sheild-darkblue to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-sheild-darkblue rounded-lg overflow-hidden relative">
        {/* Top left blob decoration */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-sheild-purple rounded-full opacity-20 blur-3xl"></div>
        
        {/* Back button - Updated to use navigate instead of Link */}
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={() => navigate('/')} 
            className="text-white p-1 rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={isMobile ? 18 : 20} />
          </button>
        </div>

        <div className="relative z-10 p-5 md:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size={isMobile ? "md" : "lg"} />
          </div>
          
          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="mb-1 text-gray-300 text-sm">Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2.5 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <div className="mb-1 text-gray-300 text-sm">Password</div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2.5 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link to="/forgot-password" className="text-sm text-sheild-lightpurple hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <div className="pt-2">
              <SheildButton 
                type="submit" 
                variant="primary" 
                fullWidth 
                disabled={loading}
                size={isMobile ? "md" : "lg"}
              >
                {loading ? 'Logging in...' : 'Login'}
              </SheildButton>
            </div>
          </form>
          
          {/* Sign up link */}
          <div className="mt-6 text-center text-gray-300 text-sm">
            Don't have an account? {' '}
            <Link to="/signup" className="text-sheild-lightpurple hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
