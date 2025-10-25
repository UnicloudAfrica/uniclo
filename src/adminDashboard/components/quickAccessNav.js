import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  Settings,
  Terminal,
  Zap,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";

const QuickAccessNav = () => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      title: "Multi-Instance Creation",
      description: "Create and provision multiple instances",
      icon: Server,
      path: "/admin-dashboard/multi-instance-creation",
      color: "bg-unicloud-blue/10 text-unicloud-blue",
      bgColor: "hover:bg-unicloud-blue/20",
    },
    {
      title: "Projects",
      description: "Manage projects and infrastructure",
      icon: Settings,
      path: "/admin-dashboard/projects",
      color: "bg-unicloud-blue/10 text-unicloud-blue",
      bgColor: "hover:bg-unicloud-blue/20",
    },
    {
      title: "Advanced Calculator",
      description: "Calculate pricing and generate quotes",
      icon: Terminal,
      path: "/admin-dashboard/advanced-calculator",
      color: "bg-unicloud-blue/10 text-unicloud-blue",
      bgColor: "hover:bg-unicloud-blue/20",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Access</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enhanced features and tools
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-unicloud-blue/10 text-unicloud-blue">
            <Zap className="w-3 h-3 mr-1" />
            New Features
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <button
            key={link.title}
            onClick={() => navigate(link.path)}
            className={`text-left p-4 rounded-lg border border-gray-200 transition-all duration-200 ${link.bgColor} hover:border-gray-300`}
          >
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${link.color}`}
            >
              <link.icon className="w-5 h-5" />
            </div>

            <h3 className="font-medium text-gray-900 mb-1">{link.title}</h3>
            <p className="text-sm text-gray-500">{link.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-1" />
              <span>Real-time updates</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>Collaboration ready</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Enhanced monitoring</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin-dashboard/projects")}
            className="text-unicloud-blue font-medium"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAccessNav;
