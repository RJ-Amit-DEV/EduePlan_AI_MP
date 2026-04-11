import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  ArrowRight, 
  BookOpen,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import studentImg from './stud.png';
import teacherImg from './teacher.png';
import parentImg from './parent.png';

interface AuthProps {
  onLogin: (role: UserRole) => void;
  onGoogleSignIn: () => void;
  initialStep?: 'landing' | 'role';
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onGoogleSignIn, initialStep = 'landing' }) => {
  const [step, setStep] = useState<'landing' | 'role'>(initialStep);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const roles = [
    { 
      id: 'student' as UserRole, 
      title: 'Student', 
      desc: 'Access your AI-generated study plans, track your homework, and master new subjects with personalized tutors.', 
      icon: GraduationCap,
      image: studentImg,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    { 
      id: 'teacher' as UserRole, 
      title: 'Teacher', 
      desc: 'Manage your classroom, automate lesson planning, and gain deep insights into student performance metrics.', 
      icon: Users,
      image: teacherImg,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    { 
      id: 'parent' as UserRole, 
      title: 'Parent', 
      desc: "Stay informed with real-time progress reports, school updates, and AI-driven recommendations for your child's success.", 
      icon: Users,
      image: parentImg,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
  ];

  const handleRoleSelect = async (role: UserRole) => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await onLogin(role);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await onGoogleSignIn();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">EduPlan AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline">Already have an account?</span>
          <button 
            onClick={() => setStep('role')}
            disabled={isAuthenticating}
            className={cn(
              "px-6 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              isAuthenticating && "animate-pulse"
            )}
          >
            {isAuthenticating ? 'Signing in...' : 'Login'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-16 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 'landing' ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-8">
                <Sparkles size={14} />
                AI-Powered Education
              </div>
              <h2 className="text-6xl sm:text-7xl font-black text-slate-900 mb-8 tracking-tight max-w-4xl leading-[1.1]">
                Revolutionize your <span className="text-blue-500">learning journey</span> with AI
              </h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mb-12">
                EduPlan AI provides personalized study schedules, real-time doubt solving, and deep performance insights for students, teachers, and parents.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => setStep('role')}
                  disabled={isAuthenticating}
                  className="px-10 py-5 bg-blue-500 text-white font-black rounded-2xl text-lg shadow-2xl shadow-blue-200 hover:bg-blue-600 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Started for Free
                  <ArrowRight size={20} />
                </button>
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  className={cn(
                    "px-10 py-5 bg-white text-slate-900 font-black rounded-2xl text-lg border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed",
                    isAuthenticating && "animate-pulse"
                  )}
                >
                  {isAuthenticating ? 'Signing in...' : 'Sign In with Google'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="text-center mb-16 max-w-2xl mx-auto">
                <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">
                  Choose your role
                </h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                  To personalize your EduPlan AI experience, please let us know who you are.
                </p>
              </div>

              {/* Role Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
                {roles.map((role, idx) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    {/* Card Image */}
                    <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                      <img 
                        src={role.image} 
                        alt={role.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", role.iconBg, role.iconColor)}>
                          <role.icon size={20} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">{role.title}</h3>
                      </div>
                      
                      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-1">
                        {role.desc}
                      </p>

                      <button
                        onClick={() => handleRoleSelect(role.id)}
                        disabled={isAuthenticating}
                        className={cn(
                          "w-full py-3.5 bg-slate-50 text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed",
                          isAuthenticating && "animate-pulse"
                        )}
                      >
                        {isAuthenticating ? 'Processing...' : `I am a ${role.title}`}
                        {!isAuthenticating && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => setStep('landing')}
                className="mx-auto block text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
              >
                ← Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Support Section */}
        <div className="w-full pt-12 border-t border-slate-100 flex flex-col items-center">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-slate-400" />
              <span>Not sure which one to choose?</span>
            </div>
            <button className="text-blue-500 font-bold hover:underline">Contact our support team</button>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <button className="hover:text-slate-900 transition-colors">Read our FAQ</button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-50 text-center">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          © 2026 EduPlan AI. Empowering education through artificial intelligence.
        </p>
      </footer>
    </div>
  );
};
