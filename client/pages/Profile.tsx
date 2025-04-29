import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, LogOut, Check, KeyRound, Trash2, Camera, X, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  _id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  emergencyContacts: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  }[];
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  verificationStatus: string;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VerificationStatus {
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  verificationStatus: string;
  idType: string | null;
  phone: string;
}

const Profile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password reset states
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);
  
  // Emergency contact states
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isAddContactLoading, setIsAddContactLoading] = useState(false);
  
  // Delete account states
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  
  // Profile picture states
  const [isProfilePictureOpen, setIsProfilePictureOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isProfilePictureLoading, setIsProfilePictureLoading] = useState(false);
  
  // Phone verification states
  const [isPhoneVerificationOpen, setIsPhoneVerificationOpen] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isPhoneVerificationLoading, setIsPhoneVerificationLoading] = useState(false);
  
  // ID verification states
  const [isIdVerificationOpen, setIsIdVerificationOpen] = useState(false);
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [isIdVerificationLoading, setIsIdVerificationLoading] = useState(false);
  
  // Verification status states
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isVerificationStatusOpen, setIsVerificationStatusOpen] = useState(false);
  const [isVerificationStatusLoading, setIsVerificationStatusLoading] = useState(false);
  
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/user/get-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setUserProfile(data);
      setName(data.name);
      setPhone(data.phone);
      setVerificationPhone(data.phone);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (otpTimer === 0 && otpSent) {
      // OTP expired
      toast.error('OTP has expired. Please request a new one.');
      setOtpSent(false);
    }
    
    return () => clearInterval(interval);
  }, [otpTimer, otpSent]);

  const handleLogout = async () => {
    try {
      // Call to your backend API
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
      });
      
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    
    try {
      // Call to your backend API
      const response = await fetch('http://localhost:8080/api/user/update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, phone }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      // Update the profile with the response data or fetch the updated profile
      await fetchUserProfile();
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setIsResetPasswordLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      toast.success('Password reset successfully');
      setIsResetPasswordOpen(false);
      // Reset form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  // Add Emergency Contact Handler
  const handleAddEmergencyContact = async () => {
    if (!contactName || !contactPhone || !contactRelation || !contactEmail) {
      toast.error('All fields are required');
      return;
    }
    
    setIsAddContactLoading(true);
    
    try {
      // Get current emergency contacts and add the new one
      const updatedContacts = [
        ...(userProfile?.emergencyContacts || []),
        {
          name: contactName,
          phone: contactPhone,
          relationship: contactRelation,
          email: contactEmail
        }
      ];
      
      const response = await fetch('http://localhost:8080/api/user/update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          emergencyContacts: updatedContacts
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add emergency contact');
      }
      
      // Update the profile with the response data or fetch the updated profile
      await fetchUserProfile();
      
      toast.success('Emergency contact added successfully');
      setIsAddContactOpen(false);
      // Reset form fields
      setContactName('');
      setContactPhone('');
      setContactRelation('');
      setContactEmail('');
    } catch (error) {
      console.error('Add emergency contact error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add emergency contact');
    } finally {
      setIsAddContactLoading(false);
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      toast.error('Please confirm account deletion');
      return;
    }
    
    setIsDeleteLoading(true);
    
    try {
      // Call to your backend API to delete user
      const response = await fetch('http://localhost:8080/api/user/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      
      // Now logout the user
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
      });
      
      localStorage.removeItem('token');
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Profile Picture Upload Handler
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (4MB limit)
      if (file.size > 4 * 1024 * 1024) {
        toast.error('File size must be less than 4MB');
        return;
      }
      
      setProfilePicture(file);
    }
  };
  
  const handleProfilePictureUpload = async () => {
    if (!profilePicture) {
      toast.error('Please select an image to upload');
      return;
    }
    
    setIsProfilePictureLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);
      
      // Using PATCH method as specified
      const response = await fetch('http://localhost:8080/api/user/update-profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload profile picture');
      }
      
      const data = await response.json();
      
      // Update the profile with the new image
      await fetchUserProfile();
      
      toast.success('Profile picture updated successfully');
      setIsProfilePictureOpen(false);
      setProfilePicture(null);
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setIsProfilePictureLoading(false);
    }
  };

  // Phone Verification Handlers - Updated for single dialog approach
  const handleSendOTP = async () => {
    if (!verificationPhone) {
      toast.error('Phone number is required');
      return;
    }
    
    setIsPhoneVerificationLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/user/verify/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          phone: verificationPhone
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      toast.success(`Verification code sent to ${verificationPhone}`);
      setOtpSent(true);
      // 10 minutes timer (600 seconds)
      setOtpTimer(600);
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsPhoneVerificationLoading(false);
    }
  };
  
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsPhoneVerificationLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/user/verify/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          phone: verificationPhone,
          otp
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }
      
      if (data.verified) {
        toast.success('Phone number verified successfully');
        setIsPhoneVerificationOpen(false);
        setOtpSent(false);
        setOtp('');
        
        // Update user profile data
        await fetchUserProfile();
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setIsPhoneVerificationLoading(false);
    }
  };

  // ID Document Upload Handler
  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setIdDocument(file);
    }
  };
  
  const handleIdDocumentUpload = async () => {
    if (!idType) {
      toast.error('Please select an ID type');
      return;
    }
    
    if (!idNumber) {
      toast.error('Please enter your ID number');
      return;
    }
    
    if (!idDocument) {
      toast.error('Please select a document to upload');
      return;
    }
    
    setIsIdVerificationLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('idDocument', idDocument);
      formData.append('idType', idType);
      formData.append('idNumber', idNumber);
      
      // Using POST method as specified
      const response = await fetch('http://localhost:8080/api/user/verify/id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload ID document');
      }
      
      toast.success('ID document uploaded successfully. Your verification is under review.');
      setIsIdVerificationOpen(false);
      setIdType('');
      setIdNumber('');
      setIdDocument(null);
      
      // Update user profile
      await fetchUserProfile();
    } catch (error) {
      console.error('ID document upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload ID document');
    } finally {
      setIsIdVerificationLoading(false);
    }
  };

  // Check Verification Status
  const handleCheckVerificationStatus = async () => {
    setIsVerificationStatusLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/user/verify/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get verification status');
      }
      
      setVerificationStatus(data);
      setIsVerificationStatusOpen(true);
    } catch (error) {
      console.error('Verification status error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get verification status');
    } finally {
      setIsVerificationStatusLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const resetStates = () => {
    setVerificationPhone('');
    setOtp('');
    setOtpSent(false);
    setIsPhoneVerificationLoading(false);
    setOtpTimer(0);
};

  const isVerified = userProfile?.isPhoneVerified && userProfile?.isIdVerified;

  if (isLoading && !userProfile) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-sheild-darkblue to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sheild-purple"></div>
      </div>
    );
  }

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
          {/* Logo would go here */}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4">
        <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>
        
        {/* Profile Card */}
        <div className="bg-sheild-darkblue/50 p-6 rounded-lg mb-6">
          <div className="flex items-center mb-6">
            <div className="relative">
              {userProfile?.profilePicture ? (
                <Avatar className="h-16 w-16 border-2 border-sheild-purple">
                  <AvatarImage src={userProfile.profilePicture} alt={userProfile.name} />
                  <AvatarFallback className="bg-sheild-purple text-white text-2xl font-bold">
                    {userProfile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="bg-sheild-purple w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {userProfile?.name.charAt(0) || 'U'}
                </div>
              )}
              <button 
                onClick={() => setIsProfilePictureOpen(true)}
                className="absolute bottom-0 right-0 bg-sheild-purple text-white p-1 rounded-full hover:bg-sheild-purple/80 transition-colors"
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="ml-4">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black bg-opacity-30 text-white text-xl font-bold mb-1 p-1 rounded"
                />
              ) : (
                <h2 className="text-xl font-bold text-white mb-1">{userProfile?.name}</h2>
              )}
              <div className="text-gray-300">{userProfile?.email}</div>
              {isVerified && (
                <div className="mt-1 flex items-center">
                  <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full flex items-center">
                    <Check size={12} className="mr-1" /> Verified Account
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Phone Number</div>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-black bg-opacity-30 text-white p-1 rounded w-full"
                />
              ) : (
                <div className="text-white">{userProfile?.phone}</div>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex space-x-3 pt-2">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-sheild-purple hover:bg-sheild-purple/80"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setName(userProfile?.name || '');
                    setPhone(userProfile?.phone || '');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-sheild-purple hover:bg-sheild-purple/80"
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsResetPasswordOpen(true)}
                  className="border-sheild-purple text-sheild-purple hover:bg-sheild-purple/10"
                >
                  <KeyRound size={16} className="mr-2" />
                  Reset Password
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Emergency Contacts */}
        <div className="bg-sheild-darkblue/50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Emergency Contacts</h3>
          
          {userProfile?.emergencyContacts && userProfile.emergencyContacts.length > 0 ? (
            userProfile.emergencyContacts.map((contact, index) => (
              <div key={index} className="mb-4 pb-4 border-b border-gray-700 last:border-0 last:mb-0 last:pb-0">
                <div className="flex justify-between">
                  <div>
                    <div className="text-white font-medium">{contact.name}</div>
                    <div className="text-gray-300 text-sm">{contact.phone}</div>
                    {contact.email && (<div className="text-gray-300 text-sm">{contact.email}</div>)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {contact.relationship}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-300 mb-4">No emergency contacts added yet.</div>
          )}
          
          <Button 
            onClick={() => setIsAddContactOpen(true)}
            className="w-full bg-sheild-purple hover:bg-sheild-purple/80 mt-4"
          >
            <div className="flex items-center justify-center">
              <Phone size={16} className="mr-2" />
              Add Emergency Contact
            </div>
          </Button>
        </div>
        
        {/* Verification Section */}
        <div className="bg-sheild-darkblue/50 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Verification</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckVerificationStatus}
              disabled={isVerificationStatusLoading}
              className="border-sheild-purple text-sheild-purple hover:bg-sheild-purple/10"
            >
              <RefreshCcw size={14} className="mr-1" />
              Check Status
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Phone Verification</div>
                <div className="text-gray-300 text-sm">Verify your phone number with OTP</div>
              </div>
              {userProfile?.isPhoneVerified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check size={12} className="mr-1" /> Verified
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsPhoneVerificationOpen(true);
                    setVerificationPhone(userProfile?.phone || '');
                  }}
                  className="bg-sheild-purple hover:bg-sheild-purple/80"
                >
                  Verify Phone
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">ID Verification</div>
                <div className="text-gray-300 text-sm">Submit government ID for verification</div>
              </div>
              {userProfile?.isIdVerified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check size={12} className="mr-1" /> Verified
                </span>
              ) : userProfile?.verificationStatus === 'in_review' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  In Review
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsIdVerificationOpen(true)}
                  className="bg-sheild-purple hover:bg-sheild-purple/80"
                >
                  Upload ID
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Account Actions */}
        <div className="space-y-3">
          {/* Logout */}
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="w-full border-sheild-purple text-sheild-purple hover:bg-sheild-purple/10"
          >
            <div className="flex items-center justify-center">
              <LogOut size={16} className="mr-2" />
              Logout
            </div>
          </Button>
          
          {/* Delete Account */}
          <Button 
            variant="destructive"
            onClick={() => setIsDeleteAccountOpen(true)}
            className="w-full"
          >
            <div className="flex items-center justify-center">
              <Trash2 size={16} className="mr-2" />
              Delete Account
            </div>
          </Button>
        </div>
      </div>
      
      {/* Profile Picture Upload Dialog */}
      <Dialog open={isProfilePictureOpen} onOpenChange={setIsProfilePictureOpen}>
        <DialogContent className="bg-sheild-darkblue text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Upload Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Select Image (Max 4MB)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            {profilePicture && (
              <div className="flex justify-center">
                <img
                  src={URL.createObjectURL(profilePicture)}
                  alt="Profile Preview"
                  className="h-24 w-24 rounded-full object-cover"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsProfilePictureOpen(false);
                setProfilePicture(null);
              }}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfilePictureUpload}
              disabled={!profilePicture || isProfilePictureLoading}
              className="bg-sheild-purple hover:bg-sheild-purple/80"
            >
              {isProfilePictureLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Phone Verification Dialog - Updated to a single dialog with both steps */}
      <Dialog open={isPhoneVerificationOpen} onOpenChange={(open) => {
                setIsPhoneVerificationOpen(open);
                if (!open) {
                   resetStates(); // Reset all states when dialog closes
                }
            }}>
                {/* sm:max-w-[425px] makes it constrained on small screens and up, flexible on smaller mobile */}
                <DialogContent className="bg-sheild-darkblue text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center sm:text-left"> {/* Centered title on mobile */}
                            Phone Verification
                        </DialogTitle>
                    </DialogHeader>
                    {/* Increased vertical spacing for better touch targets on mobile */}
                    <div className="space-y-6 py-4"> {/* Increased space-y */}
                        {/* Phone Number Input */}
                        <div className="space-y-2">
                            <label htmlFor="phoneInput" className="text-sm font-medium text-gray-300">Phone Number</label>
                            <Input
                                id="phoneInput"
                                type="tel"
                                value={verificationPhone}
                                onChange={(e) => setVerificationPhone(e.target.value)}
                                className="bg-black/30 border-gray-700 text-white focus-visible:ring-sheild-purple"
                                placeholder="+1 (555) 123-4567"
                                disabled={otpSent}
                            />
                        </div>

                        {/* Send/Resend OTP Button - Now Full Width */}
                        {/* Removed flex justify-end from wrapper div */}
                        <div>
                            <Button
                                onClick={handleSendOTP}
                                disabled={!verificationPhone || isPhoneVerificationLoading || (otpSent && otpTimer > 0)}
                                // Added w-full class here
                                className="bg-sheild-purple hover:bg-sheild-purple/80 disabled:opacity-50 w-full"
                            >
                                {isPhoneVerificationLoading && !otpSent ? 'Sending...' :
                                    otpSent && otpTimer > 0 ? `Resend in ${formatTime(otpTimer)}` :
                                    otpSent ? 'Resend OTP' : 'Send OTP'}
                            </Button>
                        </div>

                        {/* --- OTP Input and Verify Button Section --- */}
                        {otpSent && (
                            <>
                                {/* OTP Input Field */}
                                <div className="space-y-2"> {/* Reduced top padding here as space-y-6 handles it */}
                                    <label htmlFor="otpInput" className="text-sm font-medium text-gray-300">Verification Code</label>
                                    <Input
                                        id="otpInput"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="bg-black/30 border-gray-700 text-white focus-visible:ring-sheild-purple"
                                        placeholder="Enter OTP"
                                        maxLength={6}
                                    />
                                </div>

                                {/* Verify OTP Button - Now Full Width */}
                                {/* Removed flex justify-end from wrapper div */}
                                <div>
                                    <Button
                                        onClick={handleVerifyOTP}
                                        disabled={!otp || otp.length < 4 || isPhoneVerificationLoading } // Also disable if sending/verifying
                                        // Added w-full class here
                                        className="bg-sheild-purple hover:bg-sheild-purple/80 disabled:opacity-50 w-full"
                                    >
                                        {/* Optional: Add loading state for verification */}
                                        {/* {isVerificationLoading ? 'Verifying...' : 'Verify OTP'} */}
                                        Verify OTP
                                    </Button>
                                </div>
                            </>
                        )}
                        {/* --- End of Section --- */}

                    </div>
                </DialogContent>
            </Dialog>
      
      {/* ID Verification Dialog */}
      <Dialog open={isIdVerificationOpen} onOpenChange={setIsIdVerificationOpen}>
        <DialogContent className="bg-sheild-darkblue text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Upload ID Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">ID Type</label>
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                  <SelectValue placeholder="Select ID Type" />
                </SelectTrigger>
                <SelectContent className="bg-sheild-darkblue border-gray-700">
                  <SelectItem value="Aadhar Card">Aadhar Card</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">Driving License</SelectItem>
                  <SelectItem value="Pan Card">Pan Card</SelectItem>
                  <SelectItem value="Voter ID">Voter ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">ID Number</label>
              <Input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
                placeholder="Enter your ID number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Upload ID Document (Max 5MB)</label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleIdDocumentChange}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            {idDocument && (
              <div className="text-center text-green-300 text-sm">
                File selected: {idDocument.name}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsIdVerificationOpen(false);
                setIdType('');
                setIdNumber('');
                setIdDocument(null);
              }}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleIdDocumentUpload}
              disabled={!idType || !idNumber || !idDocument || isIdVerificationLoading}
              className="bg-sheild-purple hover:bg-sheild-purple/80"
            >
              {isIdVerificationLoading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Verification Status Dialog */}
      <Dialog open={isVerificationStatusOpen} onOpenChange={setIsVerificationStatusOpen}>
        <DialogContent className="bg-sheild-darkblue text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Verification Status</DialogTitle>
          </DialogHeader>
          {verificationStatus && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-white">2 Factor Verification</div>
                {verificationStatus.isPhoneVerified ? (
                  <div className="bg-green-500/20 text-green-300 text-sm px-3 py-1 rounded-full flex items-center">
                    <Check size={12} className="mr-1" /> Verified
                  </div>
                ) : (
                  <div className="bg-red-500/20 text-red-300 text-sm px-3 py-1 rounded-full flex items-center">
                    <X size={12} className="mr-1" /> Not Verified
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-white">Manual Identity Verification</div>
                {verificationStatus.isIdVerified ? (
                  <div className="bg-green-500/20 text-green-300 text-sm px-3 py-1 rounded-full flex items-center">
                    <Check size={12} className="mr-1" /> Verified
                  </div>
                ) : verificationStatus.verificationStatus === 'in_review' ? (
                  <div className="bg-yellow-500/20 text-yellow-300 text-sm px-3 py-1 rounded-full flex items-center">
                    <span className="mr-1">⌛</span> In Review
                  </div>
                ) : (
                  <div className="bg-red-500/20 text-red-300 text-sm px-3 py-1 rounded-full flex items-center">
                    <X size={16} className="mr-1" /> Not Verified
                  </div>
                )}
              </div>
              {verificationStatus.idType && (
                <div className="text-gray-300 text-sm">
                  ID Submitted: {verificationStatus.idType}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setIsVerificationStatusOpen(false)}
              className="bg-sheild-purple hover:bg-sheild-purple/80"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="bg-sheild-darkblue text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reset Your Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordOpen(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResetPasswordLoading}
              className="bg-sheild-purple hover:bg-sheild-purple/80"
            >
              {isResetPasswordLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Emergency Contact Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="bg-sheild-darkblue text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Name</label>
              <Input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Phone Number</label>
              <Input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Relationship</label>
              <Input
                type="text"
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
                placeholder="e.g. Family, Friend, Colleague"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Email</label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddContactOpen(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEmergencyContact}
              disabled={isAddContactLoading}
              className="bg-sheild-purple hover:bg-sheild-purple/80"
            >
              {isAddContactLoading ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Alert Dialog */}
      <AlertDialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <AlertDialogContent className="bg-sheild-darkblue text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Please tell us why you're leaving (optional)</label>
              <Input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="delete-confirm" 
                checked={deleteConfirmed}
                onCheckedChange={(checked) => setDeleteConfirmed(checked as boolean)}
                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <label
                htmlFor="delete-confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
              >
                I am hereby deleting my SHEild account
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleteLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleteLoading ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
