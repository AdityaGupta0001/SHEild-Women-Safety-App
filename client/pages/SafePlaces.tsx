import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { ArrowLeft, MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface SafeSpot {
  _id: string;
  name: string;
  address: string;
  googleTypes: string[];
  location: {
    type: string;
    coordinates: [number, number];
  };
  rating: number;
}

const placeTypes = [
  'library', 'school', 'secondary_school', 'preschool', 'primary_school',
  'university', 'public_bathroom', 'atm', 'bank', 'fire_station',
  'courthouse', 'police', 'post_office', 'hospital', 'drugstore',
  'pharmacy', 'doctor', 'child_care_agency', 'point_of_interest',
  'airport', 'bus_stop', 'health', 'restaurant'
];

const SafePlaces = () => {
  const [radius, setRadius] = useState<number[]>([2.5]); // Default 2.5km
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Get user's location when component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  }, []);
  
  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter === selectedFilter ? null : filter);
    
    if (filter === selectedFilter) {
      // If deselecting, just fetch all spots
      handleFindSafePlaces();
      return;
    }

    if (!userLocation) {
      toast.error("Unable to get your location. Please enable location services.");
      return;
    }

    setIsLoading(true);
    
    fetch('http://localhost:8080/api/safespots/near-me/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radius[0],
        filter: filter.toLowerCase()
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      setSafeSpots(data.spots);
      toast.success(`Found ${data.spots.length} spots matching ${filter}`);
    })
    .catch(error => {
      console.error('Error filtering safe spots:', error);
      toast.error('Failed to filter safe spots');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const handleFindSafePlaces = () => {
    if (!userLocation) {
      toast.error("Unable to get your location. Please enable location services.");
      return;
    }

    setIsLoading(true);
    
    fetch('http://localhost:8080/api/safespots/near-me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radius[0]
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      setSafeSpots(data.spots);
      toast.success(`Found ${data.spots.length} safe spots nearby`);
    })
    .catch(error => {
      console.error('Error finding safe spots:', error);
      toast.error('Failed to find safe spots');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const handleUpvote = (id: string) => {
    fetch(`http://localhost:8080/api/safespots/spots/${id}/upvote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      toast.success('Place upvoted successfully');
    })
    .catch(error => {
      console.error('Error upvoting place:', error);
      toast.error('Failed to upvote place');
    });
  };

  const handleDownvote = (id: string) => {
    fetch(`http://localhost:8080/api/safespots/spots/${id}/downvote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      toast.success('Place downvoted successfully');
    })
    .catch(error => {
      console.error('Error downvoting place:', error);
      toast.error('Failed to downvote place');
    });
  };

  const handleGetDirections = (id: string) => {
    fetch(`http://localhost:8080/api/safespots/spots/${id}/directions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      window.open(data.url, '_blank');
    })
    .catch(error => {
      console.error('Error getting directions:', error);
      toast.error('Failed to get directions');
    });
  };

  const formatButtonLabel = (type: string) => {
    // Convert snake_case or lowercase to Title Case with spaces
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
        <h1 className="text-2xl font-bold text-white mb-6">Find Safe Places Near You</h1>
        
        {/* Range Slider and Search Button */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3/4">
            <p className="text-white text-sm mb-1">Distance: {radius[0]} km</p>
            <Slider
              value={radius}
              min={0.5}
              max={5}
              step={0.5}
              onValueChange={setRadius}
              className="bg-opacity-20"
            />
          </div>
          <div className="w-1/4">
            <Button 
              onClick={handleFindSafePlaces}
              className="w-full bg-sheild-purple hover:bg-purple-700"
              disabled={isLoading || !userLocation}
            >
              Find
            </Button>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="mb-6">
          <p className="text-white text-sm mb-2">Filter by type:</p>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            {placeTypes.map(type => (
              <button 
                key={type}
                onClick={() => handleFilterSelect(type)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${
                  selectedFilter === type 
                    ? 'bg-sheild-purple text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {formatButtonLabel(type)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Safe Places List */}
        <div className="flex-1 space-y-4 overflow-y-auto mb-4">
          {isLoading ? (
            <div className="text-center text-gray-400 py-12">
              <p>Loading safe places...</p>
            </div>
          ) : safeSpots.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p>Use the slider to set a distance and press Find to discover safe places nearby.</p>
            </div>
          ) : (
            safeSpots.map(spot => (
              <div key={spot._id} className="bg-sheild-darkblue/50 p-4 rounded-lg shadow-md">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-white">{spot.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {spot.googleTypes.slice(0, 3).map((type, index) => (
                        <span key={index} className="bg-gray-700 text-xs text-gray-300 px-2 py-0.5 rounded-full">
                          {formatButtonLabel(type)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-400 font-medium">
                      Rating: {spot.rating ? spot.rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center mt-2 text-gray-300 text-sm">
                  <MapPin size={14} className="mr-1" /> 
                  {spot.address}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-white border-purple-600 bg-purple-700"
                    onClick={() => handleGetDirections(spot._id)}
                  >
                    Get Directions
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-400 border-green-600 hover:bg-green-700"
                    onClick={() => handleUpvote(spot._id)}
                  >
                    <ThumbsUp size={14} className="mr-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-400 border-red-600 hover:bg-red-700"
                    onClick={() => handleDownvote(spot._id)}
                  >
                    <ThumbsDown size={14} className="mr-1" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SafePlaces;