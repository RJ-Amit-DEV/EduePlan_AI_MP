import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Bell, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  MoreVertical,
  Search,
  Filter,
  Download,
  Calendar,
  Heart,
  Activity,
  Award,
  Save,
  BookOpen,
  Loader2,
  CheckCircle,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { STUDENT_PERFORMANCE } from '../constants';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, setDoc, getDocs, addDoc, serverTimestamp, writeBatch, limit } from 'firebase/firestore';

import { Notice } from './NoticeBoard';

interface Student {
  id: string;
  rollNo: string;
  name: string;
  sem4: string;
  ia1: number;
  ia2: number;
  attendance: number;
  quizPass: number;
}

const generateInitialStudents = () => {
  const students = [];
  const names = [
    "Aarav", "Aditi", "Advait", "Akash", "Ananya", "Arjun", "Avni", "Bhavya", "Chaitanya", "Deepak",
    "Esha", "Gaurav", "Ishani", "Kabir", "Kavya", "Manish", "Meera", "Nikhil", "Pooja", "Pranav",
    "Riya", "Rohan", "Saanvi", "Sameer", "Shreya", "Tushar", "Vanya", "Varun", "Vihaan", "Zoya"
  ];
  const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Joshi", "Patil", "Deshmukh", "Kulkarni", "Iyer", "Nair"];

  for (let i = 1; i <= 120; i++) {
    const firstName = names[Math.floor(Math.random() * names.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      students.push({
        rollNo: `INFTT-1-${i.toString().padStart(3, '0')}`,
        name: `${firstName} ${lastName}`,
        sem4: (Math.random() * (10 - 6) + 6).toFixed(2),
        ia1: Math.floor(Math.random() * 21),
        ia2: Math.floor(Math.random() * 21),
        attendance: Math.floor(Math.random() * 41) + 60, // 60-100%
        quizPass: Math.floor(Math.random() * 31) + 70   // 70-100%
      });
  }
  return students;
};

const classEngagementData = [
  { name: '8 AM', value: 45 },
  { name: '10 AM', value: 85 },
  { name: '12 PM', value: 75 },
  { name: '2 PM', value: 90 },
  { name: '4 PM', value: 65 },
  { name: '6 PM', value: 40 },
];

const performanceData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 82 },
  { name: 'Sat', score: 90 },
  { name: 'Sun', score: 88 },
];

const gradeDistribution = [
  { name: 'A+', value: 15, color: '#10B981' },
  { name: 'A', value: 35, color: '#4F46E5' },
  { name: 'B', value: 30, color: '#8B5CF6' },
  { name: 'C', value: 15, color: '#F59E0B' },
  { name: 'D', value: 5, color: '#F43F5E' },
];

