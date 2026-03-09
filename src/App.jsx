import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc,
  updateDoc, 
  serverTimestamp,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { 
  Plus, 
  Wrench, 
  Droplets, 
  Zap, 
  Thermometer, 
  Hammer, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Home, 
  List, 
  User,
  X,
  Inbox,
  ShieldCheck,
  MapPin,
  ClipboardList,
  Phone,
  UserCircle,
  Calendar,
  MessageSquare,
  Building2,
  AlertTriangle,
  Settings,
  RefreshCw,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Image,
  Send,
  LogOut,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyARi-6Na2z8hDm_8rMjDqBaXN_2xu8ecVk",
  authDomain: "homerepair-request.firebaseapp.com",
  projectId: "homerepair-request",
  storageBucket: "homerepair-request.firebasestorage.app",
  messagingSenderId: "357305821114",
  appId: "1:357305821114:web:722516bb55b4d269bbdf83",
  measurementId: "G-CC3TBDK93Q"
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let firebaseInitError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  firebaseInitError = `Firebase initialization error: ${error.message}`;
  console.error(firebaseInitError);
}

const appId = 'home-repair-app';

// Company Info
const COMPANY = {
  name: 'First Call Maintenance',
  tagline: 'Home Repair',
  phone1: '765-246-4405',
  phone2: '765-770-6076',
  email: 'zak@firstcallmaintenance.biz',
  logo: '/logo.png'
};

// Admin Code - Change this to your preferred code
const ADMIN_CODE = 'fcm2024';

// --- Constants & Helpers ---
const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'hvac', label: 'HVAC', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'structural', label: 'Structural', icon: Hammer, color: 'text-stone-500', bg: 'bg-stone-50' },
  { id: 'general', label: 'General', icon: Wrench, color: 'text-purple-500', bg: 'bg-purple-50' },
];

