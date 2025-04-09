import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import SheildButton from '@/components/SheildButton';
import { ArrowLeft, Users, Clock, Map, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TravelRequest {
  id: string;
  from: string;
  to: string;
  time: string;
  date: string;
  status: 'pending' | 'matched' | 'completed';
}

interface TravelMatch {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  destination: string;
  departureTime: string;
}

const CollabPage = () => {
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [activeTab, setActiveTab] = useState<'request' | 'matches'>('request');
  const [requestSent, setRequestSent] = useState(false);
  
  const mockRequests: TravelRequest[] = [
    {
      id: "1",
      from: "Central Station",
      to: "University Campus",
      time: "7:30 PM",
      date: "Today",
      status: 'pending'
    },
    {
      id: "2",
      from: "Shopping Mall",
      to: "Residential Area",
      time: "9:00 PM",
      date: "Tomorrow",
      status: 'matched'
    }
  ];
  
  const mockMatches: TravelMatch[] = [
    {
      id: "1",
      name: "Sarah J.",
      verified: true,
      rating: 4.8,
      destination: "University Campus",
      departureTime: "7:30 PM"
    },
    {
      id: "2",
      name: "Michelle K.",
      verified: true,
      rating: 4.9,
      destination: "Downtown",
      departureTime: "8:00 PM"
    }
  ];

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destination || !departureDate || !departureTime) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // This would call your backend API to submit a travel partner request
    toast.success('Travel partner request submitted!');
    setRequestSent(true);
  };

  const handleJoinGroup = (id: string) => {
    // This would call your backend API to join a travel group
    toast.success('Request sent to join the travel group');
  };

  const handleAcceptMatch = (id: string) => {
    // This would call your backend API to accept a travel match
    toast.success('Match accepted! Contact details exchanged');
  };

  const handleDeclineMatch = (id: string) => {
    // This would call your backend API to decline a travel match
    toast.info('Match declined');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sheild-darkblue to-black flex flex-col">
      {/* Navigation */}
      <div className="flex justify-between items-center p-4">
        <Link to="/">
          <button className="text-white p-2 rounded-full hover:bg-white/10">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div className="flex items-center">
          <Logo size="sm" showText={false} />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4">
        <h1 className="text-2xl font-bold text-white mb-6">Travel Partners</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`pb-2 px-4 ${activeTab === 'request' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple' : 'text-gray-400'}`}
            onClick={() => setActiveTab('request')}
          >
            Request Partner
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'matches' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple' : 'text-gray-400'}`}
            onClick={() => setActiveTab('matches')}
          >
            Your Matches
          </button>
        </div>
        
        {/* Request Partner Tab */}
        {activeTab === 'request' && (
          <div className="flex-1">
            {!requestSent ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Destination</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Where are you going?"
                    className="w-full py-2 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full py-2 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full py-2 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <SheildButton type="submit" fullWidth>
                    <div className="flex items-center justify-center">
                      <Users size={18} className="mr-2" />
                      Find Travel Partners
                    </div>
                  </SheildButton>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="bg-sheild-purple/20 p-6 rounded-lg mb-6">
                  <Users size={48} className="mx-auto mb-4 text-sheild-purple" />
                  <h3 className="text-xl font-bold text-white mb-2">Request Sent!</h3>
                  <p className="text-gray-300">
                    We're looking for travel partners heading to <span className="text-white font-medium">{destination}</span> at{' '}
                    <span className="text-white font-medium">{departureTime}</span> on{' '}
                    <span className="text-white font-medium">{departureDate}</span>.
                  </p>
                </div>
                
                <SheildButton 
                  variant="secondary"
                  onClick={() => setRequestSent(false)}
                >
                  Create Another Request
                </SheildButton>
              </div>
            )}
            
            {/* Existing Requests */}
            {mockRequests.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">Your Recent Requests</h3>
                <div className="space-y-4">
                  {mockRequests.map(request => (
                    <div key={request.id} className="bg-sheild-darkblue/50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="text-sm text-gray-400">From</div>
                          <div className="text-white">{request.from}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">To</div>
                          <div className="text-white">{request.to}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center text-gray-300 text-sm">
                          <Clock size={14} className="mr-1" /> 
                          {request.time}, {request.date}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                          request.status === 'matched' ? 'bg-green-500/20 text-green-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="flex-1">
            {mockMatches.length > 0 ? (
              <div className="space-y-4">
                {mockMatches.map(match => (
                  <div key={match.id} className="bg-sheild-darkblue/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-bold text-white mr-2">{match.name}</h3>
                          {match.verified && (
                            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-yellow-400 text-sm">★ {match.rating.toFixed(1)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300 text-sm flex items-center justify-end">
                          <Map size={14} className="mr-1" /> 
                          {match.destination}
                        </div>
                        <div className="text-gray-300 text-sm flex items-center justify-end mt-1">
                          <Clock size={14} className="mr-1" /> 
                          {match.departureTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleAcceptMatch(match.id)}
                        className="flex-1 flex items-center justify-center py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                      >
                        <CheckCircle size={16} className="mr-1" /> Accept
                      </button>
                      <button 
                        onClick={() => handleDeclineMatch(match.id)}
                        className="flex-1 flex items-center justify-center py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        <XCircle size={16} className="mr-1" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-white mb-2">No Matches Yet</h3>
                <p className="text-gray-300 mb-6">
                  Create a travel request to get matched with verified travel partners.
                </p>
                <SheildButton 
                  onClick={() => setActiveTab('request')}
                >
                  Create Travel Request
                </SheildButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabPage;
