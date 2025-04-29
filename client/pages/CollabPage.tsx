import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useRef, useCallback
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from '@/components/Logo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ArrowLeft, Users, Clock, Map as MapIcon, CheckCircle, XCircle, MessageCircle, User, ShieldCheck, PhoneCall , Mailbox  } from 'lucide-react';
import { format } from 'date-fns';

// --- IMPORTANT: Replace with your actual Google Maps API Key ---
// --- Make sure Maps JavaScript API and Places API are enabled ---
const Maps_API_KEY = import.meta.env.VITE_MAPS_API_KEY; // <--- REPLACE THIS

// --- Function to load the Google Maps script (includes 'places' library) ---
const loadGoogleMapsScript = (callback: () => void) => {
  const existingScript = document.getElementById('googleMapsScript');

  if (!existingScript) {
    const script = document.createElement('script');
    // Add '&libraries=places' to load the Places library for Autocomplete
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Maps_API_KEY}&libraries=places&callback=initMapCallback`; // Use a unique callback name
    script.id = 'googleMapsScript';
    script.async = true;
    script.defer = true;
    (window as any).initMapCallback = callback; // Assign unique callback
    document.body.appendChild(script);
    console.log("Google Maps script added to body (with Places library).");
  } else {
    // Check if the places library is loaded on the existing script
    if ((window as any).google?.maps?.places) {
      console.log("Google Maps (with Places) already loaded, executing callback.");
      callback(); // Places library is ready
    } else {
      console.log("Google Maps script exists but Places library might be missing or not ready. Re-assigning callback.");
      // Re-assign callback in case the script exists but wasn't fully initialized or lacks 'places'
      (window as any).initMapCallback = callback;
      // If the script exists but lacks 'places', manual intervention might be needed.
      // For simplicity, we assume re-running the callback might work once loaded,
      // or the existing script already includes 'places' from another component.
       if ((window as any).google && !(window as any).google.maps.places && typeof (window as any).initMapCallback === 'function') {
           console.warn("Existing script detected without Places library. Autocomplete might fail until fully loaded.");
           // Attempt to run callback anyway - may succeed if Places loads asynchronously
            // callback(); // Or delay calling this until places is confirmed
       } else if ((window as any).google?.maps?.places) {
           callback(); // Call if places is now available
       }
    }
  }
};


// --- Type Definitions (Assuming these match your backend/data structures) ---
interface TravelRequest {
  requestId: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  status: 'searching' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
}

interface TravelMatch {
  // From original match
  userId: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  requestId: string;
  // Added from UserDetail (fetched by backend)
  name: string;
  profilePicture: string | null;
  verificationStatus: 'Verified' | 'Unverified'; // Simplified status text
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

interface MatchApiResponse {
  status: 'searching' | 'matched';
  potentialMatches?: TravelMatch[]; // Present if status is 'searching'
  matches?: TravelMatch[];          // Present if status is 'matched'
  count: number;
  yourRequestId: string;
}

interface OutgoingRequest {
  _id: string;
  requestedUser: {
    name: string;
    profilePicture: string | null;
    uid: string;
  };
  message: string;
  status: 'pending' | 'accepted' | 'rejected'; // Add other potential statuses if applicable
  createdAt: string;
  updatedAt: string;
  requesterDetails?: { // Assuming this might be included based on your example
    originAddress: string;
    destinationAddress: string;
    departureTime: string;
  };
}

interface IncomingRequest {
  _id: string;
  requesterUser: { // Renamed from requestedUser to requesterUser
    name: string;
    profilePicture: string | null;
    uid: string;
  };
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  requesterDetails?: {
    originAddress: string;
    destinationAddress: string;
    departureTime: string;
  };
}

interface ActiveJourney {
  _id: string;
  partner: {
    name: string;
    profilePicture: string | null;
    uid: string;
  };
  journeyDetails: {
    originAddress: string;
    destinationAddress: string;
    departureTime: string;
  };
  connectionMessage: string;
  status: 'accepted' | 'in_progress'; // Add other potential statuses if applicable
  acceptedAt: string;
}

interface JourneyHistoryItem {
  _id: string;
  partner: {
    name: string;
    profilePicture: string | null;
    uid: string;
  };
  requesterDetails: {
    originAddress: string;
    destinationAddress: string;
    departureTime: string;
  };
  connectionMessage: string;
  endedAt: string;
  endedBy: {
    name: string;
    uid: string;
  };
  createdAt: string;
  acceptedAt: string;
}


// --- Component Start ---
const CollabPage = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [travelMode, setTravelMode] = useState<'walking' | 'public_transport' | 'car'>('walking');


  const [activeTab, setActiveTab] = useState<'request' | 'matches' | 'outgoing' | 'incoming' | 'activeJourneys' | 'groups' | 'journeyHistory'>('request');
  const [loading, setLoading] = useState(false); // General loading state
  const [requestSent, setRequestSent] = useState(false);

  const [userRequests, setUserRequests] = useState<TravelRequest[]>([]);
  const [matches, setMatches] = useState<TravelMatch[]>([]);
  const [groups, setGroups] = useState<TravelGroup[]>([]);

  const [userHasActiveRequest, setUserHasActiveRequest] = useState<boolean | null>(null);
  const [matchLoading, setMatchLoading] = useState(false); // Separate loading 

  // --- Refs for Autocomplete ---
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // --- State for selected Place objects ---
  const [selectedOriginPlace, setSelectedOriginPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [selectedDestinationPlace, setSelectedDestinationPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [selectedMatchUserId, setSelectedMatchUserId] = useState<string | null>(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [connectLoading, setConnectLoading] = useState(false); 

  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
  const [outgoingLoading, setOutgoingLoading] = useState(false);

  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [incomingLoading, setIncomingLoading] = useState(false);

  const [activeJourneys, setActiveJourneys] = useState<ActiveJourney[]>([]);
  const [activeJourneysLoading, setActiveJourneysLoading] = useState(false);

  const [journeyHistory, setJourneyHistory] = useState<JourneyHistoryItem[]>([]);
  const [journeyHistoryLoading, setJourneyHistoryLoading] = useState(false);

  // --- Initialize Autocomplete ---
  const initializeAutocomplete = useCallback(() => {
    if (!(window as any).google?.maps?.places) {
      console.warn("Google Places API not ready for Autocomplete initialization.");
      toast.error("Initialization Error. Address search service not ready yet.");
      return;
    }
    console.log("Attempting to initialize Autocomplete instances...");

    const options: google.maps.places.AutocompleteOptions = {
      fields: ["formatted_address", "geometry", "name", "place_id"], // Request fields needed
      // Optional: Add componentRestrictions, types, etc.
      // componentRestrictions: { country: "us" },
      // types: ['address']
    };

    // Initialize Origin Autocomplete
    if (originInputRef.current && !originAutocompleteRef.current) { // Initialize only once
      try {
        const autocomplete = new google.maps.places.Autocomplete(originInputRef.current, options);
        originAutocompleteRef.current = autocomplete; // Store instance

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location && place.formatted_address) {
            console.log("Origin place selected:", place.name, place.geometry.location.toString());
            setOrigin(place.formatted_address); // Update input display text
            setSelectedOriginPlace(place);      // Store the full place object
          } else {
            console.log("Autocomplete (Origin): No valid details for input: '" + place.name + "' or input cleared.");
            // If user types without selecting, or clears input, clear the selected place
             setSelectedOriginPlace(null);
             // Keep the raw input value if needed for display? Depends on UX choice.
             // setOrigin(originInputRef.current?.value || '');
          }
        });
        console.log("Origin Autocomplete Initialized.");
      } catch (error) {
         console.error("Error initializing Origin Autocomplete:", error);
         toast.error("Autocomplete Error. Failed to initialize origin address search.");
      }
    }

    // Initialize Destination Autocomplete
    if (destinationInputRef.current && !destinationAutocompleteRef.current) { // Initialize only once
       try {
        const autocomplete = new google.maps.places.Autocomplete(destinationInputRef.current, options);
        destinationAutocompleteRef.current = autocomplete; // Store instance

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location && place.formatted_address) {
            console.log("Destination place selected:", place.name, place.geometry.location.toString());
            setDestination(place.formatted_address); // Update input display text
            setSelectedDestinationPlace(place);      // Store the full place object
          } else {
            console.log("Autocomplete (Destination): No valid details for input: '" + place.name + "' or input cleared.");
            setSelectedDestinationPlace(null);
            // setDestination(destinationInputRef.current?.value || '');
          }
        });
        console.log("Destination Autocomplete Initialized.");
       } catch(error) {
           console.error("Error initializing Destination Autocomplete:", error);
           toast.error("Autocomplete Error. Failed to initialize destination address search.");
       }
    }
  }, [toast]); // Include toast in dependencies if used inside useCallback

  // --- Effect to load Google Maps Script and Initialize Autocomplete ---
  useEffect(() => {
    if (!Maps_API_KEY) {
        console.error("API Key for Google Maps is missing or is a placeholder.");
        toast.error("Configuration Error. Google Maps API Key is not configured.");
        return; // Don't attempt to load script without a key
    }

    console.log("CollabPage mounted. Loading Google Maps script...");
    loadGoogleMapsScript(() => {
        console.log("Google Maps script loaded callback triggered.");
        initializeAutocomplete(); // Initialize autocomplete once script is ready
    });

    // --- Cleanup function ---
    return () => {
      // Clean up the global callback function to prevent memory leaks if component unmounts
      if ((window as any).initMapCallback === initializeAutocomplete) {
          delete (window as any).initMapCallback;
          console.log("Cleaned up initMapCallback assignment.");
      }
      // Optional: Explicitly remove listeners if needed, though usually handled.
      // if (originAutocompleteRef.current) google.maps.event.clearInstanceListeners(originAutocompleteRef.current);
      // if (destinationAutocompleteRef.current) google.maps.event.clearInstanceListeners(destinationAutocompleteRef.current);
      // console.log("Autocomplete listeners potentially cleared.");
    };
  }, [initializeAutocomplete, toast]); // Depend on initializeAutocomplete


  // --- Fetch user data (Requests, Matches, Groups) ---
  // Keep your existing fetch functions: fetchUserRequests, fetchMatches, fetchUserGroups
  // Ensure they are called appropriately, e.g., in a separate useEffect:
   useEffect(() => {
    fetchUserRequests();
    // fetchMatches();
    fetchUserGroups();
    // Note: Add appropriate dependency array if these functions depend on props/state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    if (activeTab === 'matches') {
      console.log("Matches tab activated, fetching matches...");
      fetchMatches();
  } else if (activeTab === 'outgoing') { // <-- ADDED THIS CONDITION
      console.log("Outgoing Requests tab activated, fetching...");
      fetchOutgoingRequests();
  } else if (activeTab === 'incoming') { // <-- ADDED THIS CONDITION
    console.log("Incoming Requests tab activated, fetching...");
    fetchIncomingRequests();
  }else if (activeTab === 'groups') {
      console.log("Groups tab activated, fetching groups...");
      fetchUserGroups();
  } else if (activeTab === 'request') {
      // Fetch initial requests if needed when switching back to request tab
       fetchUserRequests();
  } else if (activeTab === 'activeJourneys') { // <-- ADDED THIS CONDITION
    console.log("Active Journeys tab activated, fetching...");
    fetchActiveJourneys();
  } else if (activeTab === 'journeyHistory') { // <-- ADDED THIS CONDITION
    console.log("Journey History tab activated, fetching...");
    fetchJourneyHistory();
  }
    // You could add else if conditions for other tabs if needed
  }, [activeTab]);

  const fetchUserRequests = async () => {
    // ... (keep existing implementation) ...
     try {
      setLoading(true);
      const response = await fetch('https://sheild-backend.onrender.com/api/collab/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setUserRequests(data.requests || []); // Ensure it's an array
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    // Confirmation Dialog
    if (!window.confirm("Are you sure you want to cancel this travel request? This action cannot be undone.")) {
      return; // User cancelled the action
    }

    try {
      setLoading(true); // Indicate loading state
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in to cancel a request.");
        return; // Exit if no token
      }

      console.log(`Attempting to cancel request with ID: ${requestId}`);

      // API Call - Assuming DELETE /api/collab/delete-request/{requestId}
      const response = await fetch(`https://sheild-backend.onrender.com/api/collab/delete-request`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
          // No 'Content-Type' or body usually needed for DELETE by ID
        }
      });

      if (!response.ok) {
        // Try to get error message from backend, otherwise use status text
        const errorData = await response.json().catch(() => ({ message: `Failed to cancel request. Server responded with status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle successful cancellation (DELETE often returns 204 No Content, or maybe a success message)
      console.log(`Request ${requestId} cancelled successfully.`);
      toast.success("Request Cancelled. Your travel request has been successfully cancelled.");

      // Refresh the list of user requests to reflect the change
      fetchUserRequests();

    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error("An unexpected error occurred while cancelling the request.");
    } finally {
      setLoading(false); // Reset loading state regardless of outcome
    }
  };


  const fetchMatches = async () => {
    console.log("Running fetchMatches...");
    setMatchLoading(true); // Use separate loading state for matches tab
    setMatches([]); // Clear previous matches initially
    setUserHasActiveRequest(null); // Reset active request status
    try {
     const token = localStorage.getItem('token');
     if (!token) {
         throw new Error('Authentication token not found.'); // Should be handled by route protection ideally
     }

     const response = await fetch('https://sheild-backend.onrender.com/api/collab/match', { // Correct endpoint
       headers: {
         'Authorization': `Bearer ${token}`,
       }
     });

     if (!response.ok) {
       if (response.status === 404) { // Special handling for 404 - No Active Request
         console.log("Fetch matches returned 404: No active travel request found.");
         setMatches([]);
         setUserHasActiveRequest(false); // Explicitly set that user has no active request
         // No toast needed for 404, it's an expected state
         return;
       }
       // Handle other errors
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.message || `Failed to fetch matches: ${response.statusText}`);
     }

     // If response is OK (200)
     const data: MatchApiResponse = await response.json();
     console.log("Match API Response:", data);
     setUserHasActiveRequest(true); // User has an active request since we got a 200 OK

     // --- Process response based on status ---
     if (data.status === 'searching' && data.potentialMatches) {
       console.log(`Status: searching, Found ${data.count} potential matches.`);
       setMatches(data.potentialMatches); // Update state with potential matches [4][6]
     } else if (data.status === 'matched' && data.matches) {
       console.log(`Status: matched, Found ${data.count} confirmed matches.`);
       setMatches(data.matches); // Update state with confirmed matches [4][6]
     } else {
         // Handle unexpected response structure or status
         console.warn("Unexpected match API response structure:", data);
         setMatches([]); // Default to empty if structure is wrong
     }

   } catch (error) {
     console.error('Error fetching matches:', error);
     setMatches([]); // Clear matches on error
     // Avoid toast for auth errors if handled globally
   } finally {
     setMatchLoading(false);
   }
 };


  const fetchUserGroups = async () => {
    // ... (keep existing implementation) ...
    try {
      setLoading(true);
      const response = await fetch('https://sheild-backend.onrender.com/api/collab/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      setGroups(data.groups || []); // Ensure it's an array
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendConnectRequest = async () => {
    if (!selectedMatchUserId || !connectMessage.trim()) {
      toast.error("Missing Information. Please enter a message to send.");
      return;
    }

    setConnectLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
       toast.error("Authentication Error. You must be logged in.");
       setConnectLoading(false);
       return;
    }

    const requestBody = {
      requestedUserId: selectedMatchUserId,
      message: connectMessage.trim(),
    };

    console.log("Sending connection request:", requestBody);

    try {
      const response = await fetch('https://sheild-backend.onrender.com/api/collab/journey/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send request.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Assuming success returns a 2xx status
      const responseData = await response.json().catch(() => ({})); // Handle potential empty success response
      console.log("Connection request successful:", responseData);

      toast.success("Your connection request has been sent.");

      setIsConnectDialogOpen(false); // Close the dialog
      setConnectMessage('');       // Clear the message input
      setSelectedMatchUserId(null); // Clear the selected user ID

    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error("Request Error. An unexpected error occurred.");
    } finally {
      setConnectLoading(false);
    }
  };

  const fetchOutgoingRequests = async () => {
    console.log("Fetching outgoing journey requests...");
    setOutgoingLoading(true);
    setOutgoingRequests([]); // Clear previous requests
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in.");
        return;
      }

      const response = await fetch('https://sheild-backend.onrender.com/api/collab/journey/requests/outgoing', { // <-- Correct endpoint [2]
        method: 'GET', // Method is GET
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json' // Not usually needed for GET
        }
      });

      if (!response.ok) {
        // Handle potential errors like 404 Not Found or server issues [2]
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch outgoing requests. Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Expecting an array of OutgoingRequest objects based on your example
      const data: OutgoingRequest[] = await response.json();
      console.log("Outgoing requests fetched:", data);
      setOutgoingRequests(data || []); // Update state, ensure it's an array

    } catch (error) {
      console.error('Error fetching outgoing requests:', error);
      setOutgoingRequests([]); // Clear on error
      toast.error("Error Fetching Requests. Could not retrieve your sent journey requests.");
    } finally {
      setOutgoingLoading(false);
    }
  };

  const handleRespondToRequest = async (journeyId: string, accept: boolean) => {
    console.log(`Responding to request ${journeyId}: Accept = ${accept}`);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in.");
        return;
      }

      const response = await fetch(`https://sheild-backend.onrender.com/api/collab/journey/request/${journeyId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ accept }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to respond to request. Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Refresh incoming requests after successful response
      fetchIncomingRequests();
      toast.success(`Request ${accept ? 'accepted' : 'rejected'} successfully.`);

    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error("Response Error. Failed to process the request.");
    }
  };

  const fetchActiveJourneys = async () => {
    console.log("Fetching active journeys...");
    setActiveJourneysLoading(true);
    setActiveJourneys([]); // Clear previous journeys
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in.");
        return;
      }

      const response = await fetch('https://sheild-backend.onrender.com/api/collab/journey/active', { // <-- Active endpoint
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json' // Not usually needed for GET
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch active journeys. Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ActiveJourney[] = await response.json();
      console.log("Active journeys fetched:", data);
      setActiveJourneys(data || []);

    } catch (error) {
      console.error('Error fetching active journeys:', error);
      setActiveJourneys([]); // Clear on error
      toast.error("Error Fetching Journeys. Could not retrieve your active journeys.");
    } finally {
      setActiveJourneysLoading(false);
    }
  };

  const handleEndJourney = async (journeyId: string) => {
    console.log(`Ending journey with ID: ${journeyId}`);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in.");
        return;
      }

      const response = await fetch(`https://sheild-backend.onrender.com/api/collab/journey/${journeyId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json' // Should be JSON, but no body needed
        },
        // No body required
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to end journey. Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Refresh active journeys after successful end
      fetchActiveJourneys();
      toast.success("Journey ended successfully.");

    } catch (error) {
      console.error('Error ending journey:', error);
      toast.error("Ending Error. Failed to end the journey.");
    }
  };

  const fetchJourneyHistory = async () => {
    console.log("Fetching journey history...");
    setJourneyHistoryLoading(true);
    setJourneyHistory([]); // Clear previous history
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in.");
        return;
      }

      const response = await fetch('https://sheild-backend.onrender.com/api/collab/journey/history', { // <-- History endpoint
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json' // Not usually needed for GET
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch journey history. Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: JourneyHistoryItem[] = await response.json();
      console.log("Journey history fetched:", data);
      setJourneyHistory(data || []);

    } catch (error) {
      console.error('Error fetching journey history:', error);
      setJourneyHistory([]); // Clear on error
      toast.error("Error Fetching History. Could not retrieve your journey history.");
    } finally {
      setJourneyHistoryLoading(false);
    }
  };

  const cancelOutgoingRequest = async (journeyRequestId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in.");
        return;
      }
  
      const response = await fetch(`https://sheild-backend.onrender.com/api/collab/journey/request/${journeyRequestId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to cancel request.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      // Remove the cancelled request from the outgoingRequests state
      setOutgoingRequests(prev => prev.filter(req => req._id !== journeyRequestId));
  
      toast.success("Request cancelled successfully.");
    } catch (error) {
      console.error('Error cancelling outgoing request:', error);
      toast.error("Failed to cancel request.");
    }
  };

  // --- Geolocation Function (Modified for better integration) ---
  const getUserCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation Unavailable. Browser doesn't support geolocation.");
      return;
    }
     if (!google?.maps?.Geocoder) {
        toast.error("Geocoding Error. Google Geocoding service not available.");
        return;
     }

    setLoading(true); // Indicate loading while getting location/address
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log("Geolocation obtained:", latLng);

        // --- Reverse Geocode to get address ---
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
          setLoading(false);
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            console.log("Reverse geocoding successful:", results[0].formatted_address);
            setOrigin(results[0].formatted_address); // Set the address in the input
            // We need a PlaceResult-like object for consistency if submitting immediately
            // Create a minimal mock PlaceResult or fetch details if needed by submit logic
            const mockPlace: google.maps.places.PlaceResult = {
                 formatted_address: results[0].formatted_address,
                 geometry: { location: new google.maps.LatLng(latLng.lat, latLng.lng) },
                 name: results[0].formatted_address.split(',')[0], // Use first part as name
                 place_id: results[0].place_id
            }
            setSelectedOriginPlace(mockPlace); // Set the selected place object

            toast.info("Location Set. Current location set as origin." );
          } else {
            console.error('Reverse geocoding failed:', status);
            // Fallback: use coordinates if geocoding fails
            setOrigin(`${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`);
            setSelectedOriginPlace(null); // Clear selected place if geocoding fails
            toast.error(`Geocoding Failed. Could not get address for location (${status}). Coordinates used.`);
          }
        });
      },
      (error) => {
        setLoading(false);
        console.error('Error getting geolocation:', error);
        toast.error("Location Error. Unable to get current location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for geolocation
    );
  };

  const fetchIncomingRequests = async () => {
    console.log("Fetching incoming journey requests...");
    setIncomingLoading(true);
    setIncomingRequests([]); // Clear previous requests
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication Error. You must be logged in.");
        return;
      }

      const response = await fetch('https://sheild-backend.onrender.com/api/collab/journey/requests/incoming', { // <-- Incoming endpoint
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json' // Not usually needed for GET
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch incoming requests. Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: IncomingRequest[] = await response.json();
      console.log("Incoming requests fetched:", data);
      setIncomingRequests(data || []);

    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      setIncomingRequests([]); // Clear on error
      toast.error("Error Fetching Requests. Could not retrieve your incoming journey requests.");
    } finally {
      setIncomingLoading(false);
    }
  };

  // --- Form Submission ---
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Validation ---
    if (!origin || !destination || !departureDate || !departureTime) {
      toast.error("Missing Information. Please fill in origin, destination, date, and time.");
      return;
    }
    // Check if valid places were selected using Autocomplete
    if (!selectedOriginPlace || !selectedOriginPlace.geometry?.location) {
       toast.error("Invalid Origin. Please select a valid origin using the suggestions.");
       return;
    }
     if (!selectedDestinationPlace || !selectedDestinationPlace.geometry?.location) {
       toast.error("Invalid Destination. Please select a valid destination using the suggestions.");
       return;
    }

    // --- Get Coordinates ---
    // Helper to safely get [lng, lat] array
    const getCoords = (location: google.maps.LatLng | google.maps.LatLngLiteral): [number, number] | null => {
         try {
             let lat: number | undefined;
             let lng: number | undefined;
             if (typeof location.lat === 'function' && typeof location.lng === 'function') {
                 lat = location.lat();
                 lng = location.lng();
             } else if (typeof location.lat === 'number' && typeof location.lng === 'number') {
                 lat = location.lat;
                 lng = location.lng;
             }

             if (typeof lat === 'number' && typeof lng === 'number') {
                 return [lng, lat]; // GeoJSON format [lng, lat]
             }
         } catch (error) {
             console.error("Error extracting coordinates:", error);
         }
         return null; // Invalid format or error
    };

    const originCoords = getCoords(selectedOriginPlace.geometry.location);
    const destinationCoords = getCoords(selectedDestinationPlace.geometry.location);

    if (!originCoords) {
         toast.error("Coordinate Error. Could not extract coordinates from the selected origin.");
         return;
    }
     if (!destinationCoords) {
         toast.error("Coordinate Error. Could not extract coordinates from the selected destination.");
         return;
    }


    // --- Prepare Request Data ---
    try {
      setLoading(true);
      const departureDateTime = new Date(`${departureDate}T${departureTime}`);
      if (isNaN(departureDateTime.getTime())) {
          throw new Error("Invalid date or time format.");
      }

      const requestData = {
        origin: {
          type: 'Point',
          coordinates: originCoords // [lng, lat]
        },
        destination: {
          type: 'Point',
          coordinates: destinationCoords // [lng, lat]
        },
        // Use formatted address from selected place, fallback to input state just in case
        originAddress: selectedOriginPlace.formatted_address || origin,
        destinationAddress: selectedDestinationPlace.formatted_address || destination,
        departureTime: departureDateTime.toISOString(),
        travelMode  
      };

      console.log("Submitting travel request:", requestData);

      // --- API Call ---
      const response = await fetch('https://sheild-backend.onrender.com/api/collab/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // credentials: 'include', // Usually not needed with Bearer token
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
        throw new Error(errorData.error || 'Failed to submit travel request');
      }

      const data = await response.json();
      console.log("Request successful:", data);

      toast.success("Travel partner request submitted!");
      setRequestSent(true); // Show success message/state
      fetchUserRequests(); // Refresh the list of requests
      fetchMatches()
      // Optionally clear form fields or redirect
      // setOrigin(''); setDestination(''); setSelectedOriginPlace(null); setSelectedDestinationPlace(null);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error("Submission Error. Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };


  // --- Group Actions (Join/Leave) ---
  // Keep your existing handleJoinGroup and handleLeaveGroup functions
   const handleJoinGroup = async (groupId: string) => {
    // ... (keep existing implementation) ...
     try {
      setLoading(true);
      const response = await fetch(`https://sheild-backend.onrender.com/api/collab/join/${groupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to join group' }));
        throw new Error(errorData.error || 'Failed to join group');
      }

      const data = await response.json();

      fetchUserGroups(); // Refresh groups list

    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    // ... (keep existing implementation) ...
     try {
      setLoading(true);
      const response = await fetch(`https://sheild-backend.onrender.com/api/collab/leave/${groupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: 'Failed to leave group' }));
        throw new Error(errorData.error || 'Failed to leave group');
      }

      const data = await response.json();


      fetchUserGroups(); // Refresh groups list

    } catch (error) {
      console.error('Error leaving group:', error);

    } finally {
      setLoading(false);
    }
  };


  // --- Utility Functions ---
  // Keep your existing formatDateTime function
  const formatDateTime = (dateTimeStr: string) => {
     try {
      const date = new Date(dateTimeStr);
      // Check if date is valid before formatting
      return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy h:mm a') : "Invalid Date";
    } catch (e) {
      console.error("Error formatting date:", dateTimeStr, e);
      return dateTimeStr; // Fallback
    }
  };

  const VerificationStatusBadge: React.FC<{ status: 'Verified' | 'Unverified' }> = ({ status }) => {
    // Determine color based on the text status received from backend
    const colorClasses = status === 'Verified'
        ? "bg-green-500/20 text-green-300" // Green for Verified
        : "bg-red-500/20 text-red-300";    // Red for Unverified

    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${colorClasses}`}>
            {status}
        </span>
    );
};

  // --- JSX Structure ---
  return (
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
      

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto"> {/* Added overflow-y-auto */}
        <h1 className="text-2xl font-bold text-white mb-6 text-center sm:text-left">Find Travel Partners</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto whitespace-nowrap">
          <button
            className={`py-2 px-4 text-sm sm:text-base transition-colors duration-200 ${activeTab === 'request' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('request')}
          >
            Request Partner
          </button>
          <button
            className={`py-2 px-4 text-sm sm:text-base transition-colors duration-200 ${activeTab === 'matches' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('matches')}
          >
            Your Matches
          </button>
          <button
            className={`py-2 px-4 text-sm sm:text-base transition-colors duration-200 ${activeTab === 'outgoing' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('outgoing')}
          >
            Outgoing Requests
          </button>
          <button
            className={`py-2 px-4 text-sm sm:text-base transition-colors duration-200 ${activeTab === 'incoming' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('incoming')}
          >
            Incoming Requests
          </button>
          <button
            className={`py-2 px-4 text-sm sm:text-base transition-colors duration-200 ${activeTab === 'activeJourneys' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('activeJourneys')}
          >
            Active Journeys
          </button>
          <button
            className={`py-2 px-4 text-sm sm:text-base transition-colors duration-200 ${activeTab === 'journeyHistory' ? 'text-sheild-lightpurple border-b-2 border-sheild-lightpurple font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('journeyHistory')}
          >
            Journey History
          </button>
        </div>

        {/* Request Partner Tab Content */}
        {activeTab === 'request' && (
          <div className="flex-1">
            {!requestSent ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4 w-full mx-auto">
                {/* Origin Input with Autocomplete */}
                <div>
                  <label htmlFor="origin-input" className="block text-sm font-medium text-gray-300 mb-1">Origin</label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="origin-input"
                      ref={originInputRef} // Attach ref
                      type="text"
                      value={origin} // Control component value
                      onChange={(e) => {
                          setOrigin(e.target.value);
                          // If user types manually after selecting, clear the selected place object
                          if (selectedOriginPlace && e.target.value !== selectedOriginPlace.formatted_address) {
                              setSelectedOriginPlace(null);
                          }
                      }}
                      placeholder="Enter starting address"
                      className="flex-1 py-2 px-4 bg-black bg-opacity-20 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                      required
                    />
                    <Button
                      type="button"
                      onClick={getUserCurrentLocation}
                      variant="outline"
                      size="sm"
                      className="bg-sheild-purple text-white hover:bg-sheild-purple/80 border-sheild-purple/50 px-3"
                      disabled={loading} // Disable while loading location
                    >
                      {loading ? '...' : 'Current'}
                    </Button>
                  </div>
                </div>

                {/* Destination Input with Autocomplete */}
                <div>
                  <label htmlFor="destination-input" className="block text-sm font-medium text-gray-300 mb-1">Destination</label>
                  <input
                    id="destination-input"
                    ref={destinationInputRef} // Attach ref
                    type="text"
                    value={destination} // Control component value
                     onChange={(e) => {
                          setDestination(e.target.value);
                           if (selectedDestinationPlace && e.target.value !== selectedDestinationPlace.formatted_address) {
                              setSelectedDestinationPlace(null);
                          }
                      }}
                    placeholder="Enter destination address"
                    className="w-full py-2 px-4 bg-black bg-opacity-20 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sheild-purple"
                    required
                  />
                </div>

                {/* Date and Time Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="departure-date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                    <input
                      id="departure-date"
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full py-2 px-4 bg-black bg-opacity-20 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple appearance-none" // Basic styling for date/time inputs
                      required
                       min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                    />
                  </div>
                  <div>
                    <label htmlFor="departure-time" className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                    <input
                      id="departure-time"
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full py-2 px-4 bg-black bg-opacity-20 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple appearance-none"
                      required
                    />
                  </div>
                </div>

                {/* Travel Mode Radio Buttons */}
                 <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Travel Mode</label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                     {(['walking', 'public_transport', 'car'] as const).map((mode) => (
                         <label key={mode} className="flex items-center text-white cursor-pointer text-sm">
                          <input
                            type="radio"
                            name="travelMode"
                            value={mode}
                            checked={travelMode === mode}
                            onChange={() => setTravelMode(mode)}
                             className="mr-2 h-4 w-4 text-sheild-purple bg-gray-700 border-gray-600 focus:ring-sheild-purple" // Basic radio styling
                          />
                          {mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                     ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sheild-purple text-white hover:bg-sheild-purple/80 flex items-center justify-center py-3 text-base font-semibold disabled:opacity-60"
                  >
                    <Users size={18} className="mr-2" />
                    {loading ? 'Submitting Request...' : 'Find Travel Partners'}
                  </Button>
                </div>
              </form>
            ) : (
               // Request Sent Confirmation State
              <div className="text-center py-8 max-w-lg mx-auto">
                <div className="bg-sheild-darkblue/50 border border-sheild-purple/30 p-6 rounded-lg mb-6 shadow-lg">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                  <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                  <p className="text-gray-300 text-sm sm:text-base">
                    We are now searching for partners travelling from <span className="font-medium text-white">{selectedOriginPlace?.name || origin}</span> to <span className="font-medium text-white">{selectedDestinationPlace?.name || destination}</span> around{' '}
                    <span className="font-medium text-white">{departureTime}</span> on{' '}
                    <span className="font-medium text-white">{departureDate}</span>.
                  </p>
                   <p className="text-gray-400 text-xs mt-3">You can check the 'Your Matches' tab for updates.</p>
                </div>

                <Button
                  onClick={() => {
                      setRequestSent(false);
                      // Optionally clear form fields
                      setOrigin(''); setDestination(''); setSelectedOriginPlace(null); setSelectedDestinationPlace(null);
                      setDepartureDate(''); setDepartureTime('');
                  }}
                  variant="outline"
                  className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                >
                  Create Another Request
                </Button>
              </div>
            )}

            {/* Display Existing User Requests */}
             {userRequests.length > 0 && !requestSent && ( // Show only if not in 'requestSent' state
              <div className="mt-10 w-full mx-auto">
                <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Your Active Requests</h3>
                <div className="space-y-4">
                  {userRequests.map(request => (
                    <div key={request.requestId} className="bg-sheild-darkblue/50 p-4 rounded-lg border border-gray-700 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0"> {/* Allow text truncation */}
                          <div className="text-xs text-gray-400 uppercase tracking-wider">From</div>
                          <div className="text-white truncate" title={request.originAddress}>{request.originAddress}</div>
                        </div>
                        <div className="flex-1 min-w-0 text-left sm:text-right">
                          <div className="text-xs text-gray-400 uppercase tracking-wider">To</div>
                          <div className="text-white truncate" title={request.destinationAddress}>{request.destinationAddress}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700">
                        <div className="flex items-center text-gray-300 text-sm">
                          <Clock size={14} className="mr-1.5 flex-shrink-0" />
                          {formatDateTime(request.departureTime)}
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          request.status === 'searching' ? 'bg-yellow-500/20 text-yellow-300' :
                          request.status === 'matched' ? 'bg-green-500/20 text-green-300' :
                          request.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      {request.status === 'searching' && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-end">
                              <Button
                                  onClick={() => handleCancelRequest(request.requestId)}
                                  variant="destructive" // Red color scheme
                                  size="sm"
                                  className="flex items-center justify-center py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-60 text-xs"
                                  disabled={loading} // Disable if any loading operation is in progress
                              >
                                  <XCircle size={14} className="mr-1" /> {/* Cancel Icon */}
                                  Cancel Request
                              </Button>
                          </div>
                      )}
                     </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Matches Tab Content - UPDATED UI */}
        {activeTab === 'matches' && (
          <div className="flex-1">
            {/* Loading state for match list */}
            {matchLoading && <p className="loading-text">Loading matches...</p> }

            {/* Matches List */}
            {!matchLoading && matches.length > 0 && (
              <div className="space-y-4 w-full mx-auto">
                 <h3 className="list-header text-white">Potential Travel Partners ({matches.length})</h3>
                {matches.map(match => ( // 'match' now contains combined data
                  <div key={match.userId} className="bg-sheild-darkblue/50 p-4 rounded-lg border border-gray-700 shadow-sm">

                    {/* Top Part: User Info vs Destination */}
                    <div className="flex flex-col sm:flex-row justify-between mb-2 gap-3">
                      {/* Left Side: Avatar, Name, Verification Status */}
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                           {/* Use profilePicture directly */}
                           {match.profilePicture ? (
                              <img src={match.profilePicture} alt={match.name || 'Profile'} className="w-full h-full object-cover" />
                           ) : (
                              <User size={20} />
                           )}
                        </div>
                        {/* Name and Verification */}
                        <div className="min-w-0">
                           <h4 className="font-semibold text-white truncate" title={match.name || 'Fellow Traveler'}>
                               {match.name || 'Fellow Traveler'}
                           </h4>
                           {/* Use VerificationStatusBadge with text status */}
                           <VerificationStatusBadge status={match.verificationStatus} />
                        </div>
                      </div>

                      {/* Right Side: Destination Address */}
                      <div className="flex-1 min-w-0 text-left sm:text-right">
                        <div className="subtle-label text-gray-400">Destination</div>
                        <div className="text-white" title={match.destinationAddress}>
                            {match.destinationAddress}
                        </div>
                      </div>
                    </div>

                    {/* Middle Part: Time & Their Origin */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pt-2 border-t border-gray-700 gap-2">
                       <div className="flex items-center text-gray-300 text-sm">
                         <Clock size={14} className="mr-1.5 flex-shrink-0" />
                         {formatDateTime(match.departureTime)}
                       </div>
                       <div className="flex-1 min-w-0 text-left sm:text-right">
                         <div className="subtle-label text-gray-400">Origin</div>
                         <div className="text-white flex items-center justify-start sm:justify-end gap-1" title={match.originAddress}>
                            {match.originAddress}
                        </div>
                       </div>
                    </div>

                    {/* Bottom Part: Actions (Connect Button Only) */}
                    <div className="list-item-actions justify-end py-2">
                      {match.requestId && (
                         <Button
                            onClick={() => {
                              setSelectedMatchUserId(match.userId); // Store the user ID
                              setConnectMessage(''); // Clear previous message
                              setIsConnectDialogOpen(true); // Open the dialog
                            }}
                            size="sm"
                            className="connect-button"
                            disabled={loading} // General loading state
                         >
                           <CheckCircle size={14} className="mr-1.5" /> Connect
                         </Button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- No Matches/No Request Messages --- */}
            {!matchLoading && matches.length === 0 && (
                 <div className="text-center py-10 max-w-md mx-auto">
                  <Users size={48} className="mx-auto mb-4 text-gray-500" />
                   {/* Show different message based on whether user has an active request */}
                   {userHasActiveRequest === false ? (
                      <>
                        <h3 className="text-xl font-bold text-white mb-2">No Active Request</h3>
                        <p className="text-gray-400 mb-6 text-sm">Create a travel request first to find matches.</p>
                      </>
                   ) : (
                      <>
                         <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                         <p className="text-gray-400 mb-6 text-sm">We couldn't find matches for your request right now. Check back later.</p>
                      </>
                   )}
                  <Button onClick={() => setActiveTab('request')} className="bg-sheild-purple text-white hover:bg-sheild-purple/80">
                     Create Travel Request
                  </Button>
                </div>
            )}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className="flex-1">
            {/* Loading state */}
            {outgoingLoading && <p className="text-center text-gray-400 mt-8">Loading outgoing requests...</p>}

            {/* Outgoing Requests List */}
            {!outgoingLoading && outgoingRequests.length > 0 && (
              <div className="space-y-4 w-full w-full mx-auto"> {/* Adjusted max-width */}
                 <h3 className="text-lg font-medium text-white mb-4">Requests You Sent ({outgoingRequests.length})</h3>
                {outgoingRequests.map(request => (
                  <div key={request._id} className="bg-sheild-darkblue/50 p-4 rounded-lg border border-gray-700 shadow-sm">

                    {/* Top Section: Requested User Info & Status */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                      {/* Left: User Details */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                          {request.requestedUser.profilePicture ? (
                            <img src={request.requestedUser.profilePicture} alt={request.requestedUser.name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white truncate" title={request.requestedUser.name}>
                            {request.requestedUser.name || 'User'}
                          </h4>
                          
                        </div>
                      </div>

                      {/* Right: Status Badge */}
                      <div className="text-right mt-1 sm:mt-0">
                         <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            request.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                            request.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                           {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                         </span>
                       </div>
                    </div>

                    {/* Message Section */}
                    <div className="my-2 p-3 bg-black/10 border-l-4 border-sheild-purple/60 rounded-r-md">
                      <p className="text-sm text-gray-200 italic">"{request.message}"</p>
                    </div>

                     {/* Optional: Requester Details Section (if present and needed) */}
                     {request.requesterDetails && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-400 space-y-1">
                            <p><span className="font-medium text-gray-300">For Journey From:</span> {request.requesterDetails.originAddress}</p>
                            <p><span className="font-medium text-gray-300">To:</span> {request.requesterDetails.destinationAddress}</p>
                            <p><span className="font-medium text-gray-300">Departure:</span> {formatDateTime(request.requesterDetails.departureTime)}</p>
                        </div>
                     )}

                    {/* Bottom Section: Timestamps & Actions (e.g., Cancel) */}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">
                        Sent: {formatDateTime(request.createdAt)}
                      </span>
                       {/* Placeholder for Cancel Button if request is pending */}
                       {request.status === 'pending' && (
                          <Button
                          onClick={() => cancelOutgoingRequest(request._id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs px-2 py-1"
                        >
                          <XCircle size={14} className="mr-1" /> Cancel
                        </Button>
                       )}
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* No Outgoing Requests Message */}
            {!outgoingLoading && outgoingRequests.length === 0 && (
              <div className="text-center py-10 max-w-md mx-auto">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-white mb-2">No Outgoing Requests</h3>
                <p className="text-gray-400 mb-6 text-sm">
                  You haven't sent any journey requests to other users yet. Find potential partners in the 'Your Matches' tab.
                </p>
                 <Button onClick={() => setActiveTab('matches')} className="bg-sheild-purple text-white hover:bg-sheild-purple/80">
                    View Matches
                  </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'incoming' && (
          <div className="flex-1">
            {/* Loading state */}
            {incomingLoading && <p className="text-center text-gray-400 mt-8">Loading incoming requests...</p>}

            {/* Incoming Requests List */}
            {!incomingLoading && incomingRequests.length > 0 && (
              <div className="space-y-4 w-full mx-auto"> {/* Adjusted max-width */}
                 <h3 className="text-lg font-medium text-white mb-4">Requests You Received ({incomingRequests.length})</h3>
                {incomingRequests.map(request => (
                  <div key={request._id} className="bg-sheild-darkblue/50 p-4 rounded-lg border border-gray-700 shadow-sm">

                    {/* Top Section: Requester User Info & Status */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                      {/* Left: User Details */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                          {request.requesterUser.profilePicture ? (
                            <img src={request.requesterUser.profilePicture} alt={request.requesterUser.name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white truncate" title={request.requesterUser.name}>
                            {request.requesterUser.name || 'User'}
                          </h4>
                          <p className="text-xs text-gray-400">ID: {request.requesterUser.uid.substring(0, 10)}...</p> {/* Optional: show partial UID */}
                        </div>
                      </div>

                      {/* Right: Status Badge */}
                      <div className="text-right mt-1 sm:mt-0">
                         <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            request.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                            request.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                           {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                         </span>
                       </div>
                    </div>

                    {/* Message Section */}
                    <div className="my-2 p-3 bg-black/10 border-l-4 border-sheild-purple/60 rounded-r-md">
                      <p className="text-sm text-gray-200 italic">"{request.message}"</p>
                    </div>

                     {/* Optional: Requester Details Section (if present and needed) */}
                     {request.requesterDetails && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-400 space-y-1">
                            <p><span className="font-medium text-gray-300">For Journey From:</span> {request.requesterDetails.originAddress}</p>
                            <p><span className="font-medium text-gray-300">To:</span> {request.requesterDetails.destinationAddress}</p>
                            <p><span className="font-medium text-gray-300">Departure:</span> {formatDateTime(request.requesterDetails.departureTime)}</p>
                        </div>
                     )}

                    {/* Bottom Section: Timestamps & Actions (Accept/Reject) */}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">
                        Sent: {formatDateTime(request.createdAt)}
                      </span>
                      {/* Accept/Reject Buttons */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRespondToRequest(request._id, true)}
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:bg-green-500/10 hover:text-green-300 text-xs px-2 py-1"
                          >
                            <CheckCircle size={14} className="mr-1" /> Accept
                          </Button>
                          <Button
                            onClick={() => handleRespondToRequest(request._id, false)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs px-2 py-1"
                          >
                            <XCircle size={14} className="mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* No Incoming Requests Message */}
            {!incomingLoading && incomingRequests.length === 0 && (
              <div className="text-center py-10 max-w-md mx-auto">
                <Mailbox size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-white mb-2">No Incoming Requests</h3>
                <p className="text-gray-400 mb-6 text-sm">
                  No one has sent you a journey request yet. Keep your request active and check back later!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activeJourneys' && (
          <div className="flex-1">
            {/* Loading state */}
            {activeJourneysLoading && <p className="text-center text-gray-400 mt-8">Loading active journeys...</p>}

            {/* Active Journeys List */}
            {!activeJourneysLoading && activeJourneys.length > 0 && (
              <div className="space-y-4 w-full mx-auto"> {/* Adjusted max-width */}
                <h3 className="text-lg font-medium text-white mb-4">Your Active Journeys ({activeJourneys.length})</h3>
                {activeJourneys.map(journey => (
                  <div key={journey._id} className="bg-sheild-darkblue/50 p-4 rounded-lg border border-gray-700 shadow-sm">

                    {/* Top Section: Partner Info & Journey Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                      {/* Left: User Details */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                          {journey.partner.profilePicture ? (
                            <img src={journey.partner.profilePicture} alt={journey.partner.name || 'Partner'} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white truncate" title={journey.partner.name}>
                            {journey.partner.name || 'Partner'}
                          </h4>
                           {/* You could add a partner ID here if it's important */}
                        </div>
                      </div>

                      {/* Right: Journey Status (if needed) */}
                       <div className="text-right mt-1 sm:mt-0">
                         <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            journey.status === 'accepted' ? 'bg-blue-500/20 text-blue-300' :
                            journey.status === 'in_progress' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300' // Default case
                          }`}>
                            {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                         </span>
                       </div>
                    </div>

                    {/* Journey Details Section */}
                    <div className="mt-2 pt-2 border-t border-gray-700/50 text-sm text-gray-300 space-y-1">
                        <p><span className="font-medium text-gray-200">From:</span> {journey.journeyDetails.originAddress}</p>
                        <p><span className="font-medium text-gray-200">To:</span> {journey.journeyDetails.destinationAddress}</p>
                        <p><span className="font-medium text-gray-200">Departure:</span> {formatDateTime(journey.journeyDetails.departureTime)}</p>
                        <p className="italic text-gray-400 text-xs">Message: "{journey.connectionMessage}"</p>
                    </div>

                    {/* Bottom Section: End Journey Button */}
                    <div className="flex justify-end items-center mt-3 pt-2 border-t border-gray-700">
                      <Button
                        onClick={() => handleEndJourney(journey._id)}
                        variant="destructive"
                        size="sm"
                        className="text-white hover:bg-red-500/10 hover:text-red-300 text-xs px-2 py-1"
                      >
                        <XCircle size={14} className="mr-1" /> End Journey
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* No Active Journeys Message */}
            {!activeJourneysLoading && activeJourneys.length === 0 && (
              <div className="text-center py-10 max-w-md mx-auto">
                <MapIcon size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Journeys</h3>
                <p className="text-gray-400 mb-6 text-sm">
                  You are not currently on any active journeys. Find a travel partner to start one!
                </p>
                 <Button onClick={() => setActiveTab('request')} className="bg-sheild-purple text-white hover:bg-sheild-purple/80">
                    Find Travel Partners
                  </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'journeyHistory' && (
          <div className="flex-1">
            {/* Loading state */}
            {journeyHistoryLoading && <p className="text-center text-gray-400 mt-8">Loading journey history...</p>}

            {/* Journey History List */}
            {!journeyHistoryLoading && journeyHistory.length > 0 && (
              <div className="space-y-4 w-full mx-auto"> {/* Adjusted max-width */}
                <h3 className="text-lg font-medium text-white mb-4">Your Journey History ({journeyHistory.length})</h3>
                {journeyHistory.map(historyItem => (
                  <div key={historyItem._id} className="bg-sheild-darkblue/50 p-4 rounded-lg border border-gray-700 shadow-sm">

                    {/* Top Section: Partner Info & Journey Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                      {/* Left: User Details */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                          {historyItem.partner.profilePicture ? (
                            <img src={historyItem.partner.profilePicture} alt={historyItem.partner.name || 'Partner'} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white truncate" title={historyItem.partner.name}>
                            {historyItem.partner.name || 'Partner'}
                          </h4>
                           {/* You could add a partner ID here if it's important */}
                        </div>
                      </div>

                      {/* Right: Ended By (Person who ended the journey) */}
                      <div className="text-right mt-1 sm:mt-0">
                         <span className="text-xs text-gray-400">
                           Ended By: {historyItem.endedBy.name}
                         </span>
                       </div>
                    </div>

                    {/* Journey Details Section */}
                    <div className="mt-2 pt-2 border-t border-gray-700/50 text-sm text-gray-300 space-y-1">
                        <p><span className="font-medium text-gray-200">From:</span> {historyItem.requesterDetails.originAddress}</p>
                        <p><span className="font-medium text-gray-200">To:</span> {historyItem.requesterDetails.destinationAddress}</p>
                        <p><span className="font-medium text-gray-200">Departure:</span> {formatDateTime(historyItem.requesterDetails.departureTime)}</p>
                        <p className="italic text-gray-400 text-xs">Message: "{historyItem.connectionMessage}"</p>
                    </div>

                    {/* Bottom Section: Timestamps */}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">
                        Created: {formatDateTime(historyItem.createdAt)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Ended: {formatDateTime(historyItem.endedAt)}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* No Journey History Message */}
            {!journeyHistoryLoading && journeyHistory.length === 0 && (
              <div className="text-center py-10 max-w-md mx-auto">
                <Clock size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-white mb-2">No Journey History</h3>
                <p className="text-gray-400 mb-6 text-sm">
                  You have no past journeys to display. Start a new journey today!
                </p>
                 <Button onClick={() => setActiveTab('request')} className="bg-sheild-purple text-white hover:bg-sheild-purple/80">
                    Find Travel Partners
                  </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-sheild-darkblue border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Send Journey Request</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send a message to this user requesting to travel together.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="items-center">
              <Label htmlFor="connect-message" className="text-left text-gray-300" style={{ paddingBottom: '5px' }}>
                Message
              </Label>
              <Input
                id="connect-message"
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
                placeholder="e.g., Hi! Saw your request, looks like we're heading the same way. Want to share the journey?"
                className="col-span-3 bg-black bg-opacity-20 border-gray-600 text-white placeholder-gray-500 focus:ring-sheild-purple"
                maxLength={200} // Optional: limit message length
              />
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
               <Button type="button" variant="outline" className="text-black border-gray-600 hover:bg-gray-700 hover:text-white">
                Cancel
               </Button>
             </DialogClose>
            <Button
              type="button"
              onClick={handleSendConnectRequest}
              disabled={connectLoading || !connectMessage.trim()}
              className="bg-sheild-purple text-white hover:bg-sheild-purple/80 disabled:opacity-60"
            >
              {connectLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollabPage;
