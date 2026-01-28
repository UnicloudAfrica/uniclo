import React, { useState } from "react";
import { Lock, Save, Eye, EyeOff } from "lucide-react";
import { ModernButton, ModernCard } from "../ui";
import { useContextAwareSettings } from "../../../hooks/useContextAwareSettings";

export const SecurityPasswordPanel = () => {
    const [formData, setFormData] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const { useUpdatePassword } = useContextAwareSettings();
    const { mutate: updatePassword, isPending } = useUpdatePassword();

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updatePassword(formData, {
            onSuccess: () => {
                setFormData({
                    current_password: "",
                    password: "",
                    password_confirmation: "",
                })
            }
        });
    };

    const isFormValid =
        formData.current_password &&
        formData.password &&
        formData.password_confirmation &&
        formData.password.length >= 8 &&
        formData.password === formData.password_confirmation;

    return (
        <ModernCard className="space-y-6 border border-slate-200/80 bg-white/95 shadow-sm" padding="lg">
            <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">Change Password</h3>
                <p className="text-sm text-slate-500">
                    Update your password associated with this account.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type={showCurrent ? "text" : "password"}
                            value={formData.current_password}
                            onChange={(e) => handleChange("current_password", e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type={showNew ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Min 8 chars, mixed case & symbols"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type={showNew ? "text" : "password"}
                            value={formData.password_confirmation}
                            onChange={(e) => handleChange("password_confirmation", e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <ModernButton
                        type="submit"
                        disabled={!isFormValid || isPending}
                        leftIcon={<Save size={16} />}
                    >
                        {isPending ? "Updating..." : "Update Password"}
                    </ModernButton>
                </div>
            </form>
        </ModernCard>
    );
};
