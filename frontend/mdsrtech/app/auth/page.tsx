'use client';

import { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Modal Component for Terms and Privacy
interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function PolicyModal({ isOpen, onClose, title, children }: PolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop - removed blur for better performance */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        
        {/* Content - using will-change and transform for GPU acceleration */}
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer text-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

// Terms and Conditions Content
function TermsContent() {
  return (
    <div className="space-y-6 text-gray-700">
      <p className="text-sm text-gray-500">Last updated: December 2, 2025</p>
      
      {/* Demo Disclaimer Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-semibold">⚠️ Important Notice</p>
        <p className="text-yellow-700 text-sm mt-1">
          This website is a demonstration project created for educational purposes. This is NOT a real e-commerce store. No actual purchases can be made, and no real products are for sale.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Demonstration Purpose</h3>
        <p>MDSRTech is a demonstration website created solely for educational and portfolio purposes. This website:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Does NOT sell any real products</li>
          <li>Does NOT process any real payments (uses Stripe test mode only)</li>
          <li>Is NOT affiliated with any brands, companies, or products displayed</li>
          <li>Should NOT be used to attempt real purchases</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">2. No Commercial Activity</h3>
        <p>This website does not engage in any commercial activity. All product images, names, and descriptions are used for demonstration purposes only. We do not own, sell, or distribute any of the products shown on this website.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Third-Party Trademarks</h3>
        <p>All product names, logos, and brands displayed on this website are property of their respective owners. The use of these names, logos, and brands does not imply endorsement or affiliation. They are used solely for demonstration purposes.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Test Payment System</h3>
        <p>The payment system on this website operates in Stripe&apos;s test mode. Only test card numbers will work. No real credit cards will be charged. Test card numbers are provided during checkout for demonstration purposes.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">5. User Accounts</h3>
        <p>While you can create an account on this website, please be aware:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>This is a demonstration project and may be taken offline at any time</li>
          <li>Data may be cleared periodically</li>
          <li>Do not use sensitive passwords you use elsewhere</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Limitation of Liability</h3>
        <p>This website is provided &quot;as is&quot; for demonstration purposes. The creators make no warranties about the accuracy, reliability, or availability of the website. We are not liable for any issues arising from the use of this demonstration website.</p>
      </section>
    </div>
  );
}

// Privacy Policy Content
function PrivacyContent() {
  return (
    <div className="space-y-6 text-gray-700">
      <p className="text-sm text-gray-500">Last updated: December 2, 2025</p>
      
      {/* Demo Disclaimer Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-semibold">⚠️ Important Notice</p>
        <p className="text-yellow-700 text-sm mt-1">
          This is a demonstration website for educational purposes. While we handle data responsibly, 
          this is a student project and not a production-grade e-commerce platform.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Project Context</h3>
        <p>MDSRTech is a demonstration project created for CSCI 4230U - Advanced Web Development. This privacy policy explains how data is handled in this educational context.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Information Collected</h3>
        <p>For demonstration purposes, the website may collect:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Email address and name (for account creation)</li>
          <li>Demo order information</li>
          <li>Test cart and wishlist data</li>
        </ul>
        <p className="mt-2 text-sm text-gray-500">Note: No real payment information is collected. Stripe test mode does not process real cards.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">3. How Information is Used</h3>
        <p>Information collected is used solely for:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Demonstrating e-commerce functionality</li>
          <li>Testing authentication flows</li>
          <li>Sending demo order confirmation emails</li>
          <li>Academic project evaluation</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Data Storage</h3>
        <p>Data is stored using a PostgreSQL database and is used solely for demonstration purposes. This data may be:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Cleared periodically without notice</li>
          <li>Deleted when the project is concluded</li>
          <li>Not backed up or permanently retained</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">5. No Data Selling</h3>
        <p>We do not sell, trade, or otherwise transfer your information to third parties. This is an educational project with no commercial interest.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Recommendations</h3>
        <p>As this is a demo project:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Do not use passwords you use on other important sites</li>
          <li>Use test card numbers only (provided at checkout)</li>
          <li>Do not enter real sensitive personal information</li>
        </ul>
      </section>
    </div>
  );
}

// Google Icon Component
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// GitHub Icon Component
function GithubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// Loading component for Suspense fallback
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
    </div>
  );
}

// Main auth content component that uses useSearchParams
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, loginWithGoogle, loginWithGithub, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  // Check for mode parameter in URL (login or signup)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Check for OAuth error in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth_failed') {
      setError('OAuth sign-in failed. Please try again.');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Login
        const result = await login(formData.email, formData.password);
        if (result.success) {
          router.push('/');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // Register
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsSubmitting(false);
          return;
        }
        
        // Validate password length
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long');
          setIsSubmitting(false);
          return;
        }

        const result = await register(formData.email, formData.name, formData.password);
        if (result.success) {
          router.push('/');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    await loginWithGoogle();
  };

  const handleGithubLogin = async () => {
    setError('');
    await loginWithGithub();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    // Reset form when switching modes
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
      agreePrivacy: false,
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
          MDSRTech
        </h1>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md pb-15">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Sign up to get started with MDSRTech'}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <GoogleIcon />
              <span className="font-medium text-gray-700">Continue with Google</span>
            </button>
            
            <button
              type="button"
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <GithubIcon />
              <span className="font-medium text-gray-700">Continue with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field - only for signup */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              )}
            </div>

            {/* Confirm Password field - only for signup */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                    placeholder="••••••••"
                    required={!isLogin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Terms and Privacy checkboxes - only for signup */}
            {!isLogin && (
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    required={!isLogin}
                  />
                  <label htmlFor="agreeTerms" className="ml-3 text-sm text-gray-600">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      Terms and Conditions
                    </button>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    required={!isLogin}
                  />
                  <label htmlFor="agreePrivacy" className="ml-3 text-sm text-gray-600">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>
            )}

            {/* Forgot Password - only for login */}
            {isLogin && (
              <div className="flex items-center justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          {/* Toggle between login/signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                {isLogin ? 'Sign up now' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <PolicyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
      >
        <TermsContent />
      </PolicyModal>

      {/* Privacy Policy Modal */}
      <PolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </PolicyModal>
    </div>
  );
}

// Main page component with Suspense boundary
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthContent />
    </Suspense>
  );
}