interface TeacherDashboardProps {
  teacherName?: string;
  searchQuery?: string;
  notices?: Notice[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacherName = 'Prof. Amit Jadhav', searchQuery = '', notices = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState({ name: '', rollNo: '', sem4: '', ia1: 0, ia2: 0, attendance: 0, quizPass: 0 });

  // Sync internal searchTerm with global searchQuery
  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const seedData = async () => {
      const hasSeeded = localStorage.getItem('students_seeded');
      if (hasSeeded) return;

      try {
        const snapshot = await getDocs(query(collection(db, 'students'), limit(1)));
        if (snapshot.empty) {
          localStorage.setItem('students_seeded', 'true');
          const initialData = generateInitialStudents();
          const batch = writeBatch(db);
          initialData.forEach((s) => {
            const newDocRef = doc(collection(db, 'students'));
            batch.set(newDocRef, s);
          });
          await batch.commit();
        } else {
          localStorage.setItem('students_seeded', 'true');
        }
      } catch (err) {
        console.error("Error seeding students:", err);
      }
    };

    seedData();

    const q = query(collection(db, 'students'), orderBy('rollNo', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentData);
    }, (error) => {
      console.error("Firestore Error (students):", error);
      if (error.code === 'permission-denied') {
        setStudents([]);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStudent = async (id: string) => {
    try {
      await updateDoc(doc(db, 'students', id), {
        name: editStudent.name,
        rollNo: editStudent.rollNo,
        sem4: editStudent.sem4,
        ia1: editStudent.ia1,
        ia2: editStudent.ia2,
        attendance: editStudent.attendance,
        quizPass: editStudent.quizPass
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating student record:", error);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "INFTT-1 Students");
    XLSX.writeFile(workbook, "INFTT-1_Student_List.xlsx");
  };

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'parents' | 'specific'>('all');
  const [targetRollNo, setTargetRollNo] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const handlePostNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'notices'), {
        title: noticeTitle,
        content: noticeContent,
        date: serverTimestamp(),
        author: teacherName,
        type: 'Academic',
        attachments: [],
        targetAudience,
        targetRollNo: targetAudience === 'specific' ? targetRollNo : null
      });
      setNoticeTitle('');
      setNoticeContent('');
      setTargetRollNo('');
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (error) {
      console.error("Error posting notice:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
            <Users size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight">My Class: INFTT-1</h2>
            <p className="text-slate-500 font-medium text-lg mt-1">Class Teacher: {teacherName} • 120 Students Enrolled</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white font-display font-black rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
          >
            <Download size={20} />
            GET XL FILE
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg. Sem 4', value: (students.reduce((acc, s) => acc + parseFloat(s.sem4), 0) / (students.length || 1)).toFixed(2), icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Avg. IA1', value: (students.reduce((acc, s) => acc + s.ia1, 0) / (students.length || 1)).toFixed(1), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg. IA2', value: (students.reduce((acc, s) => acc + s.ia2, 0) / (students.length || 1)).toFixed(1), icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pass % (IA1)', value: `${((students.filter(s => s.ia1 >= 8).length / (students.length || 1)) * 100).toFixed(0)}%`, icon: Award, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-6"
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Search and Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="Search by name or roll number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 focus:border-indigo-100 focus:ring-8 focus:ring-indigo-50/50 rounded-[32px] text-lg font-semibold text-slate-700 outline-none transition-all shadow-sm"
              />
            </div>
            <button className="p-5 bg-white border-2 border-slate-100 text-slate-400 rounded-[24px] hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
              <Filter size={24} />
            </button>
          </div>

          <section className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Roll No</th>
                    <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Full Name</th>
                    <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Sem 4</th>
                    <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Attendance (%)</th>
                    <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Quiz Pass (%)</th>
                    <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">IA1 (20)</th>
                    <th className="px-10 py-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">IA2 (20)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        {editingId === student.id ? (
                          <input 
                            type="text" 
                            value={editStudent.rollNo}
                            onChange={(e) => setEditStudent({ ...editStudent, rollNo: e.target.value })}
                            className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:border-indigo-600"
                          />
                        ) : (
                          <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                            {student.rollNo}
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        {editingId === student.id ? (
                          <input 
                            type="text" 
                            value={editStudent.name}
                            onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:border-indigo-600"
                          />
                        ) : (
                          <p className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        {editingId === student.id ? (
                          <input 
                            type="text" 
                            value={editStudent.sem4}
                            onChange={(e) => setEditStudent({ ...editStudent, sem4: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:border-indigo-600"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-700">{student.sem4}</span>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        {editingId === student.id ? (
                          <input 
                            type="number" 
                            value={editStudent.attendance}
                            onChange={(e) => setEditStudent({ ...editStudent, attendance: parseInt(e.target.value) || 0 })}
                            className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:border-indigo-600"
                            min="0"
                            max="100"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                             <span className={cn(
                                "text-sm font-black",
                                student.attendance >= 75 ? "text-emerald-600" : "text-rose-600"
                             )}>{student.attendance}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                           <span className={cn(
                              "text-sm font-black text-slate-600"
                           )}>{student.quizPass || 0}%</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        {editingId === student.id ? (
                          <input 
                            type="number" 
                            value={editStudent.ia1}
                            onChange={(e) => setEditStudent({ ...editStudent, ia1: parseInt(e.target.value) || 0 })}
                            className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:border-indigo-600"
                            min="0"
                            max="20"
                          />
                        ) : (
                          <span className={cn(
                            "text-base font-black",
                            student.ia1 >= 15 ? "text-emerald-600" : student.ia1 >= 10 ? "text-indigo-600" : "text-rose-600"
                          )}>
                            {student.ia1}
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center justify-between gap-4">
                          {editingId === student.id ? (
                            <>
                              <input 
                                type="number" 
                                value={editStudent.ia2}
                                onChange={(e) => setEditStudent({ ...editStudent, ia2: parseInt(e.target.value) || 0 })}
                                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:border-indigo-600"
                                min="0"
                                max="20"
                              />
                              <button 
                                onClick={() => handleUpdateStudent(student.id)}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                              >
                                <Save size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className={cn(
                                "text-base font-black",
                                student.ia2 >= 15 ? "text-emerald-600" : student.ia2 >= 10 ? "text-indigo-600" : "text-rose-600"
                              )}>
                                {student.ia2}
                              </span>
                              <button 
                                onClick={() => {
                                  setEditingId(student.id);
                                  setEditStudent({ 
                                    name: student.name, 
                                    rollNo: student.rollNo, 
                                    sem4: student.sem4, 
                                    ia1: student.ia1, 
                                    ia2: student.ia2,
                                    attendance: student.attendance || 0,
                                    quizPass: student.quizPass || 0
                                  });
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <MoreVertical size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={40} className="text-slate-300" />
                </div>
                <p className="text-xl font-bold text-slate-400">No students found matching your search.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Charts and Insights */}
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-white rounded-[48px] border border-slate-200 p-10 shadow-sm min-h-[450px]">
            <h3 className="text-2xl font-display font-black text-slate-900 mb-8 tracking-tight">Grade Distribution</h3>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Excellent (15+)', value: students.filter(s => s.ia1 >= 15).length, color: '#10B981' },
                      { name: 'Good (10-14)', value: students.filter(s => s.ia1 >= 10 && s.ia1 < 15).length, color: '#4F46E5' },
                      { name: 'Average (8-9)', value: students.filter(s => s.ia1 >= 8 && s.ia1 < 10).length, color: '#F59E0B' },
                      { name: 'Below Avg (<8)', value: students.filter(s => s.ia1 < 8).length, color: '#F43F5E' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#4F46E5', '#F59E0B', '#F43F5E'][index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { label: 'Excellent', color: 'bg-emerald-500' },
                { label: 'Good', color: 'bg-indigo-500' },
                { label: 'Average', color: 'bg-amber-500' },
                { label: 'Below Avg', color: 'bg-rose-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", item.color)} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[48px] border border-slate-200 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Quick Notice</h3>
              <Bell className={cn("transition-colors", postSuccess ? "text-emerald-500" : "text-indigo-600")} size={24} />
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="Notice Title..." 
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-100 transition-all"
              />
              
              <div className="grid grid-cols-1 gap-4">
                <select 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Everyone</option>
                  <option value="students">Students Only</option>
                  <option value="parents">All Parents</option>
                  <option value="specific">Specific Parent (Roll No)</option>
                </select>

                {targetAudience === 'specific' && (
                  <motion.input 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    type="text" 
                    value={targetRollNo}
                    onChange={(e) => setTargetRollNo(e.target.value)}
                    placeholder="Enter Roll No..."
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl font-bold text-indigo-600 outline-none transition-all"
                  />
                )}
              </div>

              <textarea 
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="Type your announcement here..." 
                rows={3}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-600 outline-none focus:border-indigo-100 transition-all resize-none"
              ></textarea>
              <button 
                onClick={handlePostNotice}
                disabled={isPosting || !noticeTitle.trim() || !noticeContent.trim()}
                className={cn(
                  "w-full py-4 text-white font-display font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2",
                  postSuccess 
                    ? "bg-emerald-500 shadow-emerald-100" 
                    : "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
                )}
              >
                {isPosting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : postSuccess ? (
                  <>
                    <CheckCircle size={20} />
                    POSTED SUCCESSFULLY
                  </>
                ) : (
                  "POST ANNOUNCEMENT"
                )}
              </button>
            </div>

            {/* Recent Broadcasts History */}
            <div className="mt-10 pt-10 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recent Broadcasts</h4>
                <History size={16} className="text-slate-300" />
              </div>
              <div className="space-y-4">
                {notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black text-slate-900 truncate pr-4">{notice.title}</p>
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        {notice.targetAudience === 'specific' ? `Roll ${notice.targetRollNo}` : notice.targetAudience || 'All'}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 line-clamp-1">{notice.content}</p>
                  </div>
                ))}
                {notices.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-400 text-center py-4 italic">No recent broadcasts found.</p>
                )}
              </div>
            </div>
          </section>

          {/* <section className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl shadow-slate-900/20">
            <h3 className="text-2xl font-display font-black mb-8 flex items-center gap-4">
              <TrendingUp className="text-indigo-400" size={28} />
              AI Insights
            </h3>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
                <p className="text-sm font-medium leading-relaxed text-slate-300">
                  <span className="text-indigo-400 font-black">Performance Alert:</span> 12 students are consistently scoring below average in IA1. Consider scheduling a remedial session.
                </p>
              </div>
              <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
                <p className="text-sm font-medium leading-relaxed text-slate-300">
                  <span className="text-emerald-400 font-black">Success Trend:</span> Class average has improved by 8% compared to the previous semester.
                </p>
              </div>
            </div>
            <button className="w-full mt-8 py-4 bg-indigo-600 text-white font-display font-black rounded-2xl hover:bg-indigo-700 transition-all">
              GENERATE AI REPORT
            </button>
          </section> */}
        </div>
      </div>
    </div>
  );
};

import { ConsistencyData } from '../types';

export const ParentDashboard: React.FC<{ 
  childData: any,
  activeTab?: string, 
  searchQuery?: string 
}> = ({ childData, activeTab = 'performance', searchQuery = '' }) => {
  if (!childData) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
        <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-2">Syncing Child Data...</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Please ensure your child's name in your profile matches their name in the college records.
        </p>
      </div>
    );
  }

  const displayChild = childData;
  
  // Safe access to marks
  const ia1 = displayChild.ia1 ?? 0;
  const ia2 = displayChild.ia2 ?? 0;
  const sem4 = displayChild.sem4 ?? 0;
  const attendanceVal = displayChild.attendance ?? 0;
  const quizPassVal = displayChild.quizPass ?? 0;

  // Consistency Score Calculation: Avg of Attendance, Quiz Pass, and IA Performance
  // IA Performance is (ia1+ia2)/40 * 100
  const iaPercent = Math.min(((ia1 + ia2) / 40) * 100, 100);
  const consistencyScore = Math.round((attendanceVal + quizPassVal + iaPercent) / 3) || 0;

  const consistency = {
    score: consistencyScore,
    attendance: attendanceVal,
    quizPassRate: quizPassVal
  };

  const blogs = [
    {
      title: "Understanding Student Mental Health",
      category: "Mental Health",
      desc: "How to identify signs of academic stress and support your child through exams.",
      image: "https://picsum.photos/seed/mental/400/200"
    },
    {
      title: "Effective Parenting in the Digital Age",
      category: "Parenting",
      desc: "Balancing screen time and study time for better academic focus.",
      image: "https://picsum.photos/seed/parent/400/200"
    },
    {
      title: "The Power of Positive Reinforcement",
      category: "Parenting",
      desc: "Why celebrating small wins leads to bigger academic success.",
      image: "https://picsum.photos/seed/success/400/200"
    }
  ];

  const faculty = [
    { name: "Prof. Amit Jadhav", role: "Class Teacher", email: "amit.j@college.edu", phone: "+91 98765 43210" },
    { name: "Dr. Sarah Smith", role: "HOD - IT", email: "sarah.s@college.edu", phone: "+91 98765 43211" },
    { name: "Prof. Rahul Verma", role: "Maths Faculty", email: "rahul.v@college.edu", phone: "+91 98765 43212" }
  ];

  if (activeTab === 'college-info') {
    return (
      <div className="p-10 space-y-10 max-w-[1200px] mx-auto">
        <div className="bg-white rounded-[48px] border border-slate-200 p-10 shadow-sm">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <BookOpen size={32} />
            </div>
            <h2 className="text-3xl font-display font-black text-slate-900">College & Course Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">College Name</p>
                <p className="text-xl font-bold text-slate-900">{displayChild.college}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Course</p>
                <p className="text-xl font-bold text-slate-900">{displayChild.course}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Batch / Division</p>
                <p className="text-xl font-bold text-slate-900">{displayChild.batch}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Semester</p>
                <p className="text-xl font-bold text-slate-900">{displayChild.semester}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl">
          <h3 className="text-2xl font-display font-black mb-8">Academic Support</h3>
          <p className="text-slate-400 mb-10">If you have any queries regarding the curriculum or college policies, please reach out to the administration.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Office Hours</p>
              <p className="font-bold">Mon - Fri: 9 AM - 5 PM</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Admin Email</p>
              <p className="font-bold">admin@college.edu</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Helpline</p>
              <p className="font-bold">022-1234-5678</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'blogs') {
    const filteredBlogs = blogs.filter(blog => 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="p-10 space-y-10 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map((blog, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover" />
              <div className="p-8">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full border border-indigo-100">
                  {blog.category}
                </span>
                <h4 className="text-xl font-display font-black text-slate-900 mt-4 mb-3">{blog.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{blog.desc}</p>
                <button className="mt-6 text-indigo-600 font-black text-sm hover:underline">Read More →</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'contact') {
    const filteredFaculty = faculty.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="p-10 space-y-10 max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 gap-6">
          {filteredFaculty.map((f, i) => (
            <div key={i} className="bg-white rounded-[32px] border border-slate-200 p-8 flex items-center justify-between shadow-sm hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <Users size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-display font-black text-slate-900">{f.name}</h4>
                  <p className="text-sm font-bold text-indigo-600">{f.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{f.email}</p>
                <p className="text-sm text-slate-500">{f.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const childFirstName = displayChild?.name && displayChild?.name !== "No child linked" 
    ? displayChild.name.split(' ')[0] 
    : "Your child";

  return (
    <div className="p-10 space-y-10 max-w-[1200px] mx-auto">
      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Consistency Ring */}
        <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-100 dark:border-slate-800 p-12 shadow-2xl shadow-indigo-500/5 flex flex-col items-center justify-center text-center min-h-[550px]">
          <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-10 tracking-tight">Consistency Score</h3>
          
          <div className="relative w-72 h-72 mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: consistency.score },
                    { value: 100 - consistency.score }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={120}
                  startAngle={90}
                  endAngle={450}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#4F46E5" />
                  <Cell fill="#F1F5F9" className="dark:fill-slate-800" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{consistency.score}%</span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] mt-2",
                consistency.score >= 80 ? "text-emerald-600" : consistency.score >= 60 ? "text-amber-600" : "text-rose-600"
              )}>
                {consistency.score >= 80 ? 'EXCELLENT' : consistency.score >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full max-w-sm mb-10">
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{consistency.attendance}%</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quiz Pass</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{consistency.quizPassRate}%</p>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
            {consistency.score >= 80 
              ? `${childFirstName} has been highly consistent in their learning journey this semester.`
              : `${childFirstName} is showing steady progress but can improve in some areas.`}
          </p>
        </div>

        {/* Marks Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-display font-black text-slate-900">Unit Test Marks (UT)</h4>
              <Award className="text-amber-500" size={24} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">IA 1</p>
                <p className="text-3xl font-black text-slate-900">{ia1}<span className="text-sm text-slate-400">/20</span></p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">IA 2</p>
                <p className="text-3xl font-black text-slate-900">{ia2}<span className="text-sm text-slate-400">/20</span></p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-display font-black">Semester Performance</h4>
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/10">
                <span className="text-3xl font-black text-white">{sem4}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400">Current Sem 4 Pointer</p>
                <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mt-1">Roll No: {displayChild.rollNo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
