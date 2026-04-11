import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  Send, 
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: any;
  attachments: { type: 'pdf' | 'image'; name: string }[];
  authorId: string;
}

export interface NoticeBoardProps {
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  isReadOnly?: boolean;
  searchQuery?: string;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ notices, isReadOnly = false, searchQuery = '' }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsPosting(true);
    try {
      const newNotice = {
        title,
        content,
        date: serverTimestamp(),
        attachments: [], // In a real app, we'd handle file uploads
        authorId: auth.currentUser?.uid || 'dev-teacher-id'
      };

      await addDoc(collection(db, 'notices'), newNotice);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error("Error posting notice:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Just now';
    if (typeof date === 'string') return date;
    if (date.toDate) return date.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const deleteNotice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (error) {
      console.error("Error deleting notice:", error);
    }
  };

  return (
    <div className="p-10 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Create Notice Form */}
        {!isReadOnly && (
          <div className="xl:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[48px] border border-slate-200 p-10 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <Plus size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Post New Notice</h2>
                  <p className="text-slate-500 font-medium">Broadcast important updates to all students of INFTT-1.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Notice Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Internal Assessment Postponement"
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-[24px] text-lg font-semibold text-slate-700 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Notice Content</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type the detailed message here..."
                    rows={6}
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-[32px] text-lg font-medium text-slate-600 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">
                    <Paperclip size={18} />
                    Attach PDF
                  </button>
                  <button type="button" className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">
                    <ImageIcon size={18} />
                    Add Image
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full py-6 bg-indigo-600 text-white font-display font-black rounded-[24px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
                >
                  POST NOTICE NOW <Send size={22} />
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Notice History */}
        <div className={cn(isReadOnly ? "xl:col-span-12" : "xl:col-span-5")}>
          <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl shadow-slate-900/20 h-full">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-display font-black flex items-center gap-4">
                <History className="text-indigo-400" size={28} />
                {isReadOnly ? "Notice Board" : "Notice History"}
              </h3>
              <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                {notices.length} {isReadOnly ? "Active Notices" : "Posted"}
              </span>
            </div>

            <div className={cn(
              "space-y-6 overflow-y-auto pr-4 custom-scrollbar",
              isReadOnly ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0" : "max-h-[600px]"
            )}>
              <AnimatePresence mode="popLayout">
                {filteredNotices.map((notice) => (
                  <motion.div 
                    key={notice.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-8 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-tight">{notice.title}</h4>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                            {formatDate(notice.date)}
                          </p>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <button 
                          onClick={() => deleteNotice(notice.id)}
                          className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6 line-clamp-3">
                      {notice.content}
                    </p>

                    {notice.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                       {notice.attachments && notice.attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-slate-300 border border-white/5">
                            {att.type === 'pdf' ? <FileText size={14} className="text-rose-400" /> : <ImageIcon size={14} className="text-blue-400" />}
                            {att.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
