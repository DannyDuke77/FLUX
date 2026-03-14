import { Lock, AlertTriangle, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

const UnauthorizedPage = () => {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 flex items-center justify-center">
            <div className="relative w-full max-w-xl">
                {/* Animated background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-3xl animate-pulse" />
                
                {/* Main card */}
                <div className="relative bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
                    {/* Top accent bar */}
                    <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500" />
                    
                    <div className="p-8 text-center">
                        {/* Lock Icon with animation */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl rotate-12 transform hover:rotate-0 transition-transform duration-500 flex items-center justify-center shadow-2xl shadow-red-500/30">
                                <Lock className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Error Code */}
                        <div className="mb-4">
                            <span className="text-xs font-mono bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20">
                                <AlertTriangle className="w-4 h-4 inline-block mr-1" /> ACCESS DENIED
                            </span>
                        </div>

                        {/* Main Message */}
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Unauthorized Access
                        </h1>
                        
                        <p className="text-gray-400 text-sm md:text-base mb-6 leading-relaxed">
                            You don't have administrator privileges to view this page. 
                            Please contact your system administrator if you believe this is a mistake.
                        </p>

                        {/* Requirements Card */}
                        <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 mb-6 text-left">
                            <div className="flex items-center gap-2 mb-3 text-yellow-500">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Required Access</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <span className="text-gray-400">Required:</span>
                                </div>
                                <span className="text-emerald-400 font-mono text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                    Administrator
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/tickets"
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl transition-all active:scale-95 border border-gray-600/50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Go Back</span>
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-gray-900/50 border-t border-gray-700/50">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            This action has been logged for security purposes
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default UnauthorizedPage;