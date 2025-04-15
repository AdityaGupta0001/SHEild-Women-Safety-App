import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Clock, Map, CheckCircle, XCircle, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';

interface TravelRequest {
  requestId: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  status: 'searching' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
}

interface TravelMatch {
  userId: string;
  name: string;
  isVerified: boolean;
  profilePicture?: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  requestId: string;
}

interface TravelGroup {
  groupId: string;
  groupName: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  memberCount: number;
  isOwner: boolean;
  unreadMessages: number;
  createdAt: string;
}

const CollabPage = () => {
  const { toast } = useToast();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [travelMode, setTravelMode] = useState<'walking' | 'public_transport' | 'car'>('walking');
  const [preferences, setPreferences] = useState({
    gender: 'any',
    ageRange: 'any',
    verifiedOnly: true,
  });
  
  const [activeTab, setActiveTab] = useState<'request' | 'matches' | 'groups'>('request');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  
  const [userRequests, setUserRequests] = useState<TravelRequest[]>([]);
  const [matches, setMatches] = useState<TravelMatch[]>([]);
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  
  // Fetch user requests on component mount
  useEffect(() => {
    fetchUserRequests();
    fetchMatches();
    fetchUserGroups();
  }, []);
  
  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/collab/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      setUserRequests(data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your travel requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/collab/match', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          credentials: 'include'  
        }
      });
      
      if (!response.ok) {
        // If 404, it means no active request, which is not an error
        if (response.status === 404) {
          setMatches([]);
          return;
        }
        throw new Error('Failed to fetch matches');
      }
      
      const data = await response.json();
      
      if (data.status === 'matched' && data.matches) {
        setMatches(data.matches);
      } else if (data.status === 'searching' && data.potentialMatches) {
        setMatches(data.potentialMatches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Only show toast for actual errors, not for "no active request"
      if (!(error instanceof Error && error.message.includes('404'))) {
        toast({
          title: "Error",
          description: "Failed to fetch your matches.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/collab/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your travel groups.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Here you would typically convert coordinates to an address using reverse geocoding
          // For now, we'll just use coordinates as a placeholder
          setOrigin(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          toast({
            title: "Location Retrieved",
            description: "Your current location has been set as the origin."
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your current location.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Unavailable",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin || !destination || !departureDate || !departureTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real implementation, you'd need to convert addresses to coordinates
      // For this example, we'll use placeholder coordinates
      const requestData = {
        origin: {
          type: 'Point',
          coordinates: [0, 0]  // This would come from geocoding the origin address
        },
        destination: {
          type: 'Point',
          coordinates: [0, 0]  // This would come from geocoding the destination address
        },
        originAddress: origin,
        destinationAddress: destination,
        departureTime: new Date(`${departureDate}T${departureTime}`).toISOString(),
        travelMode,
        preferences
      };
      
      const response = await fetch('http://localhost:8080/api/collab/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit travel request');
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Travel partner request submitted!"
      });
      
      setRequestSent(true);
      
      // Refresh user requests
      fetchUserRequests();
      
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/collab/join/${groupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join group');
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message || "Successfully joined the travel group."
      });
      
      // Refresh groups
      fetchUserGroups();
      
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join group.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleLeaveGroup = async (groupId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/collab/leave/${groupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave group');
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message || "Successfully left the travel group."
      });
      
      // Refresh groups
      fetchUserGroups();
      
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave group.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateTimeStr; // Fallback to original string if parsing fails
    }
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
        <div className="flex items-center text-white font-bold">
          Journey Share
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
          <button
            className={`pb-2 px-4 ${activeTab === 'groups' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple' : 'text-gray-400'}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
        </div>
        
        {/* Request Partner Tab */}
        {activeTab === 'request' && (
          <div className="flex-1">
            {!requestSent ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Origin</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="Where are you starting from?"
                      className="flex-1 py-2 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                    />
                    <Button 
                      type="button" 
                      onClick={getUserCurrentLocation}
                      className="bg-sheild-purple text-white hover:bg-sheild-purple/80">
                      Current
                    </Button>
                  </div>
                </div>

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
                
                <div>
                  <label className="block text-gray-300 mb-2">Travel Mode</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center text-white cursor-pointer">
                      <input
                        type="radio"
                        name="travelMode"
                        checked={travelMode === 'walking'}
                        onChange={() => setTravelMode('walking')}
                        className="mr-2"
                      />
                      Walking
                    </label>
                    <label className="flex items-center text-white cursor-pointer">
                      <input
                        type="radio"
                        name="travelMode"
                        checked={travelMode === 'public_transport'}
                        onChange={() => setTravelMode('public_transport')}
                        className="mr-2"
                      />
                      Public Transport
                    </label>
                    <label className="flex items-center text-white cursor-pointer">
                      <input
                        type="radio"
                        name="travelMode"
                        checked={travelMode === 'car'}
                        onChange={() => setTravelMode('car')}
                        className="mr-2"
                      />
                      Car
                    </label>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-sheild-purple text-white hover:bg-sheild-purple/80 flex items-center justify-center py-6"
                  >
                    <Users size={18} className="mr-2" />
                    {loading ? 'Processing...' : 'Find Travel Partners'}
                  </Button>
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
                
                <Button 
                  onClick={() => setRequestSent(false)}
                  className="bg-gray-700 text-white hover:bg-gray-600"
                >
                  Create Another Request
                </Button>
              </div>
            )}
            
            {/* Existing Requests */}
            {userRequests.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">Your Recent Requests</h3>
                <div className="space-y-4">
                  {userRequests.map(request => (
                    <div key={request.requestId} className="bg-sheild-darkblue/50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="text-sm text-gray-400">From</div>
                          <div className="text-white">{request.originAddress}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">To</div>
                          <div className="text-white">{request.destinationAddress}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center text-gray-300 text-sm">
                          <Clock size={14} className="mr-1" /> 
                          {formatDateTime(request.departureTime)}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'searching' ? 'bg-yellow-500/20 text-yellow-300' : 
                          request.status === 'matched' ? 'bg-green-500/20 text-green-300' :
                          request.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-red-500/20 text-red-300'
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
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map(match => (
                  <div key={match.requestId} className="bg-sheild-darkblue/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-bold text-white mr-2">{match.name}</h3>
                          {match.isVerified && (
                            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300 text-sm flex items-center justify-end">
                          <Map size={14} className="mr-1" /> 
                          {match.destinationAddress}
                        </div>
                        <div className="text-gray-300 text-sm flex items-center justify-end mt-1">
                          <Clock size={14} className="mr-1" /> 
                          {formatDateTime(match.departureTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleJoinGroup(match.requestId)}
                        className="flex-1 flex items-center justify-center py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                        disabled={loading}
                      >
                        <CheckCircle size={16} className="mr-1" /> Connect
                      </Button>
                      <Button 
                        className="flex-1 flex items-center justify-center py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                      >
                        <User size={16} className="mr-1" /> View Profile
                      </Button>
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
                <Button 
                  onClick={() => setActiveTab('request')}
                  className="bg-sheild-purple text-white hover:bg-sheild-purple/80"
                >
                  Create Travel Request
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="flex-1">
            {groups.length > 0 ? (
              <div className="space-y-4">
                {groups.map(group => (
                  <div key={group.groupId} className="bg-sheild-darkblue/50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-white">{group.groupName}</h3>
                        <div className="flex items-center text-gray-300 text-sm mt-1">
                          <Users size={14} className="mr-1" /> 
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                          {group.isOwner && (
                            <span className="ml-2 bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                              Owner
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          group.status === 'active' ? 'bg-green-500/20 text-green-300' : 
                          group.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                          group.status === 'completed' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {group.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-400">From</div>
                          <div className="text-sm text-white">{group.originAddress}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">To</div>
                          <div className="text-sm text-white">{group.destinationAddress}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-300 text-xs mt-2">
                        <Clock size={12} className="mr-1" /> 
                        {formatDateTime(group.departureTime)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link to={`/groups/${group.groupId}`} className="flex-1">
                        <Button 
                          className="w-full flex items-center justify-center py-2 bg-sheild-purple hover:bg-sheild-purple/80 text-white rounded"
                        >
                          <MessageCircle size={16} className="mr-1" /> 
                          Chat
                          {group.unreadMessages > 0 && (
                            <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {group.unreadMessages}
                            </span>
                          )}
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => handleLeaveGroup(group.groupId)}
                        className="flex items-center justify-center py-2 bg-red-600 hover:bg-red-700 text-white rounded px-4"
                        disabled={loading}
                      >
                        <XCircle size={16} className="mr-1" /> Leave
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Groups</h3>
                <p className="text-gray-300 mb-6">
                  Join a travel group or create a request to get matched.
                </p>
                <Button 
                  onClick={() => setActiveTab('request')}
                  className="bg-sheild-purple text-white hover:bg-sheild-purple/80"
                >
                  Create Travel Request
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabPage;
