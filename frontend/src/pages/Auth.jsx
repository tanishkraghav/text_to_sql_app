import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize Google Sign-In
  useEffect(() => {
    if (googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      window.google?.accounts?.id?.initialize({
        client_id: googleClientId,
        callback: handleGoogleLogin,
        ux_mode: 'popup'
      });
      setTimeout(() => {
        if (document.getElementById('google-signin-button')) {
          window.google?.accounts?.id?.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'dark', size: 'large', width: '100%' }
          );
        }
      }, 100);
    }
  }, [googleClientId]);

  const handleGoogleLogin = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.googleLogin(credentialResponse.credential);
      const { access_token } = response.data;
      const profileResponse = await authAPI.getProfile();
      const user = profileResponse.data;
      setAuth(user, access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login - use email as username
        const response = await authAPI.login(email, password);
        const { access_token } = response.data;
        const profileResponse = await authAPI.getProfile();
        const user = profileResponse.data;
        setAuth(user, access_token);
        navigate('/dashboard');
      } else {
        // Register
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const username = email.split('@')[0];
        await authAPI.register({
          email,
          username,
          password
        });
        // Auto-login after registration
        const loginResponse = await authAPI.login(username, password);
        const { access_token } = loginResponse.data;
        const profileResponse = await authAPI.getProfile();
        const user = profileResponse.data;
        setAuth(user, access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 mb-4">
              <span className="text-2xl font-bold text-white">🔐</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Text to SQL</h1>
            <p className="text-gray-300 text-sm">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-gray-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-gray-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-gray-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Google OAuth Section */}
          {googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-400/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/5 text-gray-400">Or continue with</span>
                </div>
              </div>
              <div id="google-signin-button" className="flex justify-center"></div>
            </>
          )}

          {/* Toggle auth mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 font-semibold hover:opacity-80 transition"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Demo credentials */}
          {isLogin && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-xs mb-2">
                <strong>Try these demo credentials:</strong>
              </p>
              <p className="text-yellow-200 text-xs">Username: <code className="bg-black/30 px-1">demo</code></p>
              <p className="text-yellow-200 text-xs">Password: <code className="bg-black/30 px-1">demo123</code></p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-400/30">
            <p className="text-center text-xs text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Bottom decorative element */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Secure authentication powered by industry-standard protocols
          </p>
        </div>
      </div>

      {/* Load Google Sign-In SDK */}
      <script async src="https://accounts.google.com/gsi/client" defer></script>
    </div>
  );
}

export default Auth;
