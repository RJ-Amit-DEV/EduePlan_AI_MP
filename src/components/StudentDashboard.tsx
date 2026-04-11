import { getDoc } from "firebase/firestore";
import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { 
  Calendar, 
  Play, 
  Clock, 
  ChevronRight, 
  Zap, 
  Trophy, 
  Target, 
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  BrainCircuit,
  FileText,
  Video,
  Bell,
  Paperclip,
  Plus,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { DEADLINES } from '../constants';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';


enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const performanceData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 82 },
  { name: 'Sat', score: 90 },
  { name: 'Sun', score: 88 },
];

const subjectProgress = [
  { name: 'CN', progress: 85, color: '#4F46E5' },
  { name: 'Maths', progress: 62, color: '#8B5CF6' },
  { name: 'OS', progress: 78, color: '#10B981' },
  { name: 'SE', progress: 92, color: '#F43F5E' },
  { name: 'DS', progress: 55, color: '#F59E0B' },
];

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
  notices: any[];
  searchQuery?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate, notices, searchQuery = '' }) => {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const [userName, setUserName] = useState("User");

useEffect(() => {
  if (!auth.currentUser) return;

  const fetchUser = async () => {
    const docRef = doc(db, "users", auth.currentUser!.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setUserName(docSnap.data().name);
    }
  };

  fetchUser();
}, []);

  const [newDeadline, setNewDeadline] = useState({
    title: '',
    time: '',
    date: '',
    color: 'bg-rose-500',
    priority: 'high'
  });

  const filteredDeadlines = deadlines.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/deadlines`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedDeadlines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeadlines(fetchedDeadlines);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeadline.title || !newDeadline.date || !auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/deadlines`;
    try {
      await addDoc(collection(db, path), {
        title: newDeadline.title,
        time: `${newDeadline.date} ${newDeadline.time}`,
        date: newDeadline.date,
        color: newDeadline.color,
        priority: newDeadline.priority,
        type: 'assignment',
        completed: false,
        createdAt: serverTimestamp()
      });
      setShowAddDeadline(false);
      setNewDeadline({ title: '', time: '', date: '', color: 'bg-rose-500', priority: 'high' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleDeadline = async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/deadlines/${id}`;
    try {
      await updateDoc(doc(db, path), {
        completed: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteDeadline = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/deadlines/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };
   const formatDate = (date: any) => {
    if (!date) return 'Just now';
    if (typeof date === 'string') return date;
    if (date.toDate) return date.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 sm:space-y-8 md:space-y-10 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-2xl"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Welcome back,<span className="text-indigo-600 dark:text-indigo-400">{userName}</span> <span className="animate-wave inline-block">👋</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 text-base sm:text-lg font-medium leading-relaxed">
            Your AI tutor has prepared a personalized roadmap for today.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-6 sm:space-y-10">
          {/* Notice Board Preview */}
          <section className="bg-slate-900 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Bell size={160} />
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl sm:text-2xl font-display font-bold sm:font-black flex items-center gap-4">
                <Bell className="text-indigo-400" size={28} />
                Notice Board
              </h3>
              <button 
                onClick={() => onNavigate('notices')}
                className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {notices.slice(0, 2).map((notice) => (
                <div key={notice.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => onNavigate('notices')}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20">
                       {formatDate(notice.date)}
                    </span>
                    {notice.attachments.length > 0 && <Paperclip size={14} className="text-slate-500" />}
                  </div>
                  <h4 className="text-lg font-bold mb-2 line-clamp-1">{notice.title}</h4>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{notice.content}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Simplified Performance Chart */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[48px] border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm transition-all duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-10 relative z-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-bold sm:font-black text-slate-900 dark:text-white tracking-tight">Academic Growth</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Growth based on subject and quiz clearance</p>
              </div>
            </div>
            
<div className="h-[300px] w-full min-h-[300px] relative">
  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                    itemStyle={{ color: '#4F46E5', fontWeight: 700 }}
                  />
                  <Area 
                    type="stepAfter" 
                    dataKey="score" 
                    stroke="#4F46E5" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Smart Scheduler Preview - Simplified */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Calendar className="text-indigo-600" size={24} />
                Smart AI Scheduler
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                onClick={() => onNavigate('video')}
              >
                <h4 className="text-xl font-display font-extrabold text-slate-900 dark:text-white mb-2">Computer Networks</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">Unit 3: OSI Model Layers</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src="https://picsum.photos/seed/prof/100" alt="Prof" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Prof. Sarah Johnson</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Play size={16} fill="currentColor" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                onClick={() => onNavigate('scheduler')}
              >
                <h4 className="text-xl font-display font-extrabold text-slate-900 dark:text-white mb-2">Maths</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">Advanced Calculus</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src="https://picsum.photos/seed/prof2/100" alt="Prof" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Dr. Alan Turing</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Study Tools Grid */}
          <section>
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-6">AI Study Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'AI Scheduler', icon: Calendar, id: 'scheduler', color: 'bg-amber-500', shadow: 'shadow-amber-100', desc: 'Study plans' },
                { title: 'Video Focus', icon: Video, color: 'bg-blue-500', shadow: 'shadow-blue-100', id: 'video', desc: 'Learning' },
                { title: 'Interactive Quiz', icon: BrainCircuit, id: 'quiz', color: 'bg-indigo-600', shadow: 'shadow-indigo-100', desc: 'Test' },
                { title: 'Smart AI Notes', icon: FileText, id: 'notes', color: 'bg-emerald-500', shadow: 'shadow-emerald-100', desc: 'Insights' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onNavigate(tool.id)}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 hover:border-indigo-600 transition-all text-left group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl",
                    tool.color,
                    tool.shadow
                  )}>
                    <tool.icon size={24} />
                  </div>
                  <h4 className="text-base font-display font-extrabold text-slate-900 dark:text-white">{tool.title}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">{tool.desc}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Area */}
        <div className="xl:col-span-4 space-y-10">
          {/* Goals Card */}
          <section className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Target size={240} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display font-bold flex items-center gap-3">
                  <Target className="text-indigo-400" size={24} />
                  Current Goal
                </h3>
              </div>
              
              <div className="mb-8">
                <p className="text-slate-400 text-sm font-medium mb-2">IAT-1 Exam Preparation</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-display font-black text-white">78%</span>
                </div>
              </div>
              
              <div className="w-full h-3 bg-white/10 rounded-full mb-8 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '78%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                ></motion.div>
              </div>
              
              <button className="w-full py-4 bg-white text-slate-900 font-display font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl active:scale-[0.98]">
                CONTINUE LEARNING
              </button>
            </div>
          </section>

          {/* Removed Subject Mastery as per request */}

          {/* Deadlines */}
          <section className="relative">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Clock className="text-rose-500 sm:w-6 sm:h-6" size={20} />
                Critical Deadlines
              </h3>
              <button 
                onClick={() => setShowAddDeadline(true)}
                className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Plus size={18} />
              </button>
            </div>

            {showAddDeadline && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-[32px] border-2 border-indigo-100 dark:border-slate-700 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Add New Deadline</h4>
                  <button onClick={() => setShowAddDeadline(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddDeadline} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Deadline Title" 
                    value={newDeadline.title}
                    onChange={e => setNewDeadline({...newDeadline, title: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="date" 
                      value={newDeadline.date}
                      onChange={e => setNewDeadline({...newDeadline, date: e.target.value})}
                      className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                    />
                    <input 
                      type="time" 
                      value={newDeadline.time}
                      onChange={e => setNewDeadline({...newDeadline, time: e.target.value})}
                      className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Color:</span>
                    <div className="flex gap-2">
                      {['bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500'].map(c => (
                        <button 
                          key={c}
                          type="button"
                          onClick={() => setNewDeadline({...newDeadline, color: c})}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all",
                            c,
                            newDeadline.color === c ? "border-slate-900 scale-125" : "border-transparent"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                    Add Deadline
                  </button>
                </form>
              </motion.div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {filteredDeadlines.map((deadline: any) => (
                <motion.div 
                  key={deadline.id} 
                  whileHover={{ x: 5 }}
                  className={cn(
                    "bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] border border-slate-200 dark:border-slate-800 flex items-center gap-4 sm:gap-5 shadow-sm hover:shadow-md transition-all group cursor-pointer",
                    deadline.completed && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 text-white",
                    deadline.color
                  )}>
                    {deadline.type === 'exam' ? <Trophy size={18} className="sm:w-6 sm:h-6" /> : <FileText size={18} className="sm:w-6 sm:h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate",
                      deadline.completed && "line-through"
                    )}>{deadline.title}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 sm:mt-1">{deadline.time}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDeadline(deadline.id, deadline.completed);
                    }}
                    className={cn(
                      "p-2 rounded-full transition-all",
                      deadline.completed ? "text-emerald-500" : "text-slate-300 hover:text-indigo-500"
                    )}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDeadline(deadline.id);
                    }}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
              {filteredDeadlines.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium">
                  No deadlines found matching your search.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
