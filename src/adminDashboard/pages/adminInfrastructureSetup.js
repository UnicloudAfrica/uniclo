import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import AdminHeadbar from '../components/adminHeadbar';
import AdminSidebar from '../components/adminSidebar';
import AdminActiveTab from '../components/adminActiveTab';
import InfrastructureSetupFlow from './infraComps/InfrastructureSetupFlow';
import { useFetchProjectById } from '../../hooks/adminHooks/projectHooks';
import ToastUtils from '../../utils/toastUtil';

// Function to decode the ID from URL
const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error('Error decoding ID:', e);
    return null;
  }
};

const AdminInfrastructureSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const encodedProjectId = queryParams.get('id');
  const projectId = decodeId(encodedProjectId);
  const isNewProject = queryParams.get('new') === '1';

  const {
    data: projectDetails,
    isFetching: isProjectFetching,
    error: projectError,
  } = useFetchProjectById(projectId);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleBackToProject = () => {
    const encodedId = encodeURIComponent(btoa(projectId));
    navigate(`/admin-dashboard/projects/details?id=${encodedId}`);
  };

  const handleGoToProjects = () => {
    navigate('/admin-dashboard/projects');
  };

  // Show welcome message for new projects
  useEffect(() => {
    if (isNewProject && projectDetails) {
      ToastUtils.success(
        `Project "${projectDetails.name}" created successfully! Configure your infrastructure below.`
      );
    }
  }, [isNewProject, projectDetails]);

  if (isProjectFetching) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center flex-col">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-blue-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </main>
      </>
    );
  }

  if (!projectDetails || projectError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center flex-col text-center">
          <div className="max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Project Not Found
            </h2>
            <p className="text-sm md:text-base font-normal text-gray-700 mb-6">
              The project you're trying to configure could not be found. It may have been deleted or you may not have permission to access it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleGoToProjects}
                className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
              >
                Go to Projects
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-full hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToProject}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                title="Back to Project Details"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Infrastructure Setup
                </h1>
                <p className="text-sm text-gray-600">
                  Configure infrastructure for: <span className="font-medium">{projectDetails.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToProject}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Project
              </button>
            </div>
          </div>
          
          {isNewProject && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">Welcome to Your New Project!</h3>
                  <p className="text-sm text-blue-700">
                    Follow the step-by-step guide below to configure your project's infrastructure. 
                    Each step will be automatically enabled as prerequisites are completed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Infrastructure Setup Flow */}
        <div>
          <InfrastructureSetupFlow
            projectId={projectDetails.identifier}
            projectName={projectDetails.name}
          />
        </div>
      </main>
    </>
  );
};

export default AdminInfrastructureSetup;