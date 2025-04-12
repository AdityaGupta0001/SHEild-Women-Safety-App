import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Phone, Bell, LogOut, Check, Upload, KeyRound, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// import { deleteFirebaseUser } from '@/services/authService';

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
  }[];
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  verificationStatus: string;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
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
  const [isAddContactLoading, setIsAddContactLoading] = useState(false);
  
  // Delete account states
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  
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

  const handleVerification = () => {
    navigate('/verification');
    toast.info('Verification feature is under development');
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
    if (!contactName || !contactPhone || !contactRelation) {
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
          relationship: contactRelation
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

  const handleUploadDocument = () => {
    // This would handle document upload for verification
    toast.info('Document upload feature coming soon');
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
        
        {/* Verification */}
        {!isVerified && (
          <div className="bg-sheild-darkblue/50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-white mb-2">Account Verification</h3>
            <p className="text-gray-300 mb-4">
              Verify your account to access all features and connect with verified travel partners.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleVerification}
                className="w-full bg-sheild-purple hover:bg-sheild-purple/80"
              >
                <div className="flex items-center justify-center">
                  <Shield size={16} className="mr-2" />
                  Start Verification
                </div>
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleUploadDocument}
                className="w-full border-sheild-purple text-sheild-purple hover:bg-sheild-purple/10"
              >
                <div className="flex items-center justify-center">
                  <Upload size={16} className="mr-2" />
                  Upload ID Document
                </div>
              </Button>
            </div>
          </div>
        )}
        
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
