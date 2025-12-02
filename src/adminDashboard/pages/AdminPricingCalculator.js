import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import SharedPricingCalculator from "../components/shared/SharedPricingCalculator";

const AdminPricingCalculator = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <AdminSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeadbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    <AdminPageShell
                        title="Advanced Pricing Calculator"
                        description="Build, price, and assign complex infrastructure quotes."
                    >
                        <SharedPricingCalculator
                            mode="admin"
                            onExit={() => navigate("/admin-dashboard")}
                        />
                    </AdminPageShell>
                </main>
            </div>
        </div>
    );
};

export default AdminPricingCalculator;
