import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const Auth: React.FC = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: { full_name: name } } 
      });
      if (error) {
        setError(error.message);
      } else {
        setIsLogin(true);
        setError('Account created! Please log in.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-sans relative">
      <div className="absolute top-6 right-8">
        <LanguageSelector />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-gray-100 p-10 relative overflow-hidden"
      >
        {/* Decorative Background Element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0EA5E9]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0EA5E9]/5 rounded-full blur-3xl" />

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#0EA5E9] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20 mb-6 group hover:rotate-3 transition-transform">
            <Scale className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight mb-2">{t('headings.hero_title')}</h1>
          <p className="text-sm text-[#6B7280] font-medium uppercase tracking-widest text-center">
            {isLogin ? t('auth.welcome_back') : t('auth.join_revolution')}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center ${error.includes('created') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0EA5E9] transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    placeholder={t('auth.full_name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F3F4F6] border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0EA5E9] transition-colors" size={18} />
            <input
              type="email"
              required
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F3F4F6] border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all outline-none"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0EA5E9] transition-colors" size={18} />
            <input
              type="password"
              required
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F3F4F6] border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all outline-none"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-xs font-bold text-[#0EA5E9] hover:underline">
                {t('auth.forgot_password')}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111827] text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-[#111827]/90 transition-all active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? t('auth.enter_workspace') : t('auth.create_account')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <div className="w-full h-px bg-gray-200"></div>
          <span className="px-4 text-xs font-medium text-gray-500 uppercase">{t('auth.or_continue_with')}</span>
          <div className="w-full h-px bg-gray-200"></div>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={async credentialResponse => {
              if (credentialResponse.credential) {
                const { error } = await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: credentialResponse.credential,
                });
                if (error) setError('Google Login Failed via Supabase');
              }
            }}
            onError={() => {
              console.log('Login Failed');
              setError('Google Login Failed');
            }}
            theme="outline"
            shape="pill"
            size="large"
          />
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-[#6B7280]">
            {isLogin ? t('auth.dont_have_account') : t('auth.already_member')}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[#0EA5E9] font-bold hover:underline"
            >
              {isLogin ? t('auth.sign_up') : t('auth.log_in')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
