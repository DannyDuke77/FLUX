'use client';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleLogin } from "@/app/lib/actions";
import apiService from "@/app/services/apiService";
import CustomButton from "@/app/components/ui/CustomButton";
import { jwtDecode } from "jwt-decode";
import { Mail, Lock, AlertCircle } from "lucide-react";

const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * LoginForm contains the logic and hooks that require a client-side context.
 * It is wrapped in Suspense in the main page component to prevent build errors.
 */
function LoginForm() {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const searchParams = useSearchParams();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const submitLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors([]);

        const formData = { username: email, email, password };

        try {
            const response = await apiService.post('/api/auth/login/', formData);
            
            if (!response?.access || !response?.refresh) {
                const messages = response?.non_field_errors || response?.detail || response?.error || ['Invalid login response'];
                setErrors(Array.isArray(messages) ? messages : [messages]);
                return;
            }

            // Successfully retrieved search params via the hook
            const nextUrl = searchParams.get('next') || '/tickets';
            const decoded: any = jwtDecode(response.access);
            const userId = decoded.user_id ?? decoded.sub;

            await handleLogin(userId, response.access, response.refresh);
            router.push(nextUrl);

        } catch (error: any) {
            if (DEBUG) console.error('Login error:', error);
            setErrors(['Network error or server unavailable']);
        } finally {
            setLoading(false);
        }
    };

    const inputContainerStyle = "relative group";
    const inputStyle = `w-full px-10 py-3.5 bg-gray-900 border-2 border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 
                        focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-gray-800 
                        transition-all duration-300 ease-out hover:border-gray-600 hover:bg-gray-850`;
    const iconStyle = "absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 peer-focus:text-blue-500 transition-colors duration-300";

    return (
        <form onSubmit={submitLogin} className="space-y-6">
            <div className="space-y-2">
                <div className={inputContainerStyle}>
                    <Mail className={`${iconStyle} w-5 h-5`} />
                    <input 
                        onChange={(e) => setEmail(e.target.value)}
                        type="email" 
                        name="email"
                        id="email"
                        placeholder="you@example.com"
                        value={email}
                        required
                        className={`${inputStyle} peer`}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className={inputContainerStyle}>
                    <Lock className={`${iconStyle} w-5 h-5`} />
                    <input 
                        onChange={(e) => setPassword(e.target.value)}
                        type="password" 
                        name="password"
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        required
                        className={`${inputStyle} peer`}
                        disabled={loading}
                    />
                </div>
            </div>

            {errors.length > 0 && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium mb-1">Unable to sign in</p>
                            <ul className="space-y-1.5">
                                {errors.map((error, index) => (
                                    <li key={`error_${index}`} className="text-sm flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">•</span>
                                        <span>{error}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4">
                <CustomButton 
                    label="Sign In"
                    loading={loading}
                    className={`w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold 
                        rounded-xl hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] 
                        transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20
                        disabled:opacity-70 disabled:cursor-not-allowed`}
                />
            </div>
        </form>
    );
}

/**
 * Main Page Component. 
 * This remains the default export for Next.js routing.
 */
export default function LoginPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 flex items-center justify-center">
            <div className="w-full mt-20 md:mt-0 max-w-[480px] bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 p-8 md:p-10 relative">
                
                {/* Branding/Header */}
                <div className="text-center mb-10">
                    <div className="items-center space-x-1 text-2xl md:text-4xl font-black tracking-tighter mb-4">
                        <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">F</span>
                        <span className="text-cyan-400 text-sm md:text-xl">.</span>
                        <span className="text-white/90">L</span>
                        <span className="text-cyan-400 text-sm md:text-xl">.</span>
                        <span className="text-white/80">U</span>
                        <span className="text-cyan-400 text-sm md:text-xl">.</span>
                        <span className="text-white/70">X</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 mt-3 text-sm md:text-base">
                        Sign in to continue to your account
                    </p>
                </div>

                {/* CRITICAL FIX: The Suspense boundary allows useSearchParams 
                   to be used without crashing the static build process.
                */}
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center space-y-4 py-10">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">Loading security modules...</p>
                    </div>
                }>
                    <LoginForm />
                </Suspense>

                <div className="pt-6 mt-6 border-t border-gray-700/50">
                    <p className="text-center text-gray-400 text-sm">
                        Don't have an account? Contact your administrator.
                    </p>
                </div>

                {/* Decorative Background Glows */}
                <div className="absolute -z-10 top-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -z-10 bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>
        </main>
    );
}