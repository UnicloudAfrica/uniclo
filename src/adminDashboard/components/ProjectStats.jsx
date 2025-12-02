import React from 'react';
import { Folder, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" />
                ) : (
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color} shadow-sm`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

const ProjectStats = ({ stats, loading }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Total Projects"
                value={stats?.total || 0}
                icon={Folder}
                color="bg-blue-500"
                loading={loading}
            />
            <StatCard
                title="Active Projects"
                value={stats?.active || 0}
                icon={CheckCircle}
                color="bg-green-500"
                loading={loading}
            />
            <StatCard
                title="Provisioning"
                value={stats?.provisioning || 0}
                icon={AlertCircle}
                color="bg-yellow-500"
                loading={loading}
            />
            <StatCard
                title="Failed/Inactive"
                value={(stats?.failed || 0) + (stats?.inactive || 0)}
                icon={XCircle}
                color="bg-red-500"
                loading={loading}
            />
        </div>
    );
};

export default ProjectStats;
