
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import SheildButton from '@/components/SheildButton';
import { ArrowLeft, Search, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface SafePlace {
  id: string;
  name: string;
  type: string;
  address: string;
  distance: string;
  isOpen24x7: boolean;
}

const SafePlaces = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  const mockSafePlaces: SafePlace[] = [
    {
      id: "1",
      name: "Central Police Station",
      type: "Police",
      address: "123 Safety Street",
      distance: "0.5 miles",
      isOpen24x7: true
    },
    {
      id: "2",
      name: "Women's Support Center",
      type: "Support",
      address: "456 Helping Ave",
      distance: "1.2 miles",
      isOpen24x7: false
    },
    {
      id: "3",
      name: "24/7 Coffee House",
      type: "Cafe",
      address: "789 Awake Blvd",
      distance: "0.8 miles",
      isOpen24x7: true
    },
    {
      id: "4",
      name: "City Hospital",
      type: "Hospital",
      address: "101 Healthcare Drive",
      distance: "1.5 miles",
      isOpen24x7: true
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info(`Searching for: ${searchQuery}`);
    // This would call your backend API to search
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter === selectedFilter ? null : filter);
  };

  const handleAddSafePlace = () => {
    toast.info('Suggest a safe place feature coming soon!');
  };

  const filteredPlaces = selectedFilter
    ? mockSafePlaces.filter(place => place.type === selectedFilter)
    : mockSafePlaces;

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
        
        {/* Search and Filters */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search safe places..."
                className="w-full py-2 px-4 pl-10 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple"
              />
              <Search size={18} className="text-gray-400 absolute left-3 top-2.5" />
            </div>
          </form>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button 
              onClick={() => handleFilterSelect('Police')}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${selectedFilter === 'Police' ? 'bg-sheild-purple text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Police Stations
            </button>
            <button 
              onClick={() => handleFilterSelect('Hospital')}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${selectedFilter === 'Hospital' ? 'bg-sheild-purple text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Hospitals
            </button>
            <button 
              onClick={() => handleFilterSelect('Support')}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${selectedFilter === 'Support' ? 'bg-sheild-purple text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Support Centers
            </button>
            <button 
              onClick={() => handleFilterSelect('Cafe')}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${selectedFilter === 'Cafe' ? 'bg-sheild-purple text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              24/7 Establishments
            </button>
          </div>
        </div>
        
        {/* Safe Places List */}
        <div className="flex-1 space-y-4 overflow-y-auto mb-4">
          {filteredPlaces.map(place => (
            <div key={place.id} className="bg-sheild-darkblue/50 p-4 rounded-lg shadow-md">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-white">{place.name}</h3>
                  <p className="text-gray-400 text-sm">{place.type}</p>
                </div>
                <div className="text-right">
                  <span className="text-sheild-lightpurple font-medium">{place.distance}</span>
                  {place.isOpen24x7 && (
                    <p className="text-green-400 text-xs">Open 24/7</p>
                  )}
                </div>
              </div>
              <div className="flex items-center mt-2 text-gray-300 text-sm">
                <MapPin size={14} className="mr-1" /> 
                {place.address}
              </div>
              <div className="mt-3">
                <SheildButton size="sm">Get Directions</SheildButton>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Safe Place Button */}
        <div>
          <SheildButton 
            onClick={handleAddSafePlace}
            fullWidth
          >
            <div className="flex items-center justify-center">
              <Plus size={18} className="mr-2" />
              Suggest a Safe Place
            </div>
          </SheildButton>
        </div>
      </div>
    </div>
  );
};

export default SafePlaces;
