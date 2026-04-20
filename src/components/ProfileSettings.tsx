import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Book, GraduationCap, Camera, Save, CheckCircle, Info, Briefcase, Building, Users, Heart, Phone, Trash2 } from 'lucide-react';import { ProfileData } from '../types';
import { cn } from '../lib/utils';

interface ProfileSettingsProps {
  profile: ProfileData;
  onUpdate: (data: Partial<ProfileData>) => void;
  onResetAccount?: () => void; 
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onUpdate, onResetAccount }) => {  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      onUpdate(formData);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size before processing (limit to 5MB for processing)
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please select an image smaller than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Maximum dimensions for the avatar
          const MAX_SIZE = 400;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.7 quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setFormData(prev => ({ ...prev, avatar: compressedDataUrl }));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 sm:p-10 max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
              <img 
                src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <label className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <Camera size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white">{formData.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg capitalize">{formData.role} Profile</p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                {formData.college || 'EduPlan Academy'}
              </span>
              {formData.role === 'student' && formData.course && (
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  {formData.course}
                </span>
              )}
              {formData.role === 'teacher' && formData.department && (
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  {formData.department}
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {formData.role === 'student' && (
              <>
                <div className="space-y-2">
                  
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Course / Branch</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.course || ''}
                      onChange={e => setFormData(prev => ({ ...prev, course: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Semester</label>
                  <div className="relative">
                    <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.semester || ''}
                      onChange={e => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'teacher' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.department || ''}
                      onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.designation || ''}
                      onChange={e => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Experience (Years)</label>
                  <div className="relative">
                    <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.experience || ''}
                      onChange={e => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'parent' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Child's Name</label>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Required for live results</span>
                  </div>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.childName || ''}
                      onChange={e => setFormData(prev => ({ ...prev, childName: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                      placeholder="Enter child's full name exactly"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 ml-2 font-medium">Link by child's name to see their live performance and teacher's marks.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Relationship</label>
                  <div className="relative">
                    <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.relationship || ''}
                      onChange={e => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.contact || ''}
                      onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">About Me</label>
            <div className="relative">
              <Info className="absolute left-4 top-4 text-slate-400" size={18} />
              <textarea 
                value={formData.about}
                onChange={e => setFormData(prev => ({ ...prev, about: e.target.value }))}
                rows={4}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white resize-none"
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </div>

<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
            <div className={cn(
              "flex items-center gap-2 text-emerald-600 font-bold transition-opacity duration-300",
              showSuccess ? "opacity-100" : "opacity-0"
            )}>
              <CheckCircle size={20} />
              Profile updated successfully!
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {onResetAccount && (
                <button 
                  type="button"
                  onClick={onResetAccount}
                  className="px-8 py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all border border-rose-200"
                >
                  <Trash2 size={20} />
                  Reset Account
                </button>
              )}
              
              <button 
                type="submit"
                disabled={isSaving}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
