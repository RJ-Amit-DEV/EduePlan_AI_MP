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
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  searchQuery?: string;
}

const DEV_BYPASS_ACTIVE = true; // Set to true to test chat outside of Sundays

export const DoubtSolver: React.FC<DoubtSolverProps> = ({ messages, userRole, searchQuery = '' }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        sender: userRole === 'teacher' ? 'Prof. Amit Jadhav' : 'Amit Jadhav',
        role: userRole,
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp(),
        authorId: auth.currentUser?.uid || `dev-${userRole}-id`
      };

      await addDoc(collection(db, 'messages'), msg);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] p-6 flex flex-col max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-t-[32px] p-6 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">INFTT-1 Doubt Solver Group</h3>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              )}></span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {isActive ? "Active Now • 120 Students" : "Inactive • Opens every Sunday 10AM-12PM"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {DEV_BYPASS_ACTIVE && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Dev Bypass Active</span>
            </div>
          )}
          <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <Search size={22} />
          </button>
          <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <MoreVertical size={22} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-50 border-x border-slate-200 overflow-y-auto p-10 space-y-8 custom-scrollbar relative"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="flex justify-center mb-10">
          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 flex items-center gap-2">
            <Lock size={12} />
            Messages are end-to-end encrypted
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredMessages && filteredMessages.map((msg) => {
            // Determine if message is from current user
            const isMe = msg.authorId === (auth.currentUser?.uid || `dev-${userRole}-id`);

            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[70%] relative z-10",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {!isMe && (
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mb-2 px-2",
                    msg.role === 'teacher' ? "text-indigo-600" : "text-slate-500"
                  )}>
                    {msg.sender} {msg.role === 'teacher' && "• Teacher"}
                  </p>
                )}
                <div className={cn(
                  "p-6 rounded-[32px] shadow-sm relative group",
                  isMe 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                )}>
                  <p className="text-base font-medium leading-relaxed">{msg.content}</p>
                  <div className={cn(
                    "flex items-center gap-2 mt-3",
                    isMe ? "justify-end text-indigo-200" : "justify-start text-slate-400"
                  )}>
                    <span className="text-[10px] font-bold">{msg.timestamp}</span>
                    {isMe && <CheckCheck size={14} />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="bg-white border border-slate-200 rounded-b-[32px] p-6 shadow-sm relative z-10">
        {!isActive ? (
          <div className="flex items-center justify-center gap-4 py-4 bg-slate-50 rounded-2xl border border-slate-100">
            <Clock className="text-slate-400" size={24} />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Doubt Solver is currently locked. Next session: Sunday, 10:00 AM
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-4">
            <button type="button" className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
              <Smile size={24} />
            </button>
            <button type="button" className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
              <Paperclip size={24} />
            </button>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your doubt or message here..."
              className="flex-1 px-8 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-[24px] text-lg font-semibold text-slate-700 outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send size={28} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
