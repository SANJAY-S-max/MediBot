import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Save, User as UserIcon, Globe, Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [medicalHistory, setMedicalHistory] = useState(user?.medical_history || '');
  
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    
    const payload = {
      name,
      phone,
      age: parseInt(age) || 0,
      gender,
      medical_history: medicalHistory
    };

    const result = await updateProfile(payload);
    if (result.success) {
      setSuccess('Profile settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[85vh] slide-up">
      
      <div className="flex items-center space-x-2 mb-6">
        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">{t('settings')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Settings categories (Col 4) */}
        <div className="md:col-span-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="p-3 bg-primary-50 text-primary-700 font-bold rounded-xl text-xs flex items-center space-x-2">
            <UserIcon className="h-4 w-4" />
            <span>Profile Information</span>
          </div>
          <div className="p-3 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
            <Globe className="h-4 w-4" />
            <span>Language: {lang.toUpperCase()}</span>
          </div>
          <div className="p-3 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
            <Shield className="h-4 w-4" />
            <span>Privacy & Security</span>
          </div>
        </div>

        {/* Configuration forms (Col 8) */}
        <div className="md:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800 text-base">Edit Profile</h2>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Language Switcher */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase flex items-center space-x-1">
                <Globe className="h-4 w-4 text-slate-400" />
                <span>{t('languageSwitcher')} Preferences</span>
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="en">English (US/UK)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Medical History & Pre-existing Conditions</label>
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="4"
                placeholder="List chronic illnesses, drug allergies, surgeries..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center space-x-1.5 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Profile Modifications</span>
            </button>
          </form>
        </div>

      </div>
      
    </div>
  );
};

export default Settings;
