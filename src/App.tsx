import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare } from 'lucide-react';
import { UserRole } from './types';
import { cn } from './lib/utils';

// --- Components ---
import { Auth } from './components/Auth';
import { Sidebar, Header } from './components/Layout';
import { StudentDashboard } from './components/StudentDashboard';
import { VideoFocusPlayer } from './components/VideoFocusPlayer';
import { QuizZone } from './components/QuizZone';
import { Curriculum } from './components/Curriculum';
import { SmartScheduler } from './components/SmartScheduler';
import { TeacherDashboard, ParentDashboard } from './components/Dashboards';
import { NoticeBoard, Notice } from './components/NoticeBoard';
import { DoubtSolver, Message } from './components/DoubtSolver';
import { ProfileSettings } from './components/ProfileSettings';
import { AboutDevelopers } from './components/AboutDevelopers';
import { SmartNotes } from './components/SmartNotes';
import { db, auth } from './firebase';
import { ProfileData, ConsistencyData } from './types';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [searchQuery, setSearchQuery] = useState('');

  const [profileData, setProfileData] = useState<ProfileData>({
    uid: '',
    name: '',
    email: '',
    role: 'student',
    avatar: '',
    about: '',
    college: '',
    course: '',
    semester: '',
    department: '',
    designation: '',
    experience: '',
    childName: '',
    relationship: '',
    contact: ''
  });

  const [consistencyData, setConsistencyData] = useState<ConsistencyData>({
    score: 85,
    attendance: 92,
    quizPassRate: 78,
    deadlinesMet: 95,
    studyHours: 42
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const updateProfile = async (newData: Partial<ProfileData>) => {
    if (!user) return;
    
    try {
      const updatedProfile = { ...profileData, ...newData, updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfileData(prev => ({ ...prev, ...newData }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Logic to calculate consistency score based on real data
useEffect(() => {
    if (!user || !isLoggedIn || !auth.currentUser) return;

    const deadlinesPath = `users/${auth.currentUser.uid}/deadlines`;
    const q = query(collection(db, deadlinesPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const total = snapshot.size;
      const completed = snapshot.docs.filter(doc => doc.data().completed).length;
      
      const completionRate = total > 0 ? (completed / total) * 100 : 80; // Default to 80 if no deadlines
      
      // Update consistency data
      setConsistencyData(prev => ({
        ...prev,
        deadlinesMet: Math.round(completionRate),
        // We can also derive other metrics if we have more data
      }));
    }, (error) => {
      console.error("Error fetching deadlines for score:", error);
    });

    return () => unsubscribe();
  }, [user, isLoggedIn]);

  useEffect(() => {
    const calculateScore = () => {
      const { attendance, quizPassRate, deadlinesMet, studyHours } = consistencyData;
      const normalizedStudyHours = Math.min((studyHours / 50) * 100, 100);
      
      const newScore = Math.round(
        (quizPassRate * 0.4) + 
        (attendance * 0.3) + 
        (deadlinesMet * 0.2) + 
        (normalizedStudyHours * 0.1)
      );
      
      setConsistencyData(prev => ({ ...prev, score: newScore }));
    };

    calculateScore();
  }, [consistencyData.attendance, consistencyData.quizPassRate, consistencyData.deadlinesMet, consistencyData.studyHours]);

  // Shared State for Notices and Doubt Solver
  const [notices, setNotices] = useState<Notice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        // Listen to profile changes in real-time
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as ProfileData;
            setProfileData(userData);
            setRole(userData.role);
            setIsLoggedIn(true);
            setShowRoleSelection(false);
            
            // Set default tab based on role if on dashboard
            if (activeTab === 'dashboard') {
              if (userData.role === 'teacher') setActiveTab('my-class');
              else if (userData.role === 'parent') setActiveTab('performance');
            }
          } else {
            // New user, need to select role
            setIsLoggedIn(false);
            setShowRoleSelection(true);
          }
          setIsLoading(false);
        }, (error) => {
          // Only handle error if we still have a current user (to avoid logout race conditions)
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoggedIn(false);
        setRole(null);
        setShowRoleSelection(false);
        setIsLoading(false);
        setProfileData({
          uid: '',
          name: '',
          email: '',
          role: 'student',
          avatar: '',
          about: '',
          college: '',
          course: '',
          semester: '',
          department: '',
          designation: '',
          experience: '',
          childName: '',
          relationship: '',
          contact: ''
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotices([]);
      setMessages([]);
      return;
    }

    // Listen for notices
    const noticesQuery = query(collection(db, 'notices'), orderBy('date', 'desc'), limit(50));
    const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
      const newNotices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(newNotices);
    }, (error) => {
      console.error("Firestore Error (notices):", error);
    });

    // Listen for messages
    const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'asc'), limit(100));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(newMessages);
    }, (error) => {
      console.error("Firestore Error (messages):", error);
    });

    return () => {
      unsubscribeNotices();
      unsubscribeMessages();
    };
  }, [isLoggedIn]);

  const handleLogin = async (selectedRole: UserRole) => {
    try {
      let loggedInUser = auth.currentUser;
      
      if (!loggedInUser) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        loggedInUser = result.user;
      }
      
      // Check if profile exists
      const userDoc = await getDoc(doc(db, 'users', loggedInUser.uid));
      
      if (!userDoc.exists()) {
        // Create initial profile
        const initialProfile: ProfileData = {
          uid: loggedInUser.uid,
          name: loggedInUser.displayName || 'New User',
          email: loggedInUser.email || '',
          role: selectedRole,
          avatar: loggedInUser.photoURL || '',
          about: `I am a ${selectedRole} at EduPlan AI.`,
          college: '',
          course: '',
          semester: '',
          department: '',
          designation: '',
          experience: '',
          childName: '',
          relationship: '',
          contact: ''
        };
        
        await setDoc(doc(db, 'users', loggedInUser.uid), {
          ...initialProfile,
          updatedAt: serverTimestamp()
        });
        
        setProfileData(initialProfile);
        setRole(selectedRole);
      } else {
        const userData = userDoc.data() as ProfileData;
        
// Check if the user is trying to log in with a different role
        const isTestUser = loggedInUser.email === 'amitjadhav4306@gmail.com';
        
if (userData.role !== selectedRole) {
  const isTestUser = loggedInUser.email === 'amitjadhav4306@gmail.com';
  
  if (isTestUser) {
    // Test user can switch roles freely
    const updatedProfile: ProfileData = {
      ...userData,
      role: selectedRole,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', loggedInUser.uid), updatedProfile);
    setProfileData(updatedProfile);
    setRole(selectedRole);
  } else {
    const confirmSwitch = window.confirm(
              `You already have a ${userData.role} account. Would you like to switch to ${selectedRole}? This will reset your profile data.`
            );
            
            if (confirmSwitch) {
              // Reset profile to new role
              const updatedProfile: ProfileData = {
                ...userData,
                role: selectedRole,
                about: `I am a ${selectedRole} at EduPlan AI.`,
                updatedAt: serverTimestamp()
              };
              await setDoc(doc(db, 'users', loggedInUser.uid), updatedProfile);
              setProfileData(updatedProfile);
              setRole(selectedRole);
            } else {
              // Keep existing role
              setProfileData(userData);
              setRole(userData.role);
            }
          }
        } else {
          setProfileData(userData);
          setRole(userData.role);
        }
      }
      
      setIsLoggedIn(true);
      setShowRoleSelection(false);
      
      if (selectedRole === 'teacher') setActiveTab('my-class');
      else if (selectedRole === 'parent') setActiveTab('performance');
      else setActiveTab('dashboard');
      
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return; // User cancelled, ignore
      }
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setRole(null);
      setUser(null);
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleResetAccount = async () => {
    if (!user) return;
    
    const confirmReset = window.confirm(
      "Are you sure you want to reset your account? This will delete your profile and all your data (deadlines, schedules, notes). You will be logged out and can choose a new role next time."
    );
    
    if (!confirmReset) return;

    try {
      setIsLoading(true);
      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Sign out
      await signOut(auth);
      
      // Reset local state
      setIsLoggedIn(false);
      setRole(null);
      setUser(null);
      setActiveTab('dashboard');
      
      alert("Account reset successfully. You can now log in again and choose a different role.");
    } catch (error) {
      console.error("Reset Account Error:", error);
      alert("Failed to reset account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in useEffect will handle the rest
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return; // User cancelled, ignore
      }
      console.error("Sign In Error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 mb-8"
        >
          <Sparkles size={40} />
        </motion.div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-900 dark:text-white font-display font-black text-xl tracking-tight">EduPlan AI</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 bg-indigo-600 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Auth 
        onLogin={handleLogin} 
        onGoogleSignIn={handleGoogleSignIn} 
        initialStep={showRoleSelection ? 'role' : 'landing'} 
      />
    );
  }

  const renderContent = () => {
    if (role === 'student') {
      switch (activeTab) {
        case 'dashboard': return <StudentDashboard onNavigate={setActiveTab} notices={notices} searchQuery={searchQuery} />;
        case 'video': return (
          <div className="p-8">
            <VideoFocusPlayer />
          </div>
        );
        case 'curriculum': return <Curriculum searchQuery={searchQuery} />;
        case 'scheduler': return <SmartScheduler searchQuery={searchQuery} />;
        case 'notices': return <NoticeBoard notices={notices} setNotices={setNotices} isReadOnly={true} searchQuery={searchQuery} />;
        case 'doubts': return <DoubtSolver messages={messages} setMessages={setMessages} userRole="student" searchQuery={searchQuery} />;
        case 'notes': return <SmartNotes />;
        case 'about-devs': return <AboutDevelopers />;
        case 'settings': return <ProfileSettings profile={profileData} onUpdate={updateProfile} onResetAccount={handleResetAccount} />;
        default: return <StudentDashboard onNavigate={setActiveTab} notices={notices} searchQuery={searchQuery} />;
      }
    } else if (role === 'teacher') {
      switch (activeTab) {
        case 'my-class': return <TeacherDashboard searchQuery={searchQuery} />;
        case 'notices': return <NoticeBoard notices={notices} setNotices={setNotices} isReadOnly={false} searchQuery={searchQuery} />;
        case 'doubts': return <DoubtSolver messages={messages} setMessages={setMessages} userRole="teacher" searchQuery={searchQuery} />;
        case 'settings': return <ProfileSettings profile={profileData} onUpdate={updateProfile} onResetAccount={handleResetAccount} />;
        default: return <TeacherDashboard searchQuery={searchQuery} />;
      }
    } else if (role === 'parent') {
      switch (activeTab) {
        case 'performance': return <ParentDashboard consistency={consistencyData} searchQuery={searchQuery} />;
        case 'settings': return <ProfileSettings profile={profileData} onUpdate={updateProfile} onResetAccount={handleResetAccount} />;
        default: return <ParentDashboard consistency={consistencyData} activeTab={activeTab} searchQuery={searchQuery} />;
      }
    }
    return null;
  };

  const getHeaderTitle = () => {
    if (role === 'student') {
      const titles: Record<string, string> = {
        dashboard: 'Student Dashboard',
        curriculum: 'My Curriculum',
        video: 'Video Focus Player',
        scheduler: 'Smart AI Scheduler',
        notes: 'Smart Notes',
        'about-devs': 'About Developers'
      };
      return titles[activeTab] || 'EduPlan AI';
    }
    if (role === 'teacher') {
      const titles: Record<string, string> = {
        'my-class': 'My Class (INFTT-1)',
        notices: 'Notice Board',
        doubts: 'Doubt Solver'
      };
      return titles[activeTab] || 'Teacher Portal';
    }
    if (role === 'parent') {
      const titles: Record<string, string> = {
        performance: 'Student Performance',
        'college-info': 'College & Course Info',
        blogs: 'Parenting & Mental Health Blogs',
        contact: 'Contact Faculty'
      };
      return titles[activeTab] || 'Parent Portal';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar 
        role={role!} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      <main className={cn(
        "flex-1 min-h-screen flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-24" : "lg:ml-72",
        "ml-0"
      )}>
        <Header 
          title={getHeaderTitle() || 'EduPlan AI'} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          profile={profileData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (role || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="p-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
          <p>© 2026 EduPlan AI - Advanced Learning Platform. All rights reserved.</p>
        </footer>
      </main>

      {/* Global AI Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare size={24} className="relative z-10" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-slate-900 animate-pulse" />
      </motion.button>
    </div>
  );
};

export default App;
