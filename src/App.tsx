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
import { VisionBoard } from './components/VisionBoard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { db, auth } from './firebase';
import { ProfileData, ConsistencyData } from './types';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { collection, onSnapshot, query, where, orderBy, limit, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

const AppContent: React.FC = () => {
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
  const [isVisionBoardOpen, setIsVisionBoardOpen] = useState(false);

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
    score: 0,
    attendance: 0,
    quizPassRate: 0,
    deadlinesMet: 0,
    studyHours: 0
  });

  const [childAcademicRecord, setChildAcademicRecord] = useState<any>(null);
  const [childConsistency, setChildConsistency] = useState<ConsistencyData | null>(null);

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
      
      // Persist to Firestore if logged in
      if (user && role === 'student') {
        updateProfile({ consistencyData: { ...consistencyData, score: newScore } } as any);
      }
    };

    calculateScore();
  }, [consistencyData.attendance, consistencyData.quizPassRate, consistencyData.deadlinesMet, consistencyData.studyHours]);

  // Handle Parent-Child Data Sync
  useEffect(() => {
    if (!isLoggedIn || role !== 'parent' || !profileData.childName) {
      setChildAcademicRecord(null);
      setChildConsistency(null);
      return;
    }

    // 1. Find child's consistency data from their user document
    const usersQuery = query(collection(db, 'users'), where('name', '==', profileData.childName), limit(1));
    const unsubscribeChildUser = onSnapshot(usersQuery, (snapshot) => {
      if (!snapshot.empty) {
        const childDoc = snapshot.docs[0].data();
        if (childDoc.consistencyData) {
          setChildConsistency(childDoc.consistencyData);
        }
      }
    });

    // 2. Find child's academic record (IA marks) from teacher's students collection
    const studentsQuery = query(collection(db, 'students'), where('name', '==', profileData.childName), limit(1));
    const unsubscribeChildStudent = onSnapshot(studentsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const studentData = snapshot.docs[0].data();
        setChildAcademicRecord({
          rollNo: studentData.rollNo,
          sem4: studentData.sem4,
          ia1: studentData.ia1,
          ia2: studentData.ia2,
          batch: studentData.batch || "INFTT-1",
          college: studentData.college || "Institute of Engineering & Technology",
          course: studentData.course || "B.E. Information Technology"
        });
      }
    });

    return () => {
      unsubscribeChildUser();
      unsubscribeChildStudent();
    };
  }, [isLoggedIn, role, profileData.childName]);

  // Handle Student's Academic Record Sync (from Teacher's List)
  const [studentAcademicRecord, setStudentAcademicRecord] = useState<any>(null);
  useEffect(() => {
    if (!isLoggedIn || role !== 'student' || !profileData.name) {
      setStudentAcademicRecord(null);
      return;
    }

    const q = query(collection(db, 'students'), where('name', '==', profileData.name), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudentAcademicRecord(snapshot.docs[0].data());
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn, role, profileData.name]);

  // Shared State for Notices and Doubt Solver
  const [notices, setNotices] = useState<Notice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({ notices: 0, doubts: 0 });

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
      setUnreadCounts({ notices: 0, doubts: 0 });
      return;
    }

    // Listen for notices with specific filters
    const noticesQuery = query(collection(db, 'notices'), orderBy('date', 'desc'), limit(50));
    const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
      const allNotices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      
      // Filter notices based on role and target
      const filtered = allNotices.filter(n => {
        if (role === 'teacher') return true;
        
        // Defaults to 'all' if not specified (legacy notices)
        const audience = n.targetAudience || 'all';
        if (audience === 'all') return true;
        
        const targetRoll = n.targetRollNo ? String(n.targetRollNo).trim() : '';
        const userRoll = profileData.rollNo ? String(profileData.rollNo).trim() : '';
        
        if (role === 'student') {
          const studentRecRoll = studentAcademicRecord?.rollNo ? String(studentAcademicRecord.rollNo).trim() : '';
          if (audience === 'students') return true;
          if (audience === 'specific') {
            return targetRoll !== '' && (targetRoll === userRoll || targetRoll === studentRecRoll);
          }
        }
        
        if (role === 'parent') {
          const childRoll = childAcademicRecord?.rollNo ? String(childAcademicRecord.rollNo).trim() : '';
          if (audience === 'parents') return true;
          if (audience === 'specific') {
            // Parent sees notice if it targets their own roll (if any) or their child's roll
            return targetRoll !== '' && (targetRoll === userRoll || targetRoll === childRoll);
          }
        }
        return false;
      });
      
      setNotices(filtered);
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
  }, [isLoggedIn, role, profileData.rollNo, childAcademicRecord?.rollNo]);

  // Handle unread counts logic
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    // Reset unread counts when tab is active
    if (activeTab === 'notices') {
      if (notices.length > 0) {
        localStorage.setItem(`lastNoticeId_${user.uid}`, notices[0].id);
      }
      setUnreadCounts(prev => ({ ...prev, notices: 0 }));
    }
    if (activeTab === 'doubts') {
      if (messages.length > 0) {
        localStorage.setItem(`lastMessageId_${user.uid}`, messages[messages.length - 1].id);
      }
      setUnreadCounts(prev => ({ ...prev, doubts: 0 }));
    }

    // Calculate unread notices (only when not on the notices tab)
    if (notices.length > 0 && activeTab !== 'notices') {
      const lastId = localStorage.getItem(`lastNoticeId_${user.uid}`);
      if (lastId) {
        const index = notices.findIndex(n => n.id === lastId);
        setUnreadCounts(prev => ({ ...prev, notices: index === -1 ? notices.length : index }));
      } else {
        setUnreadCounts(prev => ({ ...prev, notices: notices.length }));
      }
    }

    // Calculate unread doubts (only when not on the doubts tab)
    if (messages.length > 0 && activeTab !== 'doubts') {
      const lastId = localStorage.getItem(`lastMessageId_${user.uid}`);
      if (lastId) {
        const index = messages.findLastIndex(m => m.id === lastId);
        setUnreadCounts(prev => ({ ...prev, doubts: index === -1 ? messages.length : messages.length - 1 - index }));
      } else {
        setUnreadCounts(prev => ({ ...prev, doubts: messages.length }));
      }
    }
  }, [isLoggedIn, activeTab, notices, messages, user?.uid]);

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
          if (isTestUser) {
            // Test user can switch roles freely without reset
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
        case 'dashboard': return <StudentDashboard onNavigate={setActiveTab} notices={notices} searchQuery={searchQuery} academicRecord={studentAcademicRecord} />;
        case 'video': return (
          <div className="p-8">
            <VideoFocusPlayer />
          </div>
        );
        case 'curriculum': return <Curriculum searchQuery={searchQuery} />;
        case 'scheduler': return <SmartScheduler searchQuery={searchQuery} />;
        case 'notices': return <NoticeBoard notices={notices} setNotices={setNotices} isReadOnly={true} searchQuery={searchQuery} />;
        case 'doubts': return <DoubtSolver messages={messages} setMessages={setMessages} userRole="student" userName={profileData.name} searchQuery={searchQuery} />;
        case 'notes': return <SmartNotes />;
        case 'about-devs': return <AboutDevelopers />;
        case 'settings': return <ProfileSettings profile={profileData} onUpdate={updateProfile} onResetAccount={handleResetAccount} />;
        default: return <StudentDashboard onNavigate={setActiveTab} notices={notices} searchQuery={searchQuery} academicRecord={studentAcademicRecord} />;
      }
    } else if (role === 'teacher') {
      switch (activeTab) {
        case 'my-class': return <TeacherDashboard teacherName={profileData.name} searchQuery={searchQuery} notices={notices} />;
        case 'notices': return <NoticeBoard notices={notices} setNotices={setNotices} isReadOnly={false} searchQuery={searchQuery} authorName={profileData.name} />;
        case 'doubts': return <DoubtSolver messages={messages} setMessages={setMessages} userRole="teacher" userName={profileData.name} searchQuery={searchQuery} />;
        case 'settings': return <ProfileSettings profile={profileData} onUpdate={updateProfile} onResetAccount={handleResetAccount} />;
        default: return <TeacherDashboard teacherName={profileData.name} searchQuery={searchQuery} />;
      }
    } else if (role === 'parent') {
      switch (activeTab) {
        case 'performance': return <ParentDashboard childData={childAcademicRecord} searchQuery={searchQuery} />;
        case 'notices': return <NoticeBoard notices={notices} setNotices={setNotices} isReadOnly={true} searchQuery={searchQuery} />;
        case 'settings': return <ProfileSettings profile={profileData} onUpdate={updateProfile} onResetAccount={handleResetAccount} />;
        default: return <ParentDashboard childData={childAcademicRecord} activeTab={activeTab} searchQuery={searchQuery} />;
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
        notices: 'Notice Board',
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
        unreadCounts={unreadCounts}
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
          notices={notices}
          unreadNotices={unreadCounts.notices}
          onClearNotices={() => {
            if (notices.length > 0 && user) {
              setUnreadCounts(prev => ({ ...prev, notices: 0 }));
              localStorage.setItem(`lastNoticeId_${user.uid}`, notices[0].id);
            }
          }}
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

      {/* Role-Specific Action Hub (Global Floating Button) */}
      <motion.button
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (role === 'parent') setActiveTab('contact');
          else if (role === 'student') setIsVisionBoardOpen(true);
          else if (role === 'teacher') setActiveTab('notices');
        }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare size={24} className="relative z-10" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-slate-900 animate-pulse" />
        
        {/* Tooltip hint */}
        <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all whitespace-nowrap">
          {role === 'student' ? 'Daily Vision & Goals' : role === 'parent' ? 'Contact Faculty' : 'Quick Broadcast'}
        </div>
      </motion.button>

      {/* Student Vision Board Modal */}
      <VisionBoard 
        isOpen={isVisionBoardOpen} 
        onClose={() => setIsVisionBoardOpen(false)} 
      />
    </div>
  );
};

export default App;