const STATUS_MAP = {
  pending: { label: 'Pending Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  scheduled: { label: 'Scheduled', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const Badge = ({ children, className }) => (
  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${className}`}>
    {children}
  </span>
);

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
          <div className="bg-white rounded-3xl p-10 max-w-md text-center shadow-xl border border-slate-100">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-purple-600 text-white px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg"
            >
              <RefreshCw size={18} />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// LANDING PAGE
// ============================================
const LandingPage = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <img src={COMPANY.logo} alt={COMPANY.name} className="h-16 object-contain" />
        <a 
          href={`tel:${COMPANY.phone1.replace(/-/g, '')}`}
          className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
        >
          <Phone size={16} />
          Call Now
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <div className="px-6 py-12 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight">
            Home Repairs<br/>
            <span className="text-purple-600">Made Simple</span>
          </h1>
          <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-sm">
            Submit repair requests online, track progress, and communicate directly with our team.
          </p>
          
          <button 
            onClick={onGetStarted}
            className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95 w-full max-w-sm"
          >
            Submit a Request
            <ArrowRight size={22} />
          </button>
          
          <p className="text-slate-500 mt-4 text-center max-w-sm">
            Already have an account?{' '}
            <button 
              onClick={onLogin}
              className="text-purple-600 font-bold hover:underline"
            >
              Log in here
            </button>
          </p>
        </div>

        {/* Services Preview */}
        <div className="px-6 py-8 bg-slate-50 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Our Services</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id}
                className={`${cat.bg} px-4 py-3 rounded-2xl flex items-center gap-2 shrink-0`}
              >
                <cat.icon size={18} className={cat.color} />
                <span className="font-bold text-slate-700 text-sm">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-6 py-8 bg-purple-600 text-white">
          <h2 className="font-bold text-lg mb-4">Contact Us</h2>
          <div className="space-y-3">
            <a href={`tel:${COMPANY.phone1.replace(/-/g, '')}`} className="flex items-center gap-3 text-purple-100 hover:text-white">
              <Phone size={18} />
              <span className="font-medium">{COMPANY.phone1}</span>
            </a>
            <a href={`tel:${COMPANY.phone2.replace(/-/g, '')}`} className="flex items-center gap-3 text-purple-100 hover:text-white">
              <Phone size={18} />
              <span className="font-medium">{COMPANY.phone2}</span>
            </a>
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 text-purple-100 hover:text-white">
              <Mail size={18} />
              <span className="font-medium">{COMPANY.email}</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================
// AUTH PAGES
// ============================================
const AuthPage = ({ onBack, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-4 border-b border-slate-100">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <img src={COMPANY.logo} alt={COMPANY.name} className="h-10 object-contain" />
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-slate-500 mb-8">
          {mode === 'login' 
            ? 'Sign in to manage your repair requests' 
            : 'Sign up to submit and track repairs'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div>
            <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="pt-6 text-center">
          <p className="text-slate-500">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="text-purple-600 font-bold ml-2"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

// ============================================
// PROFILE SETUP
// ============================================
const ProfileSetup = ({ user, onComplete, initialData }) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(profileRef, {
        fullName,
        phone,
        addresses: [{ id: Date.now().toString(), label: 'Primary', address }],
        selectedAddressId: Date.now().toString(),
        email: user.email,
        updatedAt: serverTimestamp()
      });
      onComplete();
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-4 border-b border-slate-100">
        <img src={COMPANY.logo} alt={COMPANY.name} className="h-10 object-contain" />
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="text-center mb-8">
          <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle size={40} className="text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
          <p className="text-slate-500">We need this info to process your repair requests</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Property Address</label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base resize-none"
              placeholder="123 Main St, City, State ZIP"
            />
            <p className="text-xs text-slate-400 mt-1.5 ml-1">You can add more addresses later from your profile.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </main>
    </div>
  );
};

// ============================================
// PHOTO UPLOAD COMPONENT
// ============================================
const PhotoUploader = ({ photos, setPhotos, maxPhotos = 5 }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false
    }));

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    const updated = [...photos];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    setPhotos(updated);
  };

  return (
    <div>
      <label className="text-sm font-bold text-slate-700 ml-1 block mb-2">
        Photos (Optional - up to {maxPhotos})
      </label>
      
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100">
            <img src={photo.preview} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
          >
            <Camera size={24} />
            <span className="text-[10px] font-bold mt-1">Add</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

// ============================================
// CUSTOMER APP
// ============================================
const CustomerApp = ({ user, userProfile, requests, onLogout }) => {
  const [view, setView] = useState('home');
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  
  // Get addresses array (support legacy single address and new multiple addresses)
  const addresses = useMemo(() => {
    if (userProfile?.addresses && Array.isArray(userProfile.addresses)) {
      return userProfile.addresses;
    }
    // Legacy support: convert single address to array
    if (userProfile?.address) {
      return [{ id: 'legacy', label: 'Primary', address: userProfile.address }];
    }
    return [];
  }, [userProfile]);
  
  // Track selected address - default to first address or profile's selected
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Update selectedAddressId when addresses change
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(userProfile?.selectedAddressId || addresses[0]?.id || '');
    }
  }, [addresses, userProfile?.selectedAddressId, selectedAddressId]);
  
  const selectedAddress = useMemo(() => {
    return addresses.find(a => a.id === selectedAddressId) || addresses[0] || null;
  }, [addresses, selectedAddressId]);
  
  const [formData, setFormData] = useState({
    category: 'general',
    description: '',
    preferredTime: '',
    photos: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: userProfile?.fullName || '',
    phone: userProfile?.phone || ''
  });

  // Messages listener for selected request
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!selectedRequest) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(
      db, 
      'artifacts', appId, 'public', 'data', 'repairRequests', selectedRequest.id, 'messages'
    );
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [selectedRequest]);

  const uploadPhotos = async (photos) => {
    const urls = [];
    for (const photo of photos) {
      if (photo.file) {
        const fileName = `${user.uid}/${Date.now()}_${photo.file.name}`;
        const storageRef = ref(storage, `repair-photos/${fileName}`);
        await uploadBytes(storageRef, photo.file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      }
    }
    return urls;
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload photos first
      let photoUrls = [];
      if (formData.photos.length > 0) {
        photoUrls = await uploadPhotos(formData.photos);
      }

      const requestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'repairRequests');
      await addDoc(requestsRef, {
        category: formData.category,
        description: formData.description,
        preferredTime: formData.preferredTime,
        photos: photoUrls,
        address: selectedAddress?.address || userProfile?.address || '',
        addressLabel: selectedAddress?.label || 'Primary',
        userId: user.uid,
        userName: userProfile.fullName,
        userPhone: userProfile.phone,
        userEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Reset form
      setFormData({
        category: 'general',
        description: '',
        preferredTime: '',
        photos: []
      });
      setView('list');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRequest) return;

    try {
      const messagesRef = collection(
        db,
        'artifacts', appId, 'public', 'data', 'repairRequests', selectedRequest.id, 'messages'
      );
      await addDoc(messagesRef, {
        text: messageText,
        senderId: user.uid,
        senderName: userProfile.fullName,
        isAdmin: false,
        createdAt: serverTimestamp()
      });
      setMessageText('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(profileRef, {
        ...profileForm,
        addresses: userProfile?.addresses || addresses,
        selectedAddressId: userProfile?.selectedAddressId || selectedAddressId,
        email: user.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setEditingProfile(false);
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save profile.');
    }
  };

  const handleAddAddress = async () => {
    if (!newAddressText.trim()) return;
    
    const newAddress = {
      id: Date.now().toString(),
      label: newAddressLabel.trim() || `Address ${addresses.length + 1}`,
      address: newAddressText.trim()
    };
    
    const updatedAddresses = [...addresses, newAddress];
    
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(profileRef, {
        addresses: updatedAddresses,
        selectedAddressId: newAddress.id,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setSelectedAddressId(newAddress.id);
      setShowAddAddress(false);
      setNewAddressLabel('');
      setNewAddressText('');
    } catch (error) {
      console.error('Add address error:', error);
      alert('Failed to add address.');
    }
  };

  const pendingActions = requests.filter(r => r.status === 'scheduled').length;

  // Request Detail View with Messages
  if (selectedRequest) {
    const status = STATUS_MAP[selectedRequest.status];
    const category = CATEGORIES.find(c => c.id === selectedRequest.category);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white px-4 py-4 flex items-center gap-4 border-b border-slate-100 sticky top-0 z-10">
          <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-full">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-slate-900 capitalize">{selectedRequest.category} Repair</h1>
            <p className="text-xs text-slate-500">Request #{selectedRequest.id.slice(-6)}</p>
          </div>
          <Badge className={`${status?.bg} ${status?.color}`}>{status?.label}</Badge>
        </header>

        <main className="flex-1 flex flex-col">
          {/* Request Details */}
          <div className="bg-white p-4 border-b border-slate-100">
            <p className="text-slate-700 mb-3">{selectedRequest.description}</p>
            
            {selectedRequest.photos?.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {selectedRequest.photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={14} />
              <span>{selectedRequest.address}</span>
            </div>

            {selectedRequest.scheduledTime && (
              <div className="mt-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
                <p className="text-xs font-bold text-purple-600 uppercase mb-1">Scheduled For</p>
                <p className="font-bold text-purple-900">{selectedRequest.scheduledTime}</p>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.isAdmin 
                      ? 'bg-white border border-slate-200 mr-auto'
                      : 'bg-purple-600 text-white ml-auto'
                  }`}
                >
                  {msg.isAdmin && (
                    <p className="text-[10px] font-bold text-purple-600 mb-1">{COMPANY.name}</p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white p-4 border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="bg-purple-600 text-white p-3 rounded-xl disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
        <img src={COMPANY.logo} alt={COMPANY.name} className="h-10 object-contain" />
        <div className="flex items-center gap-2">
          {pendingActions > 0 && (
            <div className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold">
              {pendingActions} Action{pendingActions > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {view === 'home' && (
          <div className="p-6 space-y-6">
            {/* Welcome Card */}
            <div className="bg-purple-600 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-purple-200 text-sm mb-1">Welcome back,</p>
                <h1 className="text-2xl font-bold mb-4">{userProfile?.fullName?.split(' ')[0] || 'Customer'}</h1>
                <button
                  onClick={() => setView('new-request')}
                  className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
                >
                  <Plus size={20} strokeWidth={3} />
                  New Request
                </button>
              </div>
              <Wrench size={120} className="absolute -bottom-6 -right-6 text-white opacity-10" />
            </div>

            {/* Quick Categories */}
            <div>
              <h2 className="font-bold text-slate-800 mb-4">Quick Request</h2>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.slice(0, 3).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFormData({...formData, category: cat.id});
                      setView('new-request');
                    }}
                    className={`${cat.bg} p-4 rounded-2xl flex flex-col items-center gap-2`}
                  >
                    <cat.icon size={24} className={cat.color} />
                    <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Requests */}
            {requests.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-slate-800">Recent Requests</h2>
                  <button onClick={() => setView('list')} className="text-purple-600 text-sm font-bold">
                    See All
                  </button>
                </div>
                <div className="space-y-3">
                  {requests.slice(0, 3).map(req => {
                    const status = STATUS_MAP[req.status];
                    const cat = CATEGORIES.find(c => c.id === req.category);
                    return (
                      <button
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 border border-slate-100 text-left"
                      >
                        <div className={`p-3 rounded-xl ${cat?.bg || 'bg-slate-50'}`}>
                          {cat ? <cat.icon size={20} className={cat.color} /> : <Wrench size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 capitalize truncate">{req.category} Repair</p>
                          <p className={`text-xs font-bold ${status?.color}`}>{status?.label}</p>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'new-request' && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setView('home')} className="p-2 hover:bg-slate-200 rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">New Request</h1>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Category */}
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1 block mb-2">What needs fixing?</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({...formData, category: cat.id})}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        formData.category === cat.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-slate-100 bg-white'
                      }`}
                    >
                      <cat.icon size={20} className={formData.category === cat.id ? 'text-purple-600' : cat.color} />
                      <span className={`text-[10px] font-bold uppercase ${formData.category === cat.id ? 'text-purple-600' : 'text-slate-600'}`}>
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Describe the issue</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base resize-none"
                  placeholder="Tell us what's wrong..."
                />
              </div>

              {/* Photo Upload */}
              <PhotoUploader
                photos={formData.photos}
                setPhotos={(photos) => setFormData({...formData, photos})}
                maxPhotos={5}
              />

              {/* Preferred Time */}
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Preferred time for repair</label>
                <input
                  type="text"
                  required
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base"
                  placeholder="e.g., Weekday mornings, Next Monday PM"
                />
              </div>

              {/* Address Selection */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={14} />
                    <span className="font-bold">Service Address</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(true)}
                    className="text-purple-600 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add New
                  </button>
                </div>
                
                {addresses.length > 1 ? (
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label}: {addr.address.substring(0, 40)}{addr.address.length > 40 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-700">{selectedAddress?.address || userProfile?.address}</p>
                )}
              </div>
              
              {/* Add Address Modal */}
              {showAddAddress && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-slate-900">Add New Address</h2>
                      <button 
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="p-2 hover:bg-slate-100 rounded-full"
                      >
                        <X size={20} className="text-slate-500" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Address Label</label>
                        <input
                          type="text"
                          value={newAddressLabel}
                          onChange={(e) => setNewAddressLabel(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 text-base"
                          placeholder="e.g., Rental Unit 1, Downtown Office"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Full Address</label>
                        <textarea
                          value={newAddressText}
                          onChange={(e) => setNewAddressText(e.target.value)}
                          rows={3}
                          className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 text-base resize-none"
                          placeholder="123 Main St, City, State ZIP"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAddress}
                          disabled={!newAddressText.trim()}
                          className="flex-1 py-3 rounded-xl bg-purple-600 font-bold text-white disabled:opacity-50"
                        >
                          Add Address
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {view === 'list' && (
          <div className="p-6">
            <h1 className="text-xl font-bold text-slate-900 mb-6">My Requests</h1>
            
            {requests.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No requests yet</p>
                <button
                  onClick={() => setView('new-request')}
                  className="mt-4 text-purple-600 font-bold"
                >
                  Submit your first request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => {
                  const status = STATUS_MAP[req.status];
                  const cat = CATEGORIES.find(c => c.id === req.category);
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full bg-white p-4 rounded-2xl flex items-center gap-4 border text-left ${
                        req.status === 'completed' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${cat?.bg || 'bg-slate-50'}`}>
                        {cat ? <cat.icon size={20} className={cat.color} /> : <Wrench size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 capitalize truncate">{req.category} Repair</p>
                        <p className={`text-xs font-bold ${status?.color}`}>{status?.label}</p>
                      </div>
                      {req.status === 'completed' && (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      )}
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'profile' && (
          <div className="p-6">
            <h1 className="text-xl font-bold text-slate-900 mb-6">My Profile</h1>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-bold text-slate-800">Contact Information</h2>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="text-purple-600 text-sm font-bold"
                >
                  {editingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                    placeholder="Full Name"
                  />
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                    placeholder="Phone"
                  />
                  <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <UserCircle size={18} className="text-purple-500" />
                    <span className="text-slate-700">{userProfile?.fullName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-purple-500" />
                    <span className="text-slate-700">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-purple-500" />
                    <span className="text-slate-700">{userProfile?.phone}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Addresses Section */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-bold text-slate-800">My Addresses</h2>
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="text-purple-600 text-sm font-bold flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
              
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div 
                    key={addr.id} 
                    className={`p-3 rounded-xl border ${
                      selectedAddressId === addr.id 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{addr.label}</p>
                        <p className="text-slate-600 text-sm">{addr.address}</p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {selectedAddressId !== addr.id && (
                      <button
                        onClick={async () => {
                          setSelectedAddressId(addr.id);
                          const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
                          await setDoc(profileRef, { selectedAddressId: addr.id }, { merge: true });
                        }}
                        className="text-purple-600 text-xs font-bold mt-2"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                ))}
                
                {addresses.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No addresses yet</p>
                )}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      {!['new-request'].includes(view) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-around items-center z-50">
          <button
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-purple-600' : 'text-slate-400'}`}
          >
            <Home size={22} />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button
            onClick={() => setView('new-request')}
            className="bg-purple-600 text-white p-4 rounded-xl -translate-y-4 shadow-lg shadow-purple-200"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex flex-col items-center gap-1 ${view === 'list' ? 'text-purple-600' : 'text-slate-400'}`}
          >
            <List size={22} />
            <span className="text-[10px] font-bold">Requests</span>
          </button>
          <button
            onClick={() => setView('profile')}
            className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-purple-600' : 'text-slate-400'}`}
          >
            <User size={22} />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};

// ============================================
// ADMIN DASHBOARD
// ============================================
const AdminDashboard = ({ onExit }) => {
  const [allRequests, setAllRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [view, setView] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Load all requests
  useEffect(() => {
    const requestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'repairRequests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  // Messages listener
  useEffect(() => {
    if (!selectedRequest) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(
      db,
      'artifacts', appId, 'public', 'data', 'repairRequests', selectedRequest.id, 'messages'
    );
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [selectedRequest]);

  const handleUpdateStatus = async (requestId, status, extraData = {}) => {
    try {
      const requestRef = doc(db, 'artifacts', appId, 'public', 'data', 'repairRequests', requestId);
      await updateDoc(requestRef, { status, ...extraData });
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleTime.trim() || !selectedRequest) return;
    await handleUpdateStatus(selectedRequest.id, 'scheduled', { scheduledTime: scheduleTime });
    
    // Send automatic message
    const messagesRef = collection(
      db,
      'artifacts', appId, 'public', 'data', 'repairRequests', selectedRequest.id, 'messages'
    );
    await addDoc(messagesRef, {
      text: `Your repair has been scheduled for: ${scheduleTime}`,
      senderId: 'admin',
      senderName: COMPANY.name,
      isAdmin: true,
      createdAt: serverTimestamp()
    });

    setScheduleTime('');
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRequest) return;

    try {
      const messagesRef = collection(
        db,
        'artifacts', appId, 'public', 'data', 'repairRequests', selectedRequest.id, 'messages'
      );
      await addDoc(messagesRef, {
        text: messageText,
        senderId: 'admin',
        senderName: COMPANY.name,
        isAdmin: true,
        createdAt: serverTimestamp()
      });
      setMessageText('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const pendingCount = allRequests.filter(r => r.status === 'pending').length;
  const scheduledCount = allRequests.filter(r => r.status === 'scheduled').length;
  const inProgressCount = allRequests.filter(r => r.status === 'in_progress').length;

  // Request Detail View
  if (selectedRequest) {
    const status = STATUS_MAP[selectedRequest.status];
    const category = CATEGORIES.find(c => c.id === selectedRequest.category);

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col text-white">
        <header className="px-4 py-4 flex items-center gap-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-800 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold capitalize">{selectedRequest.category} Repair</h1>
            <p className="text-xs text-slate-400">#{selectedRequest.id.slice(-6)}</p>
          </div>
          <Badge className={`${status?.bg} ${status?.color}`}>{status?.label}</Badge>
        </header>

        <main className="flex-1 flex flex-col">
          {/* Customer Info */}
          <div className="p-4 border-b border-slate-800">
            <div className="bg-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <UserCircle size={16} className="text-purple-400" />
                <span className="font-medium">{selectedRequest.userName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-purple-400" />
                <a href={`tel:${selectedRequest.userPhone}`} className="text-purple-300">{selectedRequest.userPhone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-purple-400" />
                <span className="text-slate-300 text-sm">{selectedRequest.userEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-purple-400 mt-0.5" />
                <span className="text-slate-300 text-sm">{selectedRequest.address}</span>
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className="p-4 border-b border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Issue Description</p>
            <p className="text-slate-200">{selectedRequest.description}</p>
            
            {selectedRequest.photos?.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {selectedRequest.photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
                ))}
              </div>
            )}

            <p className="text-sm text-slate-400 mt-4 mb-1">Customer Preferred Time</p>
            <p className="text-slate-200">{selectedRequest.preferredTime}</p>
          </div>

          {/* Status Actions */}
          <div className="p-4 border-b border-slate-800">
            {selectedRequest.status === 'pending' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-400 mb-2">Schedule Repair</p>
                <input
                  type="text"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  placeholder="e.g., Monday March 10 at 9 AM"
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none"
                />
                <button
                  onClick={handleSchedule}
                  disabled={!scheduleTime.trim()}
                  className="w-full bg-purple-600 py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  Schedule & Notify Customer
                </button>
              </div>
            )}

            {selectedRequest.status === 'scheduled' && (
              <div className="space-y-3">
                <div className="bg-purple-900/30 p-3 rounded-xl border border-purple-800">
                  <p className="text-xs text-purple-400 mb-1">Scheduled For</p>
                  <p className="font-bold text-purple-300">{selectedRequest.scheduledTime}</p>
                </div>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress')}
                  className="w-full bg-blue-600 py-3 rounded-xl font-bold"
                >
                  Start Job
                </button>
              </div>
            )}

            {selectedRequest.status === 'in_progress' && (
              <button
                onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                className="w-full bg-emerald-600 py-3 rounded-xl font-bold"
              >
                Mark as Completed
              </button>
            )}

            {selectedRequest.status === 'completed' && (
              <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-800 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                <p className="font-bold text-emerald-300">Job Completed</p>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <p className="text-sm text-slate-400 mb-2">Conversation</p>
            {messages.length === 0 ? (
              <p className="text-slate-500 text-sm">No messages yet</p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.isAdmin
                      ? 'bg-purple-600 ml-auto'
                      : 'bg-slate-800 mr-auto'
                  }`}
                >
                  {!msg.isAdmin && (
                    <p className="text-[10px] font-bold text-slate-400 mb-1">{msg.senderName}</p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="bg-purple-600 p-3 rounded-xl disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase">Admin Dashboard</p>
          <h1 className="text-lg font-bold">{COMPANY.name}</h1>
        </div>
        <button
          onClick={onExit}
          className="bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold"
        >
          Exit Admin
        </button>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto">
        <div className="bg-amber-900/30 border border-amber-800 rounded-xl px-4 py-3 shrink-0">
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="text-xs text-amber-300">Pending</p>
        </div>
        <div className="bg-purple-900/30 border border-purple-800 rounded-xl px-4 py-3 shrink-0">
          <p className="text-2xl font-bold text-purple-400">{scheduledCount}</p>
          <p className="text-xs text-purple-300">Scheduled</p>
        </div>
        <div className="bg-blue-900/30 border border-blue-800 rounded-xl px-4 py-3 shrink-0">
          <p className="text-2xl font-bold text-blue-400">{inProgressCount}</p>
          <p className="text-xs text-blue-300">In Progress</p>
        </div>
      </div>

      {/* Request List */}
      <main className="flex-1 px-6 py-4">
        <h2 className="font-bold text-slate-400 uppercase text-xs mb-4">All Requests</h2>
        
        {allRequests.length === 0 ? (
          <div className="text-center py-16">
            <Inbox size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allRequests.map(req => {
              const status = STATUS_MAP[req.status];
              const cat = CATEGORIES.find(c => c.id === req.category);
              return (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`w-full bg-slate-800 p-4 rounded-xl flex items-center gap-4 text-left border ${status?.border || 'border-slate-700'}`}
                >
                  <div className={`p-3 rounded-lg ${cat?.bg || 'bg-slate-700'}`}>
                    {cat ? <cat.icon size={20} className={cat.color} /> : <Wrench size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white capitalize truncate">{req.category} Repair</p>
                    <p className="text-sm text-slate-400 truncate">{req.userName}</p>
                    <p className={`text-xs font-bold ${status?.color}`}>{status?.label}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-600" />
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================
function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState('landing'); // 'landing', 'auth', 'profile-setup', 'app', 'admin'
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState(false);

  // Auth listener
  useEffect(() => {
    if (firebaseInitError || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setAppState('app'); // Will check profile in next effect
      } else {
        setAppState('landing');
        setUserProfile(null);
        setRequests([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Profile listener
  useEffect(() => {
    if (!user || !db) return;

    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (appState === 'app' || appState === 'profile-setup') {
          setAppState('app');
        }
      } else {
        setUserProfile(null);
        if (appState === 'app') {
          setAppState('profile-setup');
        }
      }
    });

    // User's requests listener - filter client-side to avoid needing composite index
    const requestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'repairRequests');
    const unsubscribeRequests = onSnapshot(requestsRef, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userDocs = allDocs
        .filter(doc => doc.userId === user.uid)
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      setRequests(userDocs);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeRequests();
    };
  }, [user, appState]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAdminAccess = () => {
    if (adminCode === ADMIN_CODE) {
      setAppState('admin');
      setShowAdminPrompt(false);
      setAdminCode('');
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <img src={COMPANY.logo} alt={COMPANY.name} className="h-16 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (firebaseInitError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">Configuration Error</h1>
          <p className="text-slate-500 text-sm">{firebaseInitError}</p>
        </div>
      </div>
    );
  }

  // Admin prompt modal rendered inline (not as component to avoid re-mount on state change)
  const adminPromptModal = showAdminPrompt ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <form 
        className="bg-white rounded-2xl p-6 w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdminAccess();
        }}
      >
        <h2 className="text-lg font-bold text-slate-900 mb-4">Admin Access</h2>
        {adminError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl mb-4 text-sm">
            Invalid admin code
          </div>
        )}
        <input
          type="password"
          value={adminCode}
          onChange={(e) => {
            setAdminCode(e.target.value);
            setAdminError(false);
          }}
          placeholder="Enter admin code"
          className={`w-full p-4 rounded-xl border outline-none mb-4 text-base ${
            adminError ? 'border-red-300 bg-red-50' : 'border-slate-200'
          }`}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowAdminPrompt(false);
              setAdminCode('');
              setAdminError(false);
            }}
            className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl bg-purple-600 font-bold text-white"
          >
            Enter
          </button>
        </div>
      </form>
    </div>
  ) : null;

  return (
    <>
{appState === 'landing' && (
        <LandingPage
          onGetStarted={() => setAppState('auth')}
          onLogin={() => setAppState('auth')}
        />
      )}

      {appState === 'auth' && (
        <AuthPage 
          onBack={() => setAppState('landing')}
          onAuthSuccess={() => {}} // Auth state listener handles this
        />
      )}

      {appState === 'profile-setup' && user && (
        <ProfileSetup
          user={user}
          initialData={userProfile}
          onComplete={() => setAppState('app')}
        />
      )}

      {appState === 'app' && user && userProfile && (
        <CustomerApp
          user={user}
          userProfile={userProfile}
          requests={requests}
          onLogout={handleLogout}
        />
      )}

      {appState === 'admin' && (
        <AdminDashboard onExit={() => setAppState(user ? 'app' : 'landing')} />
      )}

      {/* Admin Access Button - shown on landing page */}
      {appState === 'landing' && (
        <button
          onClick={() => setShowAdminPrompt(true)}
          className="fixed bottom-6 right-6 bg-slate-800 text-white p-3 rounded-full shadow-lg"
        >
          <ShieldCheck size={20} />
        </button>
      )}

      {adminPromptModal}
    </>
  );
}

// Wrap with Error Boundary
export default function WrappedApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
