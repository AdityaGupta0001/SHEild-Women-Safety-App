import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { ArrowLeft, Phone, Map, Bell, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SOSPage = () => {
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSOSTrigger = async () => {
    if (isSending) return;
    
    setIsSending(true);
    toast.info('SOS signal activated! Fetching location...');
    
    try {
      // 1. Get user's geolocation
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000, // Increased slightly to ensure accurate GPS lock
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // 2. Alert Authorities (Your existing logic)
      const alertResponse = await fetch(`${BACKEND_URL}/api/sos/alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ latitude, longitude }),
        credentials: 'include',
      });
      
      const alertData = await alertResponse.json();
      
      if (!alertResponse.ok) {
        throw new Error(alertData.error || 'Failed to alert authorities');
      }

      // 3. Dispatch SMS to Emergency Contacts via SMSGate
      // Create an urgent, highly visible message format
      const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const urgentMessage = `🚨 URGENT SOS ALERT 🚨\n\nI need immediate help! This is an automated emergency message from my SHEild app.\n\n📍 My current location:\n${googleMapsLink}\n\nPlease contact me or send help immediately! 🚓🚑`;

      const smsResponse = await fetch(`${BACKEND_URL}/api/sos/notify-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          message: urgentMessage,
          latitude,
          longitude
        }),
      });

      const smsData = await smsResponse.json();

      if (!smsResponse.ok) {
        console.error("SMS Dispatch Warning:", smsData.error);
        toast.warning('Authorities alerted, but some SMS messages failed to send.');
      } else {
        toast.success(`SOS sent successfully! Help is on the way. Notified ${smsData.contactsNotified || 'your'} emergency contacts.`);
      }
      
      // 4. Show additional details about the response
      if (alertData.details) {
        const { nearbyAuthoritiesFound } = alertData.details;
        if (nearbyAuthoritiesFound > 0) {
          toast.info(`Found ${nearbyAuthoritiesFound} nearby authorities that have been notified.`);
        }
      }

    } catch (error) {
      console.error('SOS error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send SOS');
    } finally {
      setIsSending(false);
    }
  };

  const handleEmergencyCall = async () => {
    toast.info('Initiating emergency call...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/sos/call-helpline`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get helpline information');
      }
      
      if (data.helplineNumber) {
        window.location.href = `tel:${data.helplineNumber}`;
        toast.success(`Connecting to emergency helpline: ${data.helplineNumber}`);
      } else {
        toast.error('No helpline number available');
      }
    } catch (error) {
      console.error('Emergency call error:', error);
      toast.error('Failed to connect emergency call');
    }
  };

  const iconSize = isMobile ? 20 : 24;
  const buttonSize = isMobile ? 10 : 12;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sheild-darkblue to-black flex flex-col">
      {/* Navigation */}
      <div className="flex justify-between items-center p-4">
        <Link to="/">
          <button className="text-white p-2 rounded-full hover:bg-white/10">
            <ArrowLeft size={isMobile ? 18 : 20} />
          </button>
        </Link>
        <div className="flex items-center">
          <Logo size="sm" showText={false} />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Side Navigation - for Desktop */}
        <div className={`${isMobile ? 'hidden' : 'absolute'} left-6 top-1/2 transform -translate-y-1/2 space-y-6`}>
          <Link to="/profile">
            <button className="w-12 h-12 bg-sheild-darkblue rounded-full flex items-center justify-center text-white shadow-lg hover:bg-sheild-purple transition-colors">
              <User size={iconSize} />
            </button>
          </Link>
          <Link to="/locate-me">
            <button className="w-12 h-12 bg-sheild-darkblue rounded-full flex items-center justify-center text-white shadow-lg hover:bg-sheild-purple transition-colors">
              <Map size={iconSize} />
            </button>
          </Link>
          <Link to="/safe-places">
            <button className="w-12 h-12 bg-sheild-darkblue rounded-full flex items-center justify-center text-white shadow-lg hover:bg-sheild-purple transition-colors">
              <Shield size={iconSize} />
            </button>
          </Link>
          <Link to="/collab">
            <button className="w-12 h-12 bg-sheild-darkblue rounded-full flex items-center justify-center text-white shadow-lg hover:bg-sheild-purple transition-colors">
              <Bell size={iconSize} />
            </button>
          </Link>
          <button 
            onClick={handleEmergencyCall}
            className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-700 transition-colors"
          >
            <Phone size={iconSize} />
          </button>
        </div>
        
        {/* Bottom Navigation - for Mobile */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center p-3 bg-sheild-darkblue/90 backdrop-blur-sm z-10">
            <Link to="/profile">
              <button className={`w-${buttonSize} h-${buttonSize} rounded-full flex items-center justify-center text-white`}>
                <User size={iconSize} />
              </button>
            </Link>
            <Link to="/locate-me">
              <button className={`w-${buttonSize} h-${buttonSize} rounded-full flex items-center justify-center text-white`}>
                <Map size={iconSize} />
              </button>
            </Link>
            <div className="-mt-8">
              <button
                onClick={handleEmergencyCall}
                className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-700 transition-colors border-4 border-sheild-darkblue"
              >
                <Phone size={28} />
              </button>
            </div>
            <Link to="/safe-places">
              <button className={`w-${buttonSize} h-${buttonSize} rounded-full flex items-center justify-center text-white`}>
                <Shield size={iconSize} />
              </button>
            </Link>
            <Link to="/collab">
              <button className={`w-${buttonSize} h-${buttonSize} rounded-full flex items-center justify-center text-white`}>
                <Bell size={iconSize} />
              </button>
            </Link>
          </div>
        )}
        
        {/* SOS Button */}
        <button
          onClick={handleSOSTrigger}
          disabled={isSending}
          className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold ${isSending ? 'animate-pulse-slow bg-red-500' : 'bg-gradient-to-br from-red-500 to-purple-700 hover:from-red-600 hover:to-purple-800'} transition-all duration-300 shadow-xl ${isMobile ? 'mb-16' : ''}`}
        >
          <div className="sos-pulse">SOS</div>
        </button>
        
        <p className="mt-6 text-gray-300 text-center max-w-xs md:max-w-sm text-sm md:text-base">
          Press the SOS button to send an alert with your location to your emergency contacts and nearby authorities
        </p>
      </div>
    </div>
  );
};

export default SOSPage;