import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';
import AdminPageShell from '../components/AdminPageShell';
import SharedCreateInvoice from '../components/shared/SharedCreateInvoice';

const CreateInvoice = () => {
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
                        title="Create Invoice"
                        description="Build comprehensive invoices, assign them to tenants or users, and generate pricing breakdowns."
                        contentClassName="pb-20"
                    >
                        <SharedCreateInvoice
                            mode="admin"
                            onExit={() => navigate('/admin-dashboard')}
                        />
                    </AdminPageShell>
                </main>
            </div>
        </div>
    );
};

export default CreateInvoice;
