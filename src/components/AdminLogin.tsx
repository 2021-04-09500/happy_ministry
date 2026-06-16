import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  tx: Record<string, string>;
  onSuccess?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AdminLogin({ lang: _lang, tx, onSuccess }: Props) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const result = await signIn(email, password);

    if (result.error) {
      setError(tx.error || 'Invalid email or password');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess?.();
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2C2C2C] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#F5A623] p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-white" size={28} />
              </div>

              <h1 className="text-2xl font-bold text-white">{tx.title}</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  {tx.email}
                </label>

                <div className="relative">
                  <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]"
                      size={18}
                  />

                  <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={tx.emailPlaceholder}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  {tx.password}
                </label>

                <div className="relative">
                  <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]"
                      size={18}
                  />

                  <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tx.passwordPlaceholder}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all"
                  />

                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F5A623] hover:bg-[#E8920A] disabled:bg-[#F5A623]/60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {loading ? tx.signingIn : tx.signIn}
              </button>

              <p className="text-center text-xs text-[#999] pt-2">
                Admin access only
              </p>
            </form>
          </div>
        </div>
      </div>
  );
}