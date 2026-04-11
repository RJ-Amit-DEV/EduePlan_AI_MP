import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  BrainCircuit, 
  Bell, 
  MessageSquare, 
  GraduationCap, 
  Settings, 
  LogOut,
  BarChart3,
  Calendar,
  FileText,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
  Code2
} from 'lucide-react';
import { UserRole, NavItem, ProfileData } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (id: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  role, 
  activeTab, 
  setActiveTab, 
  onLogout,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  darkMode,
  toggleDarkMode
}) => {
  const studentNav: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { label: 'Curriculum', icon: BookOpen, id: 'curriculum' },
    { label: 'AI Scheduler', icon: Calendar, id: 'scheduler' },
    { label: 'Video Player', icon: Video, id: 'video' },
    { label: 'Notice Board', icon: Bell, id: 'notices' },
    { label: 'Doubt Solver', icon: MessageSquare, id: 'doubts' },
    { label: 'Smart Notes', icon: FileText, id: 'notes' },
    { label: 'About Developers', icon: Code2, id: 'about-devs' },
    { label: 'Settings', icon: Settings, id: 'settings' },
  ];

  const teacherNav: NavItem[] = [
    { label: 'My Class', icon: Users, id: 'my-class' },
    { label: 'Notice Board', icon: Bell, id: 'notices', badge: '3' },
    { label: 'Doubt Solver', icon: MessageSquare, id: 'doubts', badge: '12' },
    { label: 'Settings', icon: Settings, id: 'settings' },
  ];

  const parentNav: NavItem[] = [
    { label: 'Performance', icon: BarChart3, id: 'performance' },
    { label: 'College Info', icon: BookOpen, id: 'college-info' },
    { label: 'Parenting Blogs', icon: FileText, id: 'blogs' },
    { label: 'Contact Faculty', icon: MessageSquare, id: 'contact' },
    { label: 'Settings', icon: Settings, id: 'settings' },
  ];

  const navItems = role === 'student' ? studentNav : role === 'teacher' ? teacherNav : parentNav;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 z-[60] shadow-sm transition-all duration-300 overflow-hidden lg:translate-x-0",
        isCollapsed ? "w-24" : "w-72",
        isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full"
      )}>
        <div className={cn(
          "p-8 flex items-center transition-all duration-300",
          isCollapsed && !isMobileOpen ? "justify-center px-4" : "gap-4"
        )}>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-300 shrink-0">
            <GraduationCap size={28} />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">EduPlan AI</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Learning Ecosystem</p>
            </motion.div>
          )}
          
          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="ml-auto p-2 text-slate-400 hover:text-slate-900 lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-10 -right-3 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-md z-50 transition-all hover:scale-110 active:scale-95 group/toggle hidden lg:flex"
        >
          <div className="transition-transform duration-300 group-hover/toggle:rotate-12">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </div>
        </button>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center rounded-2xl transition-all duration-300 group relative",
                isCollapsed && !isMobileOpen ? "justify-center p-4" : "justify-between px-4 py-3.5",
                activeTab === item.id 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <div className="flex items-center gap-3.5">
                <item.icon size={22} className={cn(
                  "transition-transform duration-300 shrink-0",
                  activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                )} />
                {(!isCollapsed || isMobileOpen) && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-semibold text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobileOpen && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60] shadow-xl translate-x-2 group-hover:translate-x-0">
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
              )}

              {item.badge && (!isCollapsed || isMobileOpen) && (
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
              {item.badge && isCollapsed && !isMobileOpen && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-sm"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2">
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className={cn(
              "w-full flex items-center gap-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-2xl font-medium text-sm",
              isCollapsed && !isMobileOpen ? "justify-center p-3.5" : "px-4 py-3.5"
            )}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {(!isCollapsed || isMobileOpen) && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button 
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all rounded-2xl font-medium text-sm",
              isCollapsed && !isMobileOpen ? "justify-center p-3.5" : "px-4 py-3.5"
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  profile: ProfileData;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick, profile, searchQuery, setSearchQuery }) => (
  <header className="h-20 sm:h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-40 transition-all duration-300">
    <div className="flex items-center gap-4">
      <button 
        onClick={onMenuClick}
        className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
      >
        <Menu size={24} />
      </button>
      <div className="flex flex-col">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[150px] sm:max-w-none">{title}</h1>
        <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 sm:mt-2">Learning Ecosystem • 2026</p>
      </div>
    </div>
    
    <div className="flex items-center gap-4 sm:gap-6 md:gap-10">
      <div className="relative hidden lg:block group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search for courses, topics, or notes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-14 pr-16 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-100 dark:focus:border-indigo-900 focus:ring-8 focus:ring-indigo-50/50 dark:focus:ring-indigo-900/20 rounded-[24px] text-sm w-[400px] transition-all outline-none font-semibold text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-500 shadow-sm">⌘</kbd>
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-500 shadow-sm">K</kbd>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="w-14 h-14 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-2xl relative transition-all duration-300 group">
          <Bell size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-sm"></span>
        </button>
        
        <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
        
        <div className="flex items-center gap-2 sm:gap-4 group cursor-pointer p-1 sm:p-1.5 pr-2 sm:pr-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300">
          <div className="text-right hidden md:block">
            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{profile.name}</p>
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.role}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile.name.split(' ').map(n => n[0]).join('')
            )}
          </div>
        </div>
      </div>
    </div>
  </header>
);
