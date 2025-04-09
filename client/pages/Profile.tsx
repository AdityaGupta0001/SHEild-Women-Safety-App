
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import SheildButton from '@/components/SheildButton';
import { ArrowLeft, User, Shield, Phone, Bell, LogOut, Check, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  emergencyContacts: {
    name: string;
    phone: string;
    relationship: string;
  }[];
}

const Profile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading profile data
    setTimeout(() => {
      // This would fetch from your API in a real app
      const mockProfile: UserProfile = {
        name: "Emily Johnson",
        email: "emily.j@example.com",
        phone: "+1 (555) 123-4567",
        isVerified: true,
        emergencyContacts: [
          {
            name: "Mom",
            phone: "+1 (555) 987-6543",
            relationship: "Family"
          },
          {
            name: "Sarah (Roommate)",
            phone: "+1 (555) 234-5678",
            relationship: "Friend"
          }
        ]
      };
      
      setUserProfile(mockProfile);
      setName(mockProfile.name);
      setPhone(mockProfile.phone);
      setIsLoading(false);
    }, 1000);
  }, []);

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
      
      setUserProfile({
        ...userProfile,
        name,
        phone
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = () => {
    navigate('/verification');
    toast.info('Verification feature is under development');
  };

  const handleAddEmergencyContact = () => {
    // This would navigate to an add contact page
    toast.info('Add emergency contact feature coming soon');
  };

  const handleUploadDocument = () => {
    // This would handle document upload for verification
    toast.info('Document upload feature coming soon');
  };

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
          <Logo size="sm" showText={false} />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4">
        <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>
        
        {/* Profile Card */}
        <div className="bg-sheild-darkblue/50 p-6 rounded-lg mb-6">
          <div className="flex items-center mb-6">
            <div className="bg-sheild-purple w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
              {userProfile?.name.charAt(0) || 'U'}
            </div>
            <div>
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
              {userProfile?.isVerified && (
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
                <SheildButton 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </SheildButton>
                <SheildButton 
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setName(userProfile?.name || '');
                    setPhone(userProfile?.phone || '');
                  }}
                >
                  Cancel
                </SheildButton>
              </div>
            ) : (
              <SheildButton 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </SheildButton>
            )}
          </div>
        </div>
        
        {/* Emergency Contacts */}
        <div className="bg-sheild-darkblue/50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Emergency Contacts</h3>
          
          {userProfile?.emergencyContacts.map((contact, index) => (
            <div key={index} className="mb-4 pb-4 border-b border-gray-700 last:border-0 last:mb-0 last:pb-0">
              <div className="flex justify-between">
                <div>
                  <div className="text-white font-medium">{contact.name}</div>
                  <div className="text-gray-300 text-sm">{contact.phone}</div>
                </div>
                <div className="text-gray-400 text-sm">
                  {contact.relationship}
                </div>
              </div>
            </div>
          ))}
          
          <SheildButton 
            onClick={handleAddEmergencyContact}
            fullWidth
            className="mt-4"
          >
            <div className="flex items-center justify-center">
              <Phone size={16} className="mr-2" />
              Add Emergency Contact
            </div>
          </SheildButton>
        </div>
        
        {/* Verification */}
        {!userProfile?.isVerified && (
          <div className="bg-sheild-darkblue/50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-white mb-2">Account Verification</h3>
            <p className="text-gray-300 mb-4">
              Verify your account to access all features and connect with verified travel partners.
            </p>
            
            <div className="space-y-3">
              <SheildButton 
                onClick={handleVerification}
                fullWidth
              >
                <div className="flex items-center justify-center">
                  <Shield size={16} className="mr-2" />
                  Start Verification
                </div>
              </SheildButton>
              
              <SheildButton 
                variant="secondary"
                onClick={handleUploadDocument}
                fullWidth
              >
                <div className="flex items-center justify-center">
                  <Upload size={16} className="mr-2" />
                  Upload ID Document
                </div>
              </SheildButton>
            </div>
          </div>
        )}
        
        {/* Logout */}
        <SheildButton 
          variant="secondary"
          onClick={handleLogout}
          fullWidth
        >
          <div className="flex items-center justify-center">
            <LogOut size={16} className="mr-2" />
            Logout
          </div>
        </SheildButton>
      </div>
    </div>
  );
};

export default Profile;
