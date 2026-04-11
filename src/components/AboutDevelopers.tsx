import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Mail, GraduationCap, Code2, Heart, Briefcase } from 'lucide-react';
import krishnaImg from './krishna.png';
import kunalImg from './kunal.png';
import rushabhImg from './rushabh.png';
import AmitImg from './Amit.png';

const DEVELOPERS = [
  {
    name: "Amit Jadhav",
    role: "Developer",
    academics: "B.E in IT",
    experience: "Full Stack Web Development, AI enthusiast",
    image: AmitImg,
    github: "#",
    linkedin: "#"
  },
  {
    name: "Krishna Gosavi",
    role: "UI/UX Designer",
    academics: "B.E in IT",
    experience: "Frontend Architecture, Design Systems",
    image: krishnaImg,
    github: "#",
    linkedin: "#"
  },
  {
    name: "Rushabh Hirave",
    role: "Backend Engineer",
    academics: "B.E in IT",
    experience: "Database Management, Cloud Infrastructure",
    image: rushabhImg,
    github: "#",
    linkedin: "#"
  },
  {
    name: "Kunal Gupta",
    role: "AI Specialist",
    academics: "B.E in IT",
    experience: "Machine Learning, Natural Language Processing",
    image: kunalImg,
    github: "#",
    linkedin: "#"
  }
];

export const AboutDevelopers: React.FC = () => {
  return (
    <div className="p-4 sm:p-10 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold uppercase tracking-widest"
        >
          <Code2 size={16} />
          The Team Behind EduPlan AI
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight"
        >
          Meet Our <span className="text-indigo-600 dark:text-indigo-400">Developers</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium"
        >
          A group of passionate students dedicated to revolutionizing the learning experience through artificial intelligence.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {DEVELOPERS.map((dev, index) => (
          <motion.div
            key={dev.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            whileHover={{ y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="relative mb-6">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 group-hover:border-indigo-600 transition-colors">
                <img src={dev.image} alt={dev.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <a href={dev.github} className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
                  <Github size={16} />
                </a>
                <a href={dev.linkedin} className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
                  <Linkedin size={16} />
                </a>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div>
                <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">{dev.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">{dev.role}</p>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academics</p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{dev.academics}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{dev.experience}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-indigo-600 rounded-[40px] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">
            <Heart size={14} className="text-rose-400 fill-rose-400" />
            Our Mission
          </div>
          <h3 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
            "Made for <span className="text-indigo-200">Students</span>, by <span className="text-indigo-200">Students</span>"
          </h3>
          <p className="text-indigo-100 max-w-2xl mx-auto text-lg font-medium">
            We understand the challenges of modern education because we live them every day. EduPlan AI is our contribution to making learning more accessible, personalized, and efficient for everyone.
          </p>
          <div className="pt-4">
            <button className="px-8 py-4 bg-white text-indigo-600 font-display font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl">
              CONTACT THE TEAM
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
