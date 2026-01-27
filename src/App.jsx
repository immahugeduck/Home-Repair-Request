import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
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
  serverTimestamp 
} from 'firebase/firestore';
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
  Building2
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'home-repair-app';

// --- Constants & Helpers ---
const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'hvac', label: 'HVAC', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'structural', label: 'Structural', icon: Hammer, color: 'text-stone-500', bg: 'bg-stone-50' },
  { id: 'general', label: 'General', icon: Wrench, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { id: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-700' },
];

const STATUS_MAP = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  waiting_confirmation: { label: 'Scheduling', icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  in_progress: { label: 'In Progress', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
};

const Badge = ({ children, className }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${className}`}>
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
            <div className="text-red-500 mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-600 text-sm mb-4">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Sub-Components ---
const ProfileSetupView = ({ profileForm, setProfileForm, handleSaveProfile, isSubmitting, setView }) => (
  <div className="p-6 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-300">
    <div className="flex items-center gap-4 mb-8">
      <button onClick={() => setView('profile')} className="p-2 hover:bg-slate-100 rounded-full">
        <X size={20} className="text-slate-500" />
      </button>
      <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
    </div>
    <div className="text-center mb-8">
      <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserCircle size={32} />
      </div>
      <p className="text-slate-500 text-sm">We use this to contact you about repairs.</p>
    </div>
    <form onSubmit={handleSaveProfile} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
        <input 
          type="text" 
          required 
          value={profileForm.fullName || ''} 
          onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} 
          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
          placeholder="Enter your name" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-700 ml-1">Phone</label>
        <input 
          type="tel" 
          required 
          value={profileForm.phone || ''} 
          onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
          placeholder="(555) 000-0000" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-700 ml-1">Primary Address</label>
        <input 
          type="text" 
          required 
          value={profileForm.address || ''} 
          onChange={e => setProfileForm({...profileForm, address: e.target.value})} 
          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
          placeholder="Where do you live?" 
        />
      </div>
      <button 
        disabled={isSubmitting} 
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  </div>
);

const StaffInboxView = ({ allRequests, pendingCount, updateRequestStatus, proposeTimeSlot, companyProfile }) => {
  const [activeProposalId, setActiveProposalId] = useState(null);
  const [timeSlot, setTimeSlot] = useState('');

  const handleProposalSubmit = useCallback((requestId) => {
    if (timeSlot.trim()) {
      proposeTimeSlot(requestId, timeSlot);
      setActiveProposalId(null);
      setTimeSlot('');
    }
  }, [timeSlot, proposeTimeSlot]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Team Inbox</h1>
          <p className="text-sm text-slate-500 truncate max-w-[200px]">{companyProfile.name}</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            {pendingCount} New
          </div>
        )}
      </div>

      <div className="space-y-4">
        {allRequests.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Inbox size={48} className="mx-auto opacity-20 mb-2" />
            <p>Inbox is empty.</p>
          </div>
        ) : (
          allRequests.map(req => {
            const urgency = URGENCY_LEVELS.find(u => u.id === req.urgency);
            const status = STATUS_MAP[req.status];
            
            return (
              <div key={req.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={urgency?.color || 'bg-slate-100 text-slate-700'}>
                        {req.urgency}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">#{req.id.slice(-4)}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${status?.color || 'text-slate-500'}`}>
                      {status?.label || 'Unknown'}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 capitalize mb-1">{req.category} Issue</h3>
                  <p className="text-sm text-slate-600 mb-4">{req.description}</p>
                  
                  <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Customer Preference</p>
                    <p className="text-xs text-slate-700 font-medium">{req.preferredDates || 'Anytime'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 mb-4 border-t pt-4 border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <UserCircle size={14} className="shrink-0" />
                      <span className="font-semibold truncate">{req.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs justify-end">
                      <Phone size={14} className="shrink-0" />
                      <span>{req.userPhone}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-slate-500 text-xs">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{req.address}</span>
                    </div>
                  </div>

                  {req.status === 'pending' && activeProposalId !== req.id && (
                    <button 
                      onClick={() => setActiveProposalId(req.id)} 
                      className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors"
                    >
                      Propose Time Slot
                    </button>
                  )}

                  {activeProposalId === req.id && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text" 
                        placeholder="e.g., Tomorrow at 9 AM" 
                        className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none" 
                        value={timeSlot} 
                        onChange={(e) => setTimeSlot(e.target.value)} 
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleProposalSubmit(req.id)} 
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-emerald-700 transition-colors" 
                          disabled={!timeSlot.trim()}
                        >
                          Send Proposal
                        </button>
                        <button 
                          onClick={() => {
                            setActiveProposalId(null);
                            setTimeSlot('');
                          }} 
                          className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {req.status === 'in_progress' && (
                    <button 
                      onClick={() => updateRequestStatus(req.id, 'completed')} 
                      className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                    >
                      Mark Job Completed
                    </button>
                  )}

                  {req.status === 'waiting_confirmation' && (
                    <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Awaiting Customer Confirmation</p>
                      <p className="text-xs text-amber-600 font-bold mt-1">"{req.proposedTime}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Main App ---
function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState({
    name: 'First Call Maintenance',
    logoUrl: '',
    phone: '',
    email: ''
  });
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [view, setView] = useState('home'); 
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    category: 'general',
    urgency: 'medium',
    description: '',
    address: '',
    preferredDates: ''
  });
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', address: '' });
  const [companyForm, setCompanyForm] = useState({ 
    name: 'First Call Maintenance', 
    logoUrl: '', 
    phone: '', 
    email: '' 
  });

  // --- Auth & Data Listeners ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { 
        console.error("Auth error:", error); 
        setLoading(false);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // User Profile Listener
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubscribeProfile = onSnapshot(
      profileRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          setProfileForm(data);
          setFormData(prev => ({ 
            ...prev, 
            address: prev.address || data.address || ''
          }));
        }
        setLoading(false);
      },
      (error) => {
        console.error("Profile listener error:", error);
        setLoading(false);
      }
    );

    // Company Profile Listener
    const companyRef = doc(db, 'artifacts', appId, 'public', 'settings', 'company');
    const unsubscribeCompany = onSnapshot(
      companyRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompanyProfile(data);
          // Only update form when NOT actively editing
          if (view !== 'company-setup') {
            setCompanyForm(data);
          }
        }
      },
      (error) => console.error("Company listener error:", error)
    );

    // Global Requests Listener
    const requestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'repairRequests');
    const unsubscribeRequests = onSnapshot(
      requestsRef, 
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        setAllRequests(data);
        setRequests(data.filter(req => req.userId === user.uid));
      }, 
      (error) => console.error("Requests listener error:", error)
    );

    return () => { 
      unsubscribeProfile(); 
      unsubscribeCompany(); 
      unsubscribeRequests(); 
    };
  }, [user, view]);

  // --- Handlers ---
  const handleSaveProfile = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(profileRef, { 
        ...profileForm, 
        updatedAt: serverTimestamp() 
      });
      setView('home');
    } catch (error) { 
      console.error("Save profile error:", error);
      alert("Failed to save profile. Please try again.");
    } finally { 
      setIsSubmitting(false); 
    }
  }, [profileForm, user]);

  const handleSaveCompany = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const companyRef = doc(db, 'artifacts', appId, 'public', 'settings', 'company');
      await setDoc(companyRef, { 
        ...companyForm, 
        updatedAt: serverTimestamp() 
      });
      setView('profile');
    } catch (error) { 
      console.error("Save company error:", error);
      alert("Failed to save company settings. Please try again.");
    } finally { 
      setIsSubmitting(false); 
    }
  }, [companyForm]);

  const handleSubmitRequest = useCallback(async (e) => {
    e.preventDefault();
    if (!userProfile?.phone || !userProfile?.fullName) { 
      setView('profile-setup'); 
      return; 
    }
    setIsSubmitting(true);
    try {
      const requestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'repairRequests');
      await addDoc(requestsRef, {
        ...formData,
        userId: user.uid,
        userName: userProfile.fullName,
        userPhone: userProfile.phone,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setFormData(prev => ({ 
        ...prev, 
        description: '', 
        preferredDates: '' 
      }));
      setView('list');
    } catch (error) { 
      console.error("Submit request error:", error);
      alert("Failed to submit request. Please try again.");
    } finally { 
      setIsSubmitting(false); 
    }
  }, [formData, user, userProfile]);

  const proposeTimeSlot = useCallback(async (requestId, time) => {
    if (!requestId || !time) return;
    
    try {
      const requestRef = doc(db, 'artifacts', appId, 'public', 'data', 'repairRequests', requestId);
      await updateDoc(requestRef, { 
        status: 'waiting_confirmation', 
        proposedTime: time 
      });
    } catch (error) { 
      console.error("Propose time slot error:", error);
      alert("Failed to propose time slot. Please try again.");
    }
  }, []);

  const updateRequestStatus = useCallback(async (requestId, nextStatus) => {
    if (!requestId || !nextStatus) return;
    
    try {
      const requestRef = doc(db, 'artifacts', appId, 'public', 'data', 'repairRequests', requestId);
      await updateDoc(requestRef, { status: nextStatus });
    } catch (error) { 
      console.error("Update status error:", error);
      alert("Failed to update status. Please try again.");
    }
  }, []);

  const declineSchedule = useCallback(async (requestId) => {
    if (!requestId) return;
    
    try {
      const requestRef = doc(db, 'artifacts', appId, 'public', 'data', 'repairRequests', requestId);
      await updateDoc(requestRef, { 
        status: 'pending', 
        proposedTime: null 
      });
    } catch (error) { 
      console.error("Decline schedule error:", error);
      alert("Failed to decline schedule. Please try again.");
    }
  }, []);

  // Memoized counts
  const customerInboxCount = useMemo(() => 
    requests.filter(r => r.status === 'waiting_confirmation').length,
    [requests]
  );

  const pendingCount = useMemo(() => 
    allRequests.filter(r => r.status === 'pending').length,
    [allRequests]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-x-hidden">
      {/* Dynamic Header */}
      <header className="px-6 pt-8 pb-4 bg-slate-50 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {(isStaffMode || (view === 'customer-inbox' && customerInboxCount > 0)) && companyProfile.logoUrl && (
            <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm">
              <img src={companyProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              {isStaffMode ? 'Staff Portal' : 'HomeFix App'}
            </h2>
            <p className="font-bold text-lg truncate max-w-[180px]">
              {isStaffMode ? companyProfile.name : (userProfile?.fullName || 'Welcome')}
            </p>
          </div>
        </div>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm shrink-0 transition-colors ${isStaffMode ? 'bg-slate-800' : 'bg-indigo-600'}`}>
          {isStaffMode ? <ShieldCheck size={20} /> : <User size={20} />}
        </div>
      </header>

      {/* View Switcher */}
      <main className="flex-1 overflow-y-auto pb-24">
        {view === 'profile-setup' ? (
          <ProfileSetupView 
            profileForm={profileForm} 
            setProfileForm={setProfileForm} 
            handleSaveProfile={handleSaveProfile} 
            isSubmitting={isSubmitting} 
            setView={setView} 
          />
        ) : view === 'company-setup' ? (
          <div className="p-6 max-w-lg mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('profile')} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20}/>
              </button>
              <h1 className="text-xl font-bold">Business Settings</h1>
            </div>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="text-sm font-bold ml-1">Company Name</label>
                <input 
                  type="text" 
                  value={companyForm.name || ''} 
                  onChange={e => setCompanyForm({...companyForm, name: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-800" 
                />
              </div>
              <div>
                <label className="text-sm font-bold ml-1">Logo URL</label>
                <input 
                  type="text" 
                  value={companyForm.logoUrl || ''} 
                  onChange={e => setCompanyForm({...companyForm, logoUrl: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-800" 
                  placeholder="https://..." 
                />
              </div>
              <div>
                <label className="text-sm font-bold ml-1">Business Phone</label>
                <input 
                  type="tel" 
                  value={companyForm.phone || ''} 
                  onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-800" 
                />
              </div>
              <div>
                <label className="text-sm font-bold ml-1">Business Email</label>
                <input 
                  type="email" 
                  value={companyForm.email || ''} 
                  onChange={e => setCompanyForm({...companyForm, email: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-800" 
                />
              </div>
              <button 
                disabled={isSubmitting} 
                className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold mt-4 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Update Business'}
              </button>
            </form>
          </div>
        ) : isStaffMode ? (
          view === 'admin-inbox' ? (
            <StaffInboxView 
              allRequests={allRequests} 
              pendingCount={pendingCount} 
              updateRequestStatus={updateRequestStatus} 
              proposeTimeSlot={proposeTimeSlot} 
              companyProfile={companyProfile} 
            />
          ) : (
            <div className="p-6 text-center py-20 animate-in fade-in duration-500">
              <ShieldCheck size={64} className="mx-auto text-slate-200 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Portal Ready</h2>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">
                Manage maintenance requests for {companyProfile.name}.
              </p>
              <button 
                onClick={() => setView('admin-inbox')} 
                className="bg-slate-800 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 flex items-center gap-2 mx-auto hover:bg-slate-700 transition-colors"
              >
                <Inbox size={20} /> View Team Inbox
              </button>
            </div>
          )
        ) : (
          <>
            {view === 'home' && (
              <div className="p-6 space-y-8">
                <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 leading-tight">Home Repair<br/>Made Simple.</h1>
                    <p className="text-indigo-100 mb-8 opacity-90 max-w-[200px] leading-relaxed">
                      {companyProfile.name} is standing by.
                    </p>
                    <button 
                      onClick={() => setView('new-request')} 
                      className="bg-white text-indigo-600 px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <Plus size={20} strokeWidth={3} /> New Request
                    </button>
                  </div>
                  <Wrench size={180} className="absolute -bottom-10 -right-10 text-white opacity-10 rotate-12" />
                </div>

                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-5">Quick Services</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => { 
                          setFormData({...formData, category: cat.id}); 
                          setView('new-request'); 
                        }} 
                        className={`${cat.bg} p-5 rounded-[1.5rem] flex flex-col items-center gap-4 border-2 border-transparent active:border-slate-200 transition-all active:scale-95`}
                      >
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                          <cat.icon className={cat.color} size={28} />
                        </div>
                        <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {view === 'customer-inbox' && (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Inbox</h1>
                {requests.filter(r => r.status === 'waiting_confirmation' || r.status === 'in_progress').length === 0 ? (
                  <div className="text-center py-24 opacity-30">
                    <MessageSquare size={64} className="mx-auto mb-4" />
                    <p className="font-bold">No new messages.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests
                      .filter(r => r.status === 'waiting_confirmation' || r.status === 'in_progress')
                      .map(req => (
                        <div 
                          key={req.id} 
                          className="bg-white border-2 border-indigo-50 p-5 rounded-3xl shadow-sm animate-in slide-in-from-right-4"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                              {companyProfile.logoUrl ? (
                                <img src={companyProfile.logoUrl} className="w-full h-full object-cover" alt="Company" />
                              ) : (
                                <ShieldCheck size={20} className="text-white"/>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800">{companyProfile.name}</h3>
                              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                                Scheduling
                              </p>
                            </div>
                          </div>
                          {req.status === 'waiting_confirmation' ? (
                            <div className="space-y-4">
                              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">
                                  Proposed Arrival
                                </p>
                                <p className="font-extrabold text-indigo-900 text-lg">{req.proposedTime}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => updateRequestStatus(req.id, 'in_progress')} 
                                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => declineSchedule(req.id)} 
                                  className="px-5 bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100">
                              <CheckCircle2 className="text-emerald-500" size={24} />
                              <div>
                                <p className="text-xs font-bold text-emerald-800">Confirmed</p>
                                <p className="text-sm font-bold text-emerald-600">{req.proposedTime}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {view === 'list' && (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">History</h1>
                {requests.length === 0 ? (
                  <p className="text-center py-20 text-slate-300">No requests yet.</p>
                ) : (
                  <div className="space-y-4">
                    {requests.map(req => {
                      const category = CATEGORIES.find(c => c.id === req.category);
                      const status = STATUS_MAP[req.status];
                      const IconComponent = category?.icon || Wrench;
                      
                      return (
                        <div 
                          key={req.id} 
                          className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${category?.bg || 'bg-slate-50'}`}>
                              <IconComponent size={24} className={category?.color || 'text-slate-500'} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 capitalize">{req.category} Repair</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {status?.label || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="text-slate-300" size={20} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {view === 'new-request' && (
              <div className="p-6 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setView('home')} className="p-2 hover:bg-slate-100 rounded-full">
                    <X size={20}/>
                  </button>
                  <h1 className="text-xl font-bold">New Request</h1>
                </div>
                <form onSubmit={handleSubmitRequest} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold ml-1">Service Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.id} 
                          type="button" 
                          onClick={() => setFormData({...formData, category: cat.id})} 
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                            formData.category === cat.id 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                              : 'border-slate-100 bg-white'
                          }`}
                        >
                          <cat.icon size={20} />
                          <span className="text-[10px] font-bold uppercase">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold ml-1">Arrival Preference</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Next Monday AM" 
                      value={formData.preferredDates} 
                      onChange={e => setFormData({...formData, preferredDates: e.target.value})} 
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-600" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold ml-1">Full Address</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-600" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold ml-1">The Issue</label>
                    <textarea 
                      required 
                      rows="4" 
                      placeholder="Briefly describe what needs fixing..." 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-600 resize-none" 
                    />
                  </div>
                  <button 
                    disabled={isSubmitting} 
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Send Request'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {view === 'profile' && (
          <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            <div className="bg-white rounded-3xl p-6 border border-slate-50 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">My Info</h3>
                <button 
                  onClick={() => setView('profile-setup')} 
                  className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-full"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-4 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-3">
                  <UserCircle size={18} className="text-indigo-500" />
                  <span>{userProfile?.fullName || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-indigo-500" />
                  <span>{userProfile?.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-indigo-500" />
                  <span>{userProfile?.address || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-50 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="font-bold text-slate-800">Staff Mode</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    Access {companyProfile.name}
                  </p>
                </div>
                <button 
                  onClick={() => { 
                    setIsStaffMode(!isStaffMode); 
                    setView('home'); 
                  }} 
                  className={`w-14 h-7 rounded-full relative transition-colors ${
                    isStaffMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${
                    isStaffMode ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              {isStaffMode && (
                <div className="pt-6 border-t border-slate-50 animate-in fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-xs uppercase text-slate-400">Company Identity</h4>
                    <button 
                      onClick={() => setView('company-setup')} 
                      className="text-indigo-600 font-bold text-xs"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                      {companyProfile.logoUrl ? (
                        <img src={companyProfile.logoUrl} className="w-full h-full object-cover" alt="Company" />
                      ) : (
                        <Building2 size={24} />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate">{companyProfile.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">
                        {companyProfile.email || 'No email set'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Nav Bar */}
      {!['new-request', 'profile-setup', 'company-setup'].includes(view) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-5 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-2xl">
          {!isStaffMode ? (
            <>
              <button 
                onClick={() => setView('home')} 
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  view === 'home' ? 'text-indigo-600' : 'text-slate-300'
                }`}
              >
                <Home size={22} strokeWidth={2.5}/>
                <span className="text-[9px] font-extrabold uppercase tracking-tighter">Home</span>
              </button>
              <button 
                onClick={() => setView('customer-inbox')} 
                className={`flex flex-col items-center gap-1.5 relative transition-all ${
                  view === 'customer-inbox' ? 'text-indigo-600' : 'text-slate-300'
                }`}
              >
                <Inbox size={22} strokeWidth={2.5}/>
                <span className="text-[9px] font-extrabold uppercase tracking-tighter">Inbox</span>
                {customerInboxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-black animate-bounce ring-2 ring-white">
                    {customerInboxCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setView('new-request')} 
                className="flex flex-col items-center gap-1.5 -translate-y-8 group"
              >
                <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200 group-active:scale-90 transition-transform">
                  <Plus size={28} strokeWidth={3}/>
                </div>
              </button>
              <button 
                onClick={() => setView('list')} 
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  view === 'list' ? 'text-indigo-600' : 'text-slate-300'
                }`}
              >
                <List size={22} strokeWidth={2.5}/>
                <span className="text-[9px] font-extrabold uppercase tracking-tighter">History</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setView('home')} 
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  view === 'home' ? 'text-slate-800' : 'text-slate-300'
                }`}
              >
                <Home size={22} strokeWidth={2.5}/>
                <span className="text-[9px] font-extrabold uppercase tracking-tighter">Stats</span>
              </button>
              <button 
                onClick={() => setView('admin-inbox')} 
                className={`flex flex-col items-center gap-1.5 relative transition-all ${
                  view === 'admin-inbox' ? 'text-slate-800' : 'text-slate-300'
                }`}
              >
                <Inbox size={22} strokeWidth={2.5}/>
                <span className="text-[9px] font-extrabold uppercase tracking-tighter">Inbox</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-black ring-2 ring-white">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button className="flex flex-col items-center gap-1.5 text-slate-300">
                <ClipboardList size={22} strokeWidth={2.5}/>
                <span className="text-[9px] font-extrabold uppercase tracking-tighter">Jobs</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setView('profile')} 
            className={`flex flex-col items-center gap-1.5 transition-all ${
              view === 'profile' ? (isStaffMode ? 'text-slate-800' : 'text-indigo-600') : 'text-slate-300'
            }`}
          >
            <User size={22} strokeWidth={2.5}/>
            <span className="text-[9px] font-extrabold uppercase tracking-tighter">Profile</span>
          </button>
        </nav>
      )}
    </div>
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
