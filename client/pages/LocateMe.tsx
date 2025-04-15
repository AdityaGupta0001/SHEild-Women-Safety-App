import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- IMPORTANT: Replace with your actual Google Maps API Key ---
const Maps_API_KEY = ''; // <--- REPLACE THIS

// Function to load the Google Maps script (unchanged)
const loadGoogleMapsScript = (callback: () => void) => {
  const existingScript = document.getElementById('googleMapsScript');

  if (!existingScript) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Maps_API_KEY}&callback=initMap`;
    script.id = 'googleMapsScript';
    script.async = true;
    script.defer = true;
    (window as any).initMap = callback;
    document.body.appendChild(script);
    console.log("Google Maps script added to body.");
  } else {
     if ((window as any).google && (window as any).google.maps) {
         console.log("Google Maps already loaded, executing callback.");
         callback();
     } else {
        console.log("Google Maps script exists but not loaded, reassigning callback.");
        (window as any).initMap = callback;
     }
  }
};


// --- Component Start ---
const LocateMeMinimalMap = () => {
  // State (unchanged)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs (unchanged)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // initializeMap function (unchanged)
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
              disableDefaultUI: true,
              // mapId: 'YOUR_MAP_ID' // Optional: Cloud-based styling
          };
          const map = new google.maps.Map(mapContainerRef.current as HTMLDivElement, mapOptions);
          mapRef.current = map;
          const marker = new google.maps.Marker({
              position: currentLocation,
              map: map,
              title: 'Your Location',
          });
          markerRef.current = marker;
          setIsMapLoading(false);
          setErrorMsg(null);
          console.log("Google Map Initialized");
      } catch (error) {
          console.error("Error initializing Google Map:", error);
          setErrorMsg("Failed to initialize the map.");
          setIsMapLoading(false);
      }
  }, [currentLocation]);

   // useEffect for getting location (unchanged)
   useEffect(() => {
       setIsLocationLoading(true);
       setErrorMsg(null);
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
                   switch(error.code) {
                       case error.PERMISSION_DENIED: setErrorMsg("Location permission denied."); break;
                       case error.POSITION_UNAVAILABLE: setErrorMsg("Location information unavailable."); break;
                       case error.TIMEOUT: setErrorMsg("Getting location timed out."); break;
                       default: setErrorMsg("Unknown error getting location."); break;
                   }
                   setIsLocationLoading(false);
                   setIsMapLoading(false);
               },
               { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
           );
       } else {
           setErrorMsg('Geolocation not supported by this browser.');
           setIsLocationLoading(false);
           setIsMapLoading(false);
       }
   }, []);

   // useEffect for loading script and initializing map (unchanged)
   useEffect(() => {
       if (!isLocationLoading && currentLocation) {
            console.log("Location ready, loading script...");
            setIsMapLoading(true);
            loadGoogleMapsScript(initializeMap);
       } else if (!isLocationLoading && !currentLocation) {
           setIsMapLoading(false);
       }
       return () => {
            if ((window as any).initMap === initializeMap) {
                 delete (window as any).initMap;
                 console.log("Cleaned up initMap callback assignment.");
            }
       };
   }, [isLocationLoading, currentLocation, initializeMap]);

   // --- Styles ---

   // Style for the outer container to center the box
   const pageStyle: React.CSSProperties = {
       display: 'flex',
       justifyContent: 'center',
       alignItems: 'center',
       minHeight: '100vh', // Use minHeight to ensure it takes at least full viewport height
       width: '100%',
       backgroundColor: '#f0f0f0', // Background for the page area outside the box
       padding: '2rem', // Add some padding around the box
       boxSizing: 'border-box', // Include padding in height/width calculation
   };

   // Style for the map box itself
   const mapBoxStyle: React.CSSProperties = {
       width: '100%',         // Adjust width as needed
       maxWidth: '3500px',    // Max width for larger screens
       height: '70vh',       // Adjust height as needed
       border: '2px solid #ccc', // Visible border
       borderRadius: '8px',   // Slightly rounded corners
       boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow
       position: 'relative', // Needed for absolute positioning of overlays within the box
       overflow: 'hidden',   // Hide anything extending beyond the border-radius
       backgroundColor: '#e0e0e0', // Placeholder background for the map area before it loads
   };

   // Style for the inner div that Google Maps controls
   const mapInnerStyle: React.CSSProperties = {
       width: '100%',
       height: '100%',
   };

   // Style for the loading/error overlays (unchanged, now relative to mapBoxStyle)
   const overlayStyle: React.CSSProperties = {
       position: 'absolute',
       top: 0,
       left: 0,
       right: 0,
       bottom: 0,
       display: 'flex',
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: 'rgba(50, 50, 50, 0.8)',
       color: 'white',
       zIndex: 10,
       padding: '20px',
       textAlign: 'center',
       fontSize: '1.1em',
       // Ensure text wraps if message is long
       overflowY: 'auto',
       wordWrap: 'break-word',
   };

   // --- JSX ---
   return (
     // Outer container to center the box on the page
     <div style={pageStyle} className="min-h-screen w-full bg-gradient-to-br from-sheild-darkblue to-black flex flex-col">

       {/* The visible box containing the map */}
       <div style={mapBoxStyle}>

         {/* Map Div: This inner div is given to Google Maps */}
         <div ref={mapContainerRef} style={mapInnerStyle}>
           {/* Google Map renders inside this div */}
         </div>

         {/* Loading Indicator Overlay (inside the box) */}
         {(isMapLoading || isLocationLoading) && !errorMsg && (
           <div style={overlayStyle}>
             <p>{isLocationLoading ? 'Getting your location...' : 'Loading map...'}</p>
           </div>
         )}

         {/* Error Message Overlay (inside the box) */}
         {errorMsg && (
           <div style={overlayStyle}>
             <p>⚠️ {errorMsg}</p>
           </div>
         )}

         {/* Placeholder if map didn't load (inside the box) */}
         {!isMapLoading && !isLocationLoading && !mapRef.current && !errorMsg && (
           <div style={overlayStyle}>
             <p>Map container ready, but map did not initialize.</p>
           </div>
         )}

       </div>
     </div>
   );
};

export default LocateMeMinimalMap;