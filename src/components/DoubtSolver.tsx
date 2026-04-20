import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Clock, 
  Lock, 
  CheckCheck,
  Users,
  Search,
  Trash2,
  X,
  AlertCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDocs, writeBatch, query, limit, onSnapshot } from 'firebase/firestore';
import { ProfileData } from '../types';

export interface Message {
  id: string;
  sender: string;
  role: 'teacher' | 'student';
  content: string;
  timestamp: string;
  createdAt: any;
  authorId: string;
}

export interface DoubtSolverProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  userRole: 'teacher' | 'student';
  userName: string;
  searchQuery?: string;
}

const DEV_BYPASS_ACTIVE = true; // Set to true to test chat outside of Sundays

export const DoubtSolver: React.FC<DoubtSolverProps> = ({ messages, setMessages, userRole, userName, searchQuery = '' }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [isMembersVisible, setIsMembersVisible] = useState(false);
  const [members, setMembers] = useState<ProfileData[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes((localSearch || searchQuery).toLowerCase()) ||
    m.sender.toLowerCase().includes((localSearch || searchQuery).toLowerCase())
  );

  useEffect(() => {
    // Fetch members from Firestore
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as ProfileData[];
      setMembers(membersList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Close emoji picker when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check if it's Sunday and between 10 AM and 12 PM
    const checkActive = () => {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      const hours = now.getHours();
      setIsActive((isSunday && hours >= 10 && hours < 12) || DEV_BYPASS_ACTIVE);
    };

    checkActive();
    const interval = setInterval(checkActive, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isActive) return;

    try {
      const msg = {
        sender: userName,
        role: userRole,
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp(),
        authorId: auth.currentUser?.uid || `dev-${userRole}-${userName}`
      };

      await addDoc(collection(db, 'messages'), msg);
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear the entire chat history for everyone? This cannot be undone.")) return;
    setIsClearing(true);
    try {
      const q = query(collection(db, 'messages'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing chat:", error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] p-6 flex flex-col max-w-[1600px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-[32px] p-6 flex items-center justify-between shadow-sm relative z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3 shrink-0">
            <Users size={28} />
          </div>
          
          <AnimatePresence mode="wait">
            {isSearchVisible ? (
              <motion.div 
                key="search"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 max-w-md relative"
              >
                <input 
                  autoFocus
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-xl text-sm focus:outline-none"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                <button 
                  onClick={() => { setIsSearchVisible(false); setLocalSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">INFTT-1 Doubt Solver Group</h3>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                  )}></span>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {isActive ? `Active Now • ${members.length} Members` : `Inactive • ${members.length} Members`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {!isSearchVisible && (
            <button 
              onClick={() => setIsSearchVisible(true)}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
            >
              <Search size={22} />
            </button>
          )}

          <button 
            onClick={() => setIsMembersVisible(true)}
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
          >
            <MoreVertical size={22} />
          </button>

          {userRole === 'teacher' && (
            <button 
              onClick={handleClearChat}
              disabled={isClearing}
              className="ml-2 flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/30"
            >
              <Trash2 size={16} />
              {isClearing ? "CLEARING..." : "CLEAR"}
            </button>
          )}
        </div>
      </div>

      {/* Members Modal */}
      <AnimatePresence>
        {isMembersVisible && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMembersVisible(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">Group Members</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">INFTT-1 Doubt Solver</p>
                  </div>
                  <button 
                    onClick={() => setIsMembersVisible(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar space-y-3">
                  {/* Teachers First */}
                  {members.filter(m => m.role === 'teacher').map(teacher => (
                    <div key={teacher.uid} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                        {teacher.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">{teacher.name}</h4>
                          <span className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-full uppercase">Teacher</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{teacher.email}</p>
                      </div>
                      <Sparkles size={16} className="text-indigo-400" />
                    </div>
                  ))}

                  <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students ({members.filter(m => m.role === 'student').length})</p>
                  </div>

                  {/* Students */}
                  {members.filter(m => m.role === 'student').length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      <Users className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No students found</p>
                    </div>
                  )}
                  
                  {members.filter(m => m.role === 'student').map(student => (
                    <div key={student.uid} className="group p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-3xl flex items-center gap-4 transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-500 font-black text-xl shadow-inner group-hover:scale-105 transition-transform">
                        {student.name[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{student.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg">
                            PIN: {student.rollNo || 'N/A'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {student.course || 'INFT-1 Batch'}
                          </span>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-emerald-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-50 dark:bg-slate-950 border-x border-slate-200 dark:border-slate-800 overflow-y-auto p-10 space-y-8 custom-scrollbar relative"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="flex justify-center mb-10">
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-2">
            <Lock size={12} />
            Messages are end-to-end encrypted
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredMessages.map((msg) => {
            // Determine if message is from current user
            const currentUserId = auth.currentUser?.uid || `dev-${userRole}-${userName}`;
            const isMe = msg.authorId === currentUserId;

            return (
              <motion.div 
                key={msg.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "flex flex-col max-w-[75%] relative z-10 w-full mb-6",
                  isMe ? "ml-auto items-end text-right" : "mr-auto items-start text-left"
                )}
              >
                <div className={cn(
                  "flex items-center gap-3 mb-2 px-1",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 shadow-sm border",
                      msg.role === 'teacher' 
                        ? "text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50" 
                        : "text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                    )}>
                      {isMe ? "YOU" : msg.sender} {msg.role === 'teacher' && "• TEACHER"}
                    </p>
                    {userRole === 'teacher' && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors bg-white/50 dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800"
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  {!isMe && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      {msg.timestamp}
                    </span>
                  )}
                </div>

                <div className={cn(
                  "p-5 rounded-[24px] shadow-lg relative group transition-all duration-300",
                  isMe 
                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-100/50 dark:shadow-none" 
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-slate-200/50 dark:shadow-none hover:shadow-xl"
                )}>
                  <p className="text-base font-medium leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                  <div className={cn(
                    "flex items-center gap-2 mt-4",
                    isMe ? "justify-end text-indigo-200/70" : "justify-start text-slate-400 dark:text-slate-500"
                  )}>
                    <Clock size={10} />
                    <span className="text-[9px] font-black tracking-tighter uppercase">{msg.timestamp}</span>
                    {isMe && <CheckCheck size={12} className="ml-1" />}
                  </div>
                  
                  {/* Decorative tail */}
                  <div className={cn(
                    "absolute top-0 w-3 h-3",
                    isMe 
                      ? "right-[-6px] text-indigo-600 fill-current" 
                      : "left-[-6px] text-white dark:text-slate-900 fill-current"
                  )}>
                    <svg viewBox="0 0 16 16" className="w-full h-full">
                      <path d={isMe ? "M0 0 L16 0 L0 16 Z" : "M16 0 L0 0 L16 16 Z"} />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={48} className="text-slate-300 dark:text-slate-700" />
            </div>
            <p className="text-xl font-display font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">No doubts yet</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-700 mt-2">The group is waiting for its first question!</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-[32px] p-6 shadow-sm relative z-30">
        {!isActive ? (
          <div className="flex items-center justify-center gap-4 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Clock className="text-slate-400" size={24} />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Doubt Solver is currently locked. Next session: Sunday, 10:00 AM
            </p>
          </div>
        ) : (
          <div className="relative">
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden"
              >
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  theme={EmojiTheme.AUTO}
                  width={350}
                  height={400}
                />
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <div className="flex gap-1">
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all",
                    showEmojiPicker && "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  )}
                >
                  <Smile size={24} />
                </button>
                <button type="button" className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all">
                  <Paperclip size={24} />
                </button>
              </div>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your doubt or message here..."
                className="flex-1 px-8 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-100 dark:focus:border-indigo-900/30 rounded-[24px] text-lg font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={28} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
