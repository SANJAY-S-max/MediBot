import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HeartPulse, Menu, X, Globe, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Determine navigation items based on role
  const getNavLinks = () => {
    if (!user) return [{ path: '/', label: 'Home' }, { path: '/about', label: t('about') }];
    
    if (user.role === 'admin') {
      return [
        { path: '/admin', label: 'Admin Panel' },
        { path: '/settings', label: t('settings') }
      ];
    }
    
    if (user.role === 'doctor') {
      return [
        { path: '/doctor', label: 'Clinical Queue' },
        { path: '/settings', label: t('settings') }
      ];
    }

    // Default Patient
    return [
      { path: '/dashboard', label: t('dashboard') },
      { path: '/chat', label: t('assessmentChat') },
      { path: '/reports', label: t('reports') },
      { path: '/telemedicine', label: t('telemedicine') },
      { path: '/reminders', label: t('reminders') },
      { path: '/settings', label: t('settings') }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="sticky top-0 z-50 glass-panel shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={user ? (user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/dashboard') : '/'} className="flex items-center space-x-2">
              <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                <HeartPulse className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-success-700 bg-clip-text text-transparent">
                MediBot
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Controls & Language */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700"
              >
                <Globe className="h-4 w-4 text-slate-500" />
                <span>{lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'தமிழ்'}</span>
              </button>
              
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-100 py-1">
                  <button
                    onClick={() => { setLang('en'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${lang === 'en' ? 'font-semibold text-primary-600' : 'text-slate-700'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLang('hi'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${lang === 'hi' ? 'font-semibold text-primary-600' : 'text-slate-700'}`}
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => { setLang('ta'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${lang === 'ta' ? 'font-semibold text-primary-600' : 'text-slate-700'}`}
                  >
                    தமிழ்
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown or Sign In */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-danger-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
                >
                  {t('signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 pb-3 border-t border-slate-200 px-4 space-y-3">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-slate-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-slate-200 py-1 text-sm text-slate-700 font-medium focus:ring-0"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>

            {/* Profile Info */}
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded-lg text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-semibold text-white shadow-sm"
                >
                  {t('signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
