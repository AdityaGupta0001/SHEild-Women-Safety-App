import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import Logo from '@/components/Logo';
import SheildButton from '@/components/SheildButton';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, X, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const REGULAR_GESTURES = [
  'Smile', 'Look Surprised', 'Look Angry', 'Look Sad', 'Look Neutral',
  'Open Mouth', 'Close Eyes', 
  'Turn Head Left', 'Turn Head Right', 
  'Tilt Head Left', 'Tilt Head Right'
];

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // --- UI State for Biometrics ---
  const [showModal, setShowModal] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('Loading secure AI models...');
  
  // --- Live Display State ---
  const [uiLevel, setUiLevel] = useState<'gender' | 'gestures'>('gender');
  const [uiGestureSequence, setUiGestureSequence] = useState<string[]>([]);
  const [uiCurrentIndex, setUiCurrentIndex] = useState(0);

  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const webcamRef = useRef<Webcam>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sessionState = useRef({
    level: 'gender' as 'gender' | 'gestures',
    sequence: [] as string[],
    currentIndex: 0,
    genderFrames: 0,
    maleFrames: 0,
    cooldown: 0,
    baseDescriptor: null as Float32Array | null,
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.ageGenderNet.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load ML models", error);
        toast.error("Failed to load security models. Please check your network.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const handleFailure = useCallback((reason: string) => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setVerificationStatus('failed');
    setStatusMessage(reason);
    toast.error(reason);
    
    setTimeout(() => {
      setShowModal(false);
      navigate('/');
    }, 2500);
  }, [navigate]);

  const handleInitialSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const numGestures = 4; 
    const sequence: string[] = [];
    let lastGesture = '';

    for (let i = 0; i < numGestures; i++) {
      let nextGesture;
      do {
        nextGesture = REGULAR_GESTURES[Math.floor(Math.random() * REGULAR_GESTURES.length)];
      } while (nextGesture === lastGesture);
      
      sequence.push(nextGesture);
      lastGesture = nextGesture;
    }

    sessionState.current = {
      level: 'gender',
      sequence: sequence,
      currentIndex: 0,
      genderFrames: 0,
      maleFrames: 0,
      cooldown: 0,
      baseDescriptor: null,
    };

    setUiGestureSequence(sequence);
    setUiCurrentIndex(0);
    setUiLevel('gender');
    setShowModal(true);
    setVerificationStatus('idle');
    
    if (modelsLoaded) {
      setStatusMessage('Level 1: Verifying Identity & Gender...');
    }
  };

  const handleSkipGesture = useCallback(() => {
    const state = sessionState.current;
    if (state.level !== 'gestures' || state.currentIndex >= state.sequence.length) return;

    let newGesture;
    const currentGesture = state.sequence[state.currentIndex];
    
    do {
      newGesture = REGULAR_GESTURES[Math.floor(Math.random() * REGULAR_GESTURES.length)];
    } while (newGesture === currentGesture);

    state.sequence[state.currentIndex] = newGesture;
    setUiGestureSequence([...state.sequence]);
    
    state.cooldown = 2; 
    setStatusMessage(`Swapped! Try: ${newGesture}`);
  }, []);

  const executeSignupCall = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      
      localStorage.setItem('token', data.token);
      toast.success('Account created successfully');
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : 'Signup failed');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [name, email, password, navigate]);

  const startScanning = useCallback(() => {
    if (!webcamRef.current || !webcamRef.current.video || !modelsLoaded) return;
    setVerificationStatus('scanning');

    scanIntervalRef.current = setInterval(async () => {
      const state = sessionState.current;
      
      if (state.cooldown > 0) {
        state.cooldown -= 1;
        return;
      }

      if (!webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()
        .withFaceDescriptor();

      if (!detection) {
        setStatusMessage('No face detected. Please center your face.');
        return;
      }

      // --- LEVEL 1: GENDER & ANCHOR CREATION ---
      if (state.level === 'gender') {
        if (detection.gender === 'male' && detection.genderProbability > 0.8) {
          state.maleFrames++;
          if (state.maleFrames > 3) return handleFailure('Access Denied: Platform restricted to female users.');
          return;
        }

        if (detection.gender === 'female' && detection.genderProbability > 0.8) {
          state.genderFrames++;
          setStatusMessage(`Analyzing... (${Math.min(state.genderFrames * 20, 100)}%)`);
          
          if (state.genderFrames >= 5) {
            state.baseDescriptor = detection.descriptor;
            state.level = 'gestures';
            setUiLevel('gestures');
            setStatusMessage('Identity locked. Prepare for liveness check...');
            state.cooldown = 4;
          }
        }
        return;
      }

      // --- LEVEL 2: GESTURES & CONTINUOUS TRACKING ---
      if (state.level === 'gestures') {
        
        // 1. Identity Lock
        if (state.baseDescriptor) {
          const distance = faceapi.euclideanDistance(state.baseDescriptor, detection.descriptor);
          if (distance > 0.6) return handleFailure('Security Alert: Face swap detected. Verification aborted.');
        }

        // 2. Pre-calculate landmarks and ratios
        const currentGesture = state.sequence[state.currentIndex];
        setStatusMessage(`Perform action: ${currentGesture}`);

        let gesturePassed = false;
        const { expressions, landmarks, detection: { box } } = detection;
        
        const nose = landmarks.getNose()[0];
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const mouth = landmarks.getMouth();
        
        const mouthOpenDist = Math.abs(mouth[14].y - mouth[18].y);
        const leftEyeHeight = Math.abs(leftEye[1].y - leftEye[5].y);
        const rightEyeHeight = Math.abs(rightEye[1].y - rightEye[5].y);
        
        const isMouthOpen = mouthOpenDist / box.height > 0.08;
        const areEyesClosed = (leftEyeHeight / box.height < 0.025) && (rightEyeHeight / box.height < 0.025);
        
        const isHeadTurnedLeft = (nose.x - leftEye[0].x) < ((rightEye[3].x - leftEye[0].x) * 0.35);
        const isHeadTurnedRight = (rightEye[3].x - nose.x) < ((rightEye[3].x - leftEye[0].x) * 0.35);
        
        const headAngle = Math.atan2(rightEye[0].y - leftEye[3].y, rightEye[0].x - leftEye[3].x) * (180 / Math.PI);
        const isTiltedLeft = headAngle < -15;
        const isTiltedRight = headAngle > 15;

        // Validation router
        switch (currentGesture) {
          case 'Smile': gesturePassed = expressions.happy > 0.8; break;
          case 'Look Surprised': gesturePassed = expressions.surprised > 0.8; break;
          case 'Look Angry': gesturePassed = expressions.angry > 0.8; break;
          case 'Look Sad': gesturePassed = expressions.sad > 0.8; break;
          case 'Look Neutral': gesturePassed = expressions.neutral > 0.8; break;
          case 'Open Mouth': gesturePassed = isMouthOpen; break;
          case 'Close Eyes': gesturePassed = areEyesClosed; break;
          
          // --- MIRRORED LOGIC SWAP ---
          // Because the webcam is mirrored visually for the user, when they turn to their 
          // physical left, the raw camera sensor sees them moving to the right. 
          // We swap the checks here so the instruction matches the natural user movement.
          case 'Turn Head Left': gesturePassed = isHeadTurnedRight; break;
          case 'Turn Head Right': gesturePassed = isHeadTurnedLeft; break;
          case 'Tilt Head Left': gesturePassed = isTiltedRight; break;
          case 'Tilt Head Right': gesturePassed = isTiltedLeft; break;
        }

        if (gesturePassed) {
          state.currentIndex++;
          setUiCurrentIndex(state.currentIndex);

          if (state.currentIndex >= state.sequence.length) {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            setVerificationStatus('success');
            setStatusMessage('All security checks passed!');
            
            setTimeout(() => {
              setShowModal(false);
              executeSignupCall();
            }, 1500);
          } else {
            setStatusMessage(`Great! Get ready for next...`);
            state.cooldown = 3; 
          }
        }
      }
    }, 500);
  }, [modelsLoaded, handleFailure, executeSignupCall]);

  const handleVideoLoad = () => {
    if (modelsLoaded && verificationStatus === 'idle') {
      startScanning();
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sheild-darkblue to-black flex items-center justify-center p-4">
      
      {/* --- MAIN FORM --- */}
      <div className={`w-full max-w-md bg-sheild-darkblue rounded-lg overflow-hidden relative transition-all duration-300 ${showModal ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sheild-purple rounded-full opacity-20 blur-3xl"></div>
        
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => navigate('/')} className="text-white p-1 rounded-full hover:bg-white/10">
            <ArrowLeft size={isMobile ? 18 : 20} />
          </button>
        </div>

        <div className="relative z-10 p-5 md:p-8">
          <div className="flex justify-center mb-6">
            <Logo size={isMobile ? "md" : "lg"} />
          </div>
          
          <form onSubmit={handleInitialSignup} className="space-y-4">
            <div>
              <div className="mb-1 text-gray-300 text-sm">Name</div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full py-2.5 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple" placeholder="Enter your name" required />
            </div>
            
            <div>
              <div className="mb-1 text-gray-300 text-sm">Email address</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full py-2.5 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple" placeholder="Enter your email" required />
            </div>
            
            <div>
              <div className="mb-1 text-gray-300 text-sm">Password</div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full py-2.5 px-4 bg-opacity-20 bg-black rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sheild-purple" placeholder="Create a password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <SheildButton type="submit" variant="primary" fullWidth disabled={loading} size={isMobile ? "md" : "lg"}>
                {loading ? 'Creating account...' : 'Sign up'}
              </SheildButton>
            </div>
          </form>
          
          <div className="mt-6 text-center text-gray-300 text-sm">
            Have an account? <Link to="/login" className="text-sheild-lightpurple hover:underline">Log in</Link>
          </div>
        </div>
      </div>

      {/* --- BIOMETRIC MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-sheild-darkblue border border-sheild-purple/40 rounded-2xl w-full max-w-sm p-6 relative flex flex-col items-center text-center shadow-2xl">
            
            <button 
              onClick={() => handleFailure("Verification cancelled by user.")}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-400 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mb-6 w-full flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-1">
                {uiLevel === 'gender' ? 'Level 1: Verification' : 'Level 2: Liveness Check'}
              </h3>
              
              {uiLevel === 'gestures' && (
                <div className="w-full bg-black/50 h-2 rounded-full mt-4 overflow-hidden border border-white/5">
                  <div 
                    className="bg-sheild-purple h-full transition-all duration-500 ease-out"
                    style={{ width: `${(uiCurrentIndex / uiGestureSequence.length) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className={`relative w-48 h-48 rounded-full overflow-hidden border-4 flex items-center justify-center bg-black mb-6 transition-colors duration-300 ${
              verificationStatus === 'success' ? 'border-green-500' : 
              verificationStatus === 'failed' ? 'border-red-500' : 'border-sheild-purple shadow-[0_0_15px_rgba(168,85,247,0.4)]'
            }`}>
              {!modelsLoaded ? (
                <Loader2 className="animate-spin text-sheild-purple" size={32} />
              ) : (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  mirrored={true}
                  onUserMedia={handleVideoLoad}
                  videoConstraints={{ facingMode: "user" }}
                  className="w-full h-full object-cover"
                />
              )}
              
              {verificationStatus === 'success' && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="text-green-400 drop-shadow-lg" size={64} />
                </div>
              )}

              {verificationStatus === 'failed' && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center backdrop-blur-sm">
                  <AlertTriangle className="text-red-400 drop-shadow-lg" size={64} />
                </div>
              )}
            </div>

            <div className={`rounded-xl p-4 w-full border flex flex-col items-center text-center ${
              verificationStatus === 'failed' ? 'bg-red-500/10 border-red-500/30' : 
              verificationStatus === 'success' ? 'bg-green-500/10 border-green-500/30' : 
              'bg-black/40 border-white/10'
            }`}>
              <p className={`font-semibold text-lg ${
                verificationStatus === 'failed' ? 'text-red-400' :
                verificationStatus === 'success' ? 'text-green-400' : 
                'text-sheild-lightpurple'
              }`}>
                {uiLevel === 'gestures' && verificationStatus === 'scanning' && uiCurrentIndex < uiGestureSequence.length
                  ? `Action ${uiCurrentIndex + 1}/4` 
                  : ''}
              </p>
              
              <p className="text-base text-white mt-1 min-h-[48px] flex items-center justify-center">
                {statusMessage}
              </p>

              {/* Skip Button */}
              {uiLevel === 'gestures' && verificationStatus === 'scanning' && uiCurrentIndex < uiGestureSequence.length && (
                <button 
                  onClick={handleSkipGesture}
                  className="mt-3 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                >
                  <RefreshCw size={14} /> Skip
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;