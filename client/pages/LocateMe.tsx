import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
// Consider adding a toast library for notifications
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// --- IMPORTANT: Replace with your actual Google Maps API Key ---
// --- Make sure Maps JavaScript API, Places API, and Directions API are enabled ---
const Maps_API_KEY = import.meta.env.VITE_MAPS_API_KEY; // <--- REPLACE THIS

// Function to load the Google Maps script (Now includes 'places' library)
const loadGoogleMapsScript = (callback: () => void) => {
  const existingScript = document.getElementById('googleMapsScript');

  if (!existingScript) {
    const script = document.createElement('script');
    // Add '&libraries=places' to load the Places library for Autocomplete
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Maps_API_KEY}&libraries=places&callback=initMap`;
    script.id = 'googleMapsScript';
    script.async = true;
    script.defer = true;
    (window as any).initMap = callback;
    document.body.appendChild(script);
    console.log("Google Maps script added to body (with Places library).");
  } else {
    if ((window as any).google?.maps?.places) { // Check if places library is also loaded
      console.log("Google Maps (with Places) already loaded, executing callback.");
      callback();
    } else {
      console.log("Google Maps script exists but not fully loaded or Places missing, reassigning callback.");
      // Re-assign callback in case the script exists but wasn't fully initialized
      (window as any).initMap = callback;
       // If the script exists but lacks the 'places' library, it might need manual removal and re-addition.
       // For simplicity here, we assume the existing script includes 'places' or re-running initMap works.
       // A more robust solution might involve checking script.src and potentially removing/re-adding.
       if (!(window as any).google?.maps?.places) {
           console.warn("Existing script might lack 'places' library. Re-initialization attempted.");
           // Attempt to execute callback anyway, might fail if places isn't loaded.
           callback();
       }
    }
  }
};


// --- Component Start ---
const LocateMeMinimalMap = () => {
  // State
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // For safe spots loading
  const [safeSpots, setSafeSpots] = useState([]);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [radius, setRadius] = useState<number[]>([2.5]);
  

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autoCompleteRef = useRef<HTMLInputElement>(null); // Ref for the input
  const autoCompleteServiceRef = useRef<google.maps.places.Autocomplete | null>(null); // Ref for Autocomplete instance

  // Initialize Map and Directions Renderer
  const initializeMap = useCallback(() => {
    if (!currentLocation || !mapContainerRef.current || !(window as any).google?.maps) {
      console.warn("Map initialization prerequisites not met:", { hasLocation: !!currentLocation, hasContainer: !!mapContainerRef.current, hasMapsAPI: !!(window as any).google?.maps });
      setErrorMsg("Map prerequisites not met.");
      setIsMapLoading(false);
      return;
    }
    console.log("Initializing Google Map at:", currentLocation);
    try {
      const mapOptions: google.maps.MapOptions = {
        center: currentLocation,
        zoom: 15,
        disableDefaultUI: true, // Keep it minimal
        // mapId: 'YOUR_MAP_ID' // Optional: Cloud-based styling
      };
      const map = new google.maps.Map(mapContainerRef.current as HTMLDivElement, mapOptions);
      mapRef.current = map;

      // Initialize Directions Renderer
      const renderer = new google.maps.DirectionsRenderer();
      renderer.setMap(map);
      setDirectionsRenderer(renderer);

      // Keep the marker for the current location (optional, renderer can show A/B markers)
      const marker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        title: 'Your Location',
      });
      markerRef.current = marker; // Store marker ref if needed later

      setIsMapLoading(false);
      setErrorMsg(null);
      console.log("Google Map Initialized");

    } catch (error) {
      console.error("Error initializing Google Map:", error);
      setErrorMsg("Failed to initialize the map.");
      setIsMapLoading(false);
    }
  }, [currentLocation]); // Dependency on currentLocation

  // Initialize Autocomplete
  const initializeAutocomplete = useCallback(() => {
      if (!autoCompleteRef.current || !(window as any).google?.maps?.places) {
          console.warn("Autocomplete prerequisites not met:", { hasInputRef: !!autoCompleteRef.current, hasPlacesAPI: !!(window as any).google?.maps?.places });
          // Don't set an error message here, as the map might still load
          return;
      }
      console.log("Initializing Autocomplete on input field.");
      try {
          const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef.current, {
              // Optional: configure bounds, types, etc.
              // types: ['geocode', 'establishment'],
              // componentRestrictions: { country: "us" }, // Example: restrict to US
          });

          autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (place.geometry && place.geometry.location) {
                  console.log("Place selected:", place.name, place.geometry.location.toString());
                  setSelectedPlace(place);
                  setErrorMsg(null); // Clear previous errors on new selection
              } else {
                  console.log("Autocomplete: No details available for input: '" + place.name + "'");
                  // Optional: Show a specific message if a place is selected but lacks geometry
                  // setErrorMsg("Could not get location details for the selected place.");
                  // Don't clear selectedPlace here if you want to allow trying route calculation anyway
              }
          });
          autoCompleteServiceRef.current = autocomplete; // Store instance
          console.log("Autocomplete Initialized");

      } catch (error) {
          console.error("Error initializing Google Autocomplete:", error);
          setErrorMsg("Failed to initialize address search."); // More specific error
      }

  }, []); // No dependencies needed if refs are stable

  // Effect for getting Geolocation (unchanged)
  useEffect(() => {
    setIsLocationLoading(true);
    setErrorMsg(null); // Clear errors on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentLocation(loc);
          setIsLocationLoading(false);
          console.log("Location obtained:", loc);
        },
        (error) => {
          console.error('Error getting location:', error);
          switch (error.code) {
            case error.PERMISSION_DENIED: setErrorMsg("Location permission denied."); break;
            case error.POSITION_UNAVAILABLE: setErrorMsg("Location information unavailable."); break;
            case error.TIMEOUT: setErrorMsg("Getting location timed out."); break;
            default: setErrorMsg("Unknown error getting location."); break;
          }
          setIsLocationLoading(false);
          setIsMapLoading(false); // Can't load map without location
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setErrorMsg('Geolocation not supported by this browser.');
      setIsLocationLoading(false);
      setIsMapLoading(false);
    }
  }, []);

  // Effect for loading Google Maps Script and initializing Map/Autocomplete
  useEffect(() => {
    // Only attempt to load script and init if location is ready
    if (!isLocationLoading && currentLocation) {
        console.log("Location ready, loading script...");
        setIsMapLoading(true); // Set loading state for map
        // Load script, then initialize Map, then initialize Autocomplete
        loadGoogleMapsScript(() => {
            initializeMap(); // Initialize Map first
            initializeAutocomplete(); // Then initialize Autocomplete
        });
    } else if (!isLocationLoading && !currentLocation) {
        // If location failed, stop loading indicators
        setIsMapLoading(false);
    }

    // Cleanup function
    return () => {
      // More robust cleanup: Check if initMap is our specific function instance
      if ((window as any).initMap === initializeMap || (window as any).initMap === initializeAutocomplete) {
          delete (window as any).initMap;
          console.log("Cleaned up initMap callback assignment.");
      }
       // Clean up Autocomplete listeners if the component unmounts
      if (autoCompleteServiceRef.current) {
          // google.maps.event.clearInstanceListeners(autoCompleteServiceRef.current); // Deprecated way
          console.log("Autocomplete instance listeners potentially leaked - manual cleanup recommended if needed.");
          // Note: Modern React might handle some cleanup, but explicit removal is safest if issues arise.
      }
    };
    // initializeMap and initializeAutocomplete are wrapped in useCallback
  }, [isLocationLoading, currentLocation, initializeMap, initializeAutocomplete]);

  

  // Function to handle "Get Directions" button click
  const handleGetDirections = () => {
      if (isCalculatingRoute) return; // Prevent multiple clicks

      if (!selectedPlace || !selectedPlace.geometry || !selectedPlace.geometry.location) {
          setErrorMsg("Please select a valid destination from the suggestions.");
          // Example using react-toastify:
          // toast.error("Please select a valid destination from the suggestions.");
          console.warn("Get Directions clicked without a valid selected place.");
          return;
      }

      if (!currentLocation) {
          setErrorMsg("Your current location is not available.");
          // toast.error("Your current location is not available.");
          console.warn("Get Directions clicked without current location.");
          return;
      }

       if (!directionsRenderer) {
          setErrorMsg("Directions service is not ready yet.");
          // toast.error("Directions service is not ready yet.");
          console.warn("Get Directions clicked before Directions Renderer initialized.");
          return;
      }

      console.log(`Calculating directions from ${currentLocation.lat},${currentLocation.lng} to ${selectedPlace.name}`);
      setIsCalculatingRoute(true);
      setErrorMsg(null); // Clear previous errors

      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
          {
              origin: currentLocation,
              destination: selectedPlace.geometry.location,
              travelMode: window.google.maps.TravelMode.DRIVING, // Or other modes like WALKING, BICYCLING, TRANSIT
          },
          (result, status) => {
              setIsCalculatingRoute(false);
              if (status === window.google.maps.DirectionsStatus.OK && result) {
                  console.log("Directions calculated successfully:", result);
                  directionsRenderer.setDirections(result);
                  setDirectionsResponse(result);
                  if (markerRef.current) {
                     markerRef.current.setMap(null); // Hide the original current location marker
                  }
                  setErrorMsg(null); // Clear any previous error
              } else {
                  console.error(`Error fetching directions: ${status}`, result);
                  setErrorMsg(`Failed to get directions: ${status}. Please try a different destination.`);
                  // toast.error(`Failed to get directions: ${status}`);
                   // Clear previous route if calculation failed
                  directionsRenderer.setDirections({ routes: [] });
                  setDirectionsResponse(null);
                  // Optionally, restore the original marker if needed
                  // if (markerRef.current && mapRef.current) {
                  //    markerRef.current.setMap(mapRef.current);
                  // }
              }
          }
      );
  };

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // distance in km
    return distance;
  }

  const handleStartNavigation = () => {
    if (!directionsResponse || !directionsResponse.routes.length) {
      toast.error("Please get directions first.");
      return;
    }
    try {
      const origin = `${currentLocation.lat},${currentLocation.lng}`;
      const destination = `${selectedPlace.geometry.location.lat()},${selectedPlace.geometry.location.lng()}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to open Google Maps navigation.");
    }
  };
  

  const handleGetSafeDirections = async () => { // Make the function async
    if (isCalculatingRoute) return; // Prevent multiple clicks

    // --- 1. Initial Validations ---
    if (!selectedPlace || !selectedPlace.geometry || !selectedPlace.geometry.location) {
        setErrorMsg("Please select a valid destination.");
        toast.error("Please select a valid destination.");
        return;
    }

    let destinationLatLng;
    const loc = selectedPlace.geometry.location;
    if (typeof loc.lat === 'function' && typeof loc.lng === 'function') {
        destinationLatLng = { lat: loc.lat(), lng: loc.lng() };
    } else if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        destinationLatLng = { lat: loc.lat, lng: loc.lng };
    } else {
         setErrorMsg("Destination location format is invalid.");
         toast.error("Destination location format is invalid.");
         return;
    }

    if (!currentLocation || typeof currentLocation.lat !== 'number' || typeof currentLocation.lng !== 'number') {
        setErrorMsg("Your current location is not available or invalid.");
        toast.error("Your current location is not available or invalid.");
        return;
    }

     if (!directionsRenderer) {
        setErrorMsg("Directions service is not ready yet.");
        toast.error("Directions service is not ready yet.");
        return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.DirectionsService) {
        setErrorMsg("Google Maps API not loaded correctly.");
        toast.error("Google Maps API not loaded correctly.");
        return;
    }

    console.log(`Calculating directions from ${currentLocation.lat},${currentLocation.lng} to ${selectedPlace.name}`);
    setIsCalculatingRoute(true); // Set loading state
    setErrorMsg(null); // Clear previous errors

    let safeSpotsData = []; // To store fetched safe spots

    // --- 2. Fetch Safe Spots Internally ---
    try {
        console.log(`Fetching safe spots near ${currentLocation.lat},${currentLocation.lng} with radius ${radius[0]}km`);
        const response = await fetch('http://localhost:8080/api/safespots/near-me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                radius: radius[0] // Assuming radius state like [10]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network response error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Validate and format the fetched data
        if (data && data.spots && Array.isArray(data.spots)) {
            safeSpotsData = data.spots.map(spot => {
                if (spot.location?.coordinates?.length === 2) {
                    return {
                        ...spot,
                        location: {
                            lat: spot.location.coordinates[1], // Lat
                            lng: spot.location.coordinates[0]  // Lng
                        }
                    };
                }
                console.warn("Skipping spot due to invalid location data:", spot);
                return null;
            }).filter(spot => spot !== null); // Remove invalid spots
            console.log(`Successfully fetched and formatted ${safeSpotsData.length} safe spots.`);
            // toast.success(`Found ${safeSpotsData.length} safe spots nearby to consider.`); // Optional notification
        } else {
            console.warn('Received invalid data format for safe spots:', data);
            // Proceed without waypoints if format is wrong, but log it.
        }

    } catch (error) {
        console.error('Error fetching safe spots:', error);
        toast.error(`Could not fetch nearby safe spots: ${error.message}. Calculating direct route.`);
        // Do not stop the entire process, just proceed without waypoints
        safeSpotsData = []; // Ensure it's an empty array
    }

    // --- 3. Waypoint Selection Logic (using fetched safeSpotsData) ---
    let waypoints = [];
    if (safeSpotsData.length > 0) {
        const spotsWithDistances = safeSpotsData.map(spot => {
             // Location should already be formatted {lat, lng} from fetch step
            if (!spot.location || typeof spot.location.lat !== 'number' || typeof spot.location.lng !== 'number') {
               console.warn("Skipping spot with invalid location during waypoint selection:", spot);
               return null;
            }
            const distanceToUser = haversine(currentLocation.lat, currentLocation.lng, spot.location.lat, spot.location.lng);
            const distanceToDestination = haversine(destinationLatLng.lat, destinationLatLng.lng, spot.location.lat, spot.location.lng);

            const MIN_DISTANCE_KM = 0.05; // 50 meters
            if (distanceToUser < MIN_DISTANCE_KM || distanceToDestination < MIN_DISTANCE_KM) {
                return null; // Too close to origin or destination
            }
            return { ...spot, distanceToUser, distanceToDestination };
        }).filter(spot => spot !== null);

        // Sort and select top 2 unique waypoints
        const sortedByUser = [...spotsWithDistances].sort((a, b) => a.distanceToUser - b.distanceToUser);
        const sortedByDestination = [...spotsWithDistances].sort((a, b) => a.distanceToDestination - b.distanceToDestination);
        const potentialWaypoints = [];
        const seenIds = new Set();

        for (const spot of sortedByUser) {
             if (potentialWaypoints.length >= 2) break;
             if (spot._id && !seenIds.has(spot._id)) {
                 potentialWaypoints.push(spot);
                 seenIds.add(spot._id);
             }
        }
        for (const spot of sortedByDestination) {
            if (potentialWaypoints.length >= 2) break;
            if (spot._id && !seenIds.has(spot._id)) {
                potentialWaypoints.push(spot);
                seenIds.add(spot._id);
            }
        }

        // Format for Google Maps API
        waypoints = potentialWaypoints.map(spot => ({
            location: { lat: spot.location.lat, lng: spot.location.lng },
            stopover: true
        }));

        if (waypoints.length > 0) {
            console.log("Selected Waypoints:", waypoints.map(wp => wp.location));
        } else {
            console.log("No suitable waypoints found from fetched safe spots.");
        }
    } else {
        console.log("No safe spots fetched or available, calculating direct route.");
    }

    // --- 4. Call Directions Service ---
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
        {
            origin: currentLocation,
            destination: destinationLatLng,
            waypoints: waypoints,
            optimizeWaypoints: waypoints.length > 0, // Optimize only if waypoints exist
            travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            // --- 5. Handle Directions Response ---
            setIsCalculatingRoute(false); // Reset loading state here
            if (status === window.google.maps.DirectionsStatus.OK && result) {
                console.log("Directions calculated successfully:", result);
                directionsRenderer.setDirections(result);
                setDirectionsResponse(result); 
                if (markerRef.current) {
                   markerRef.current.setMap(null);
                }
                setErrorMsg(null);
            } else {
                console.error(`Error fetching directions: ${status}`, result);
                let errorText = `Failed to get directions: ${status}.`;
                setDirectionsResponse(null);
                 // Add more specific messages based on status
                 setErrorMsg(errorText);
                 toast.error(`Failed to get directions: ${status}`);
                directionsRenderer.setDirections({ routes: [] }); // Clear map route
            }
        }
    );
};

  // --- Styles (keep your existing styles) ---
  const pageStyle: React.CSSProperties = { /* ... your existing style ... */
        display: 'flex',
        flexDirection: 'column', // Stack input/button above map box
         justifyContent: 'center', // Center vertically
         alignItems: 'center', // Center horizontally
         minHeight: '100vh',
         width: '100%',
         backgroundColor: '#f0f0f0',
         padding: '1rem', // Reduced padding slightly
         boxSizing: 'border-box',
    };
  const mapBoxStyle: React.CSSProperties = { /* ... your existing style ... */
         width: '100%',
         maxWidth: '800px', // Adjusted max width
         height: '65vh', // Adjusted height
         border: '2px solid #ccc',
         borderRadius: '8px',
         boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
         position: 'relative',
         overflow: 'hidden',
         backgroundColor: '#e0e0e0',
        marginTop: '1rem', // Add space below the input/button
    };
  const mapInnerStyle: React.CSSProperties = { /* ... your existing style ... */
        width: '100%', height: '100%',
    };
  const overlayStyle: React.CSSProperties = { /* ... your existing style ... */
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex',
        justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(50, 50, 50, 0.8)',
        color: 'white', zIndex: 10, padding: '20px', textAlign: 'center', fontSize: '1.1em',
        overflowY: 'auto', wordWrap: 'break-word',
    };

    // Style for the input/button container
    const controlsStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px', // Max width for the controls
        marginBottom: '1rem', // Space below controls
        gap: '0.5rem', // Space between input and button
    };

    const inputStyle: React.CSSProperties = {
        padding: '0.75rem 1rem',
        fontSize: '1rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
        flexGrow: 1, // Allow input to take available space
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        cursor: 'pointer',
        backgroundColor: '#4CAF50', // Green
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'background-color 0.2s ease',
        whiteSpace: 'nowrap', // Prevent button text wrapping
    };

     const buttonDisabledStyle: React.CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#aaa',
        cursor: 'not-allowed',
    };

  // --- JSX ---
  return (
    // Apply the root style from Code 2
    <div className="min-h-screen w-full bg-gradient-to-br from-sheild-darkblue to-black flex flex-col">
      {/* Optional: Add Toast Container if using react-toastify or sonner */}
      {/* <ToastContainer position="top-center" autoClose={3000} /> */}
       {/* Ensure Sonner's Toaster is rendered, likely at the root of your app */}
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
      <div className="flex-1 flex flex-col items-start justify-center px-4 relative">
      <h1 className="text-2xl font-bold text-white mb-6">Safe Navigation</h1>
  </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
      
      {/* Input and Button Container - Apply styles from Code 2 */}
      <div className="flex flex-col sm:flex-row w-full mb-4 gap-2">
          <input
              ref={autoCompleteRef}
              type="text"
              placeholder="Enter destination"
              // Apply input styles similar to Code 2
              className="flex-grow py-2 px-4 bg-black bg-opacity-20 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sheild-purple disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isMapLoading || isLocationLoading} // Keep JS disabled logic
          />
          <button
              onClick={handleGetDirections}
              // Apply button styles similar to Code 2 (primary action)
              className={`px-3 py-2.5 rounded shadow text-white whitespace-nowrap ${
                  isCalculatingRoute || isMapLoading || isLocationLoading
                    ? 'bg-gray-600 cursor-not-allowed' // Disabled style
                    : 'bg-sheild-purple hover:bg-sheild-purple/80' // Enabled style
                }`}
              disabled={isCalculatingRoute || isMapLoading || isLocationLoading} // Keep JS disabled logic
          >
              {/* Use distinct text based on previous request */}
              {isCalculatingRoute ? 'Calculating...' : 'Get Direct Route'}
          </button>
      </div>


      {/* Map Box - Apply styles derived from Code 2 */}
      <div className="w-full h-[65vh] border-2 border-gray-700 rounded-lg shadow-lg relative overflow-hidden bg-black/20 mt-4">
        {/* Map Inner Container */}
        <div ref={mapContainerRef} className="w-full h-full">
          {/* Google Map renders here */}
        </div>

        {/* Loading/Error Overlays - Apply styles derived from Code 2 */}
        {(isMapLoading || isLocationLoading) && !errorMsg && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-white z-10 p-5 text-center text-lg">
            {/* Optional: Add a spinner icon here */}
            <p>{isLocationLoading ? 'Getting your location...' : (isMapLoading ? 'Loading map...' : '')}</p>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-red-400 z-10 p-5 text-center text-lg">
             {/* Optional: Add an error icon here */}
            <p className="font-semibold">⚠️ Error</p>
            <p className="mt-1 text-base text-gray-300">{errorMsg}</p>
          </div>
        )}

        {/* Placeholder if map didn't load */}
        {!isMapLoading && !isLocationLoading && !mapRef.current && !errorMsg && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-gray-400 z-10 p-5 text-center text-lg">
            <p>Map container ready, but map did not initialize.</p>
          </div>
        )}
      </div>

      {/* Second Button Container - Apply styles from Code 2 */}
      <div className="flex justify-center items-center w-full mt-4 gap-2"> {/* Added mt-4 for spacing */}
          <button
              onClick={handleGetSafeDirections} // Button for DIRECT route (using renamed function)
              // Apply button styles similar to Code 2 (secondary action or alternative)
              className={`p-3 rounded shadow text-white whitespace-nowrap w-2/4 ${
                isCalculatingRoute || isMapLoading || isLocationLoading
                  ? 'bg-gray-600 cursor-not-allowed' // Disabled style
                  : 'bg-gray-700 hover:bg-gray-600' // Enabled style (using gray as alternative)
              }`}
              disabled={isCalculatingRoute || isMapLoading || isLocationLoading} // Keep JS disabled logic
          >
              {/* Use distinct text based on previous request */}
              {isCalculatingRoute ? 'Calculating...' : 'Get Safest Route'}
          </button>
          <button
            onClick={handleStartNavigation}
            disabled={isCalculatingRoute || !directionsResponse}
            className={`p-3 rounded shadow text-white whitespace-nowrap w-2/4 ${
              isCalculatingRoute || !directionsResponse ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isCalculatingRoute ? 'Calculating...' : 'Start Navigation'}
          </button>
      </div>


    </div>
    </div>
  );
};

export default LocateMeMinimalMap;