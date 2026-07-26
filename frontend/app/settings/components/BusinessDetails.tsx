"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Mail, Phone, MapPin, Landmark, Save, Loader2, Building2, X, CheckCircle2, AlertCircle } from "lucide-react";
import apiService from "@/app/services/apiService";
import { UserType } from "@/app/hooks/useReportsModal";

const BusinessDetails = ({ user }: { user: any }) => {
    const [form, setForm] = useState({ 
        name: "", 
        email: "", 
        phone_number: "" 
    });
    const [initialForm, setInitialForm] = useState<any>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                if (user?.company) {
                    const companyData = await apiService.get(`/api/companies/${user.company_id}/`);
                    //console.log("Fetched company data:", companyData);
                    
                    setForm({
                        name: companyData?.name ?? "",
                        email: companyData?.email ?? "",
                        phone_number: companyData?.phone_number ?? "",
                    });
                    setInitialForm(companyData);
                    setCurrentLogo(companyData?.logo ?? null);
                }
            } catch (error) {
                console.error("Error loading data:", error);
                setErrorMessage("Failed to load business details");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setErrorMessage("Logo file must be less than 2MB");
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrorMessage("Please upload an image file (PNG, JPG, JPEG)");
            return;
        }
        
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        setErrorMessage(null);
    };

    const hasChanges = () => {
        if (!initialForm) return false;

        return JSON.stringify(form) !== JSON.stringify({
            name: initialForm.name ?? "",
            email: initialForm.email ?? "",
            phone_number: initialForm.phone_number ?? "",
        }) || logoFile !== null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let payload: any;
        const isFormData = !!logoFile;

        const nameChanged = form.name !== (initialForm?.name ?? "");

        if (nameChanged) {
            const message = `You are changing the company name from "${initialForm?.name}" to "${form.name}".\n\nThis will immediately change the branding footprint printed on all system-generated documents and PDFs.\n\nAre you sure you want to proceed?`;
            const confirmed = window.confirm(message);
            
            // If they click 'Cancel', abort the save operations completely
            if (!confirmed) return;
        }

        setSaving(true);
        setErrors({});
        setErrorMessage(null);
        setSuccessMessage(null);

        if (isFormData) {
            payload = new FormData();
            Object.entries(form).forEach(([key, value]) => payload.append(key, value));
            if (logoFile) payload.append("logo", logoFile);
        } else {
            payload = { ...form };
        }

        try {
            const response = await apiService.patch(`/api/companies/${user?.company_id}/`, payload);

            setInitialForm({ ...form });
            if (logoFile) {
                setCurrentLogo(logoPreview);
                setLogoFile(null);
                setLogoPreview(null);

                setSuccessMessage(
                    "Profile updated! Logo changes will reflect the next time you log in."
                );
            } else {
                setSuccessMessage("Business profile updated successfully!");
            }

        } catch (err: any) {
            const backendErrors = err?.response?.data || {};
            setErrors(backendErrors);
            setErrorMessage(
                backendErrors.detail || "Failed to save business details. Please fix the errors."
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
                <p className="text-sm text-gray-500">Loading business details...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Company Profile</h2>
                    <p className="text-xs text-gray-400">Manage your business information and branding</p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto hover:text-emerald-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            
            {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)} className="ml-auto hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Logo Upload Section */}
            <div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-blue-500/60 hover:border-dashed">
                    <div className="relative h-24 w-24 rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/50 flex items-center justify-center overflow-hidden group hover:border-blue-500/50 transition-colors">
                        {logoPreview || currentLogo ? (
                            <Image 
                                src={logoPreview ?? currentLogo!} 
                                alt="Company Logo" 
                                fill 
                                className="object-contain p-2" 
                                unoptimized 
                            />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-500" />
                        )}
                    </div>
                    <div className="">
                        <h4 className="text-lg font-bold text-white mb-1 hover:text-blue-500">{user?.company}</h4>

                        <div className="space-y-1">
                            <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-all">
                                <Upload className="w-4 h-4" />
                                Choose Logo
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoChange} 
                                    className="hidden" 
                                />
                            </label>
                        </div>
                        
                        {logoPreview && (
                            <button
                                type="button"
                                onClick={() => {
                                    setLogoFile(null);
                                    setLogoPreview(null);
                                }}
                                className="ml-3 text-xs text-red-400 hover:text-red-300"
                            >
                                Undo changes
                            </button>
                        )}
                    </div>
                </div>
                {errors.logo && (
                    <p className="mt-2 text-xs text-red-400"><AlertCircle className="w-4 h-4 inline-block mr-2" />{errors.logo}</p>
                )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            name="name" 
                            value={form.name} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="Enter company name"
                            required
                        />
                    </div>
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-400"><AlertCircle className="w-4 h-4 inline-block mr-2" />{errors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            name="email" 
                            type="email"
                            value={form.email} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="company@example.com"
                            required
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-400"><AlertCircle className="w-4 h-4 inline-block mr-2" />{errors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            name="phone_number" 
                            value={form.phone_number} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    {errors.phone_number && (
                        <p className="mt-1 text-xs text-red-400"><AlertCircle className="w-4 h-4 inline-block mr-2" />{errors.phone_number}</p>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-700/50">
                <button
                    type="submit"
                    disabled={!hasChanges() || saving}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-medium rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/25 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
};

export default BusinessDetails;