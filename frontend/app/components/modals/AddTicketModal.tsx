'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import useAddTicketModal from "@/app/hooks/useAddTicketModal";
import Modal from "./Modal";
import apiService from "@/app/services/apiService";
import { useRouter } from "next/navigation";
import { 
    AlertCircle, CheckCircle2, FileText, Layers, Send, 
    AlertTriangle,Clock, X, Upload, NotebookPen, Paperclip
} from "lucide-react";

const DEBUG = process.env.NODE_ENV !== 'production';

const AddTicketModal = () => {
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [departments, setDepartments] = useState([]);

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigned_to, setAssignedTo] = useState('');
    const [priority, setPriority] = useState('');
    const [image, setImage] = useState<File | null>(null);

    const [preview, setPreview] = useState<string | null>(null);

    const router = useRouter();
    const addTicketModal = useAddTicketModal();

    useEffect(() => {
        if (!image) {
            setPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(image);
        setPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [image]);

    const fetchDepartments = async () => {
        try {
            const response = await apiService.get('/api/departments/');
            setDepartments(Array.isArray(response) ? response : response.results || []);
        } catch (error) {
            if (DEBUG) console.error("Error fetching departments:", error);
        }
    }

    useEffect(() => {
        if (addTicketModal.isOpen) {
            fetchDepartments();
        }
    }, [addTicketModal.isOpen]);

    const submitTicket = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('assigned_to', assigned_to);
            formData.append('priority', priority);
            if (image) {
                formData.append('image', image);
            }

            const response = await apiService.post('/api/tickets/', formData);

            if (response.id) {
                setSuccess(true);

                setTimeout(() => {
                    addTicketModal.close();
                    router.push('/tickets');

                    // Reset form
                    setTitle('');
                    setDescription('');
                    setAssignedTo('');
                    setPriority('');
                    setImage(null);
                    setSuccess(false);
                }, 1500);
            } else {
                setErrors(response || { non_field_errors: ["Failed to create ticket."] });
            }
        } catch (error) {
            setErrors({ non_field_errors: ["A network error occurred. Please try again."] });
        } finally {
            setLoading(false);
        }
    }

    const content = (
        <form className="space-y-6 py-2">
            {/* Success State */}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-medium">Ticket created successfully! Closing...</p>
                </div>
            )}

            {/* Title Field */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Ticket Subject <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Briefly describe the issue..."
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-500"
                    required 
                />
                {errors.title && <p className="text-xs text-red-500"><AlertCircle className="w-4 h-4 inline-block mr-1" />{errors.title}</p>}
            </div>

            {/* Two Column Row for Dept and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        Target Department <span className="text-red-500">*</span>
                    </label>
                    <select 
                        value={assigned_to} 
                        onChange={(e) => setAssignedTo(e.target.value)} 
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                        required
                    >
                        <option value="">Select Dept</option>
                        {departments.map((dept: any) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                    {errors.assigned_to && <p className="text-xs text-red-500"><AlertCircle className="w-4 h-4 inline-block mr-1" />{errors.assigned_to}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        Priority Level <span className="text-xs text-gray-500">(Default: Medium)</span>
                    </label>
                    <select 
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value)} 
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                        required
                    >
                        <option value="">Select Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                    {errors.priority && <p className="text-xs text-red-500"><AlertCircle className="w-4 h-4 inline-block mr-1" />{errors.priority}</p>}
                </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
                <label className="text-sm flex items-center gap-2 font-semibold text-gray-300">
                    <NotebookPen className="w-4 h-4 text-green-400" />
                    Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                    rows={4}
                    placeholder="Provide all relevant details to help the team resolve this faster..."
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-gray-500"
                    required 
                />
                {errors.description && <p className="text-xs text-red-500"><AlertCircle className="w-4 h-4 inline-block mr-1" />{errors.description}</p>}
            </div>

            <div className="space-y-2">
                <p className="text-sm flex items-center gap-2 font-semibold text-gray-300">
                    <Paperclip className="w-4 h-4 text-blue-400" />
                    Attach a file <span className="text-xs text-gray-500">(Max. 2MB)</span>
                </p>
                <label className="block">
                      <div className="p-6 bg-gray-900 rounded-2xl border-2 border-dashed border border-gray-700 cursor-pointer transition hover:border-blue-500 focus-within:ring-2 focus-within:ring-black">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setImage(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />

                        <div className="flex flex-row items-center justify-center gap-4 text-slate-600">
                            <div className="p-3 bg-slate-600 rounded-full shadow-sm">
                                <Upload className="w-6 h-6 text-white" />
                            </div>

                            <div className="text-center text-white">
                                <p className="text-base font-medium">
                                    Click to upload
                                </p>
                                <p className="text-sm">
                                    PNG, JPG or JPEG
                                </p>
                            </div>
                        </div>
                    </div>  
                    {errors.image && <p className="text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4 inline-block mr-1" />{errors.image}</p>}

                    {/* Display uploaded image before submit */}
                    {preview && (
                        <div className="w-[400px] h-[400px] relative mt-4 mx-auto">
                            <Image
                                fill
                                src={preview}
                                alt="Uploaded image"
                                className="w-full h-full object-cover rounded-xl"
                            />

                            <button
                                type="button"
                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm cursor-pointer"
                                onClick={() => setImage(null)}
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    )}
                </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700/50">
                <button 
                    type="button"
                    onClick={addTicketModal.close}
                    className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all font-medium"
                >
                    Cancel
                </button>
                <button 
                    onClick={submitTicket}
                    type="submit"
                    disabled={loading || success}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 font-bold"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Submit Ticket
                        </>
                    )}
                </button>
            </div>
        </form>
    );

    return (
        <Modal 
            label="Create New Ticket" 
            close={addTicketModal.close} 
            content={content} 
            isOpen={addTicketModal.isOpen} 
        />
    )
}

export default AddTicketModal;