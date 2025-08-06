import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Edit,
  User,
  FileText,
  Download,
  PlusCircle,
  ChevronDown,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchLeadById } from "../../hooks/adminHooks/leadsHook";
import { useConvertLeadToUser } from "../../hooks/adminHooks/leadsHook";
import EditLead from "./leadComps/editLead";
import AddLeadStage from "./leadComps/addLeadStage";
import { EditLeadStage } from "./leadComps/editLeadStage";
import AddLeadDocument from "./leadComps/addLeadDoc";
import UpdateLeadDoc from "./leadComps/updateLeadDoc";

const formatStatusForDisplay = (status) => {
  return status.replace(/_/g, " ");
};

const DetailItem = ({ label, value, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900 capitalize">{value || "N/A"}</span>
  </div>
);

const DocumentItem = ({ doc, onDownload, onUpdate }) => (
  <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <FileText className="w-5 h-5 text-gray-500 mr-2" />
        <span className="text-sm font-medium text-gray-800">{doc.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        {/* <button
          onClick={() => onDownload(doc)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="Download Document"
        >
          <Download className="w-4 h-4" />
        </button> */}
        <button
          onClick={() => onUpdate(doc)}
          className="text-green-600 hover:text-green-800 transition-colors"
          title="Update Document"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
      <p className=" capitalize">
        <span className="font-medium capitalize">Status:</span>{" "}
        {formatStatusForDisplay(doc.status) || "N/A"}
      </p>
      <p className=" capitalize">
        <span className="font-medium">Type:</span>{" "}
        {formatStatusForDisplay(doc.document_type) || "N/A"}
      </p>
      <p className="col-span-2">
        <span className="font-medium">Uploaded By:</span>{" "}
        {doc.uploaded_by?.first_name && doc.uploaded_by?.last_name
          ? `${doc.uploaded_by.first_name} ${doc.uploaded_by.last_name}`
          : doc.uploaded_by || "N/A"}
      </p>
    </div>
  </div>
);

export default function AdminLeadDetails() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [isUpdateDocModalOpen, setIsUpdateDocModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [leadId, setLeadId] = useState(null);
  const [leadNameFromUrl, setLeadNameFromUrl] = useState("");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedId = params.get("id");
    const nameFromUrl = params.get("name");

    if (encodedId) {
      try {
        const decodedId = atob(decodeURIComponent(encodedId));
        setLeadId(decodedId);
      } catch (error) {
        console.error("Failed to decode lead ID:", error);
        setLeadId(null);
      }
    }
    if (nameFromUrl) {
      setLeadNameFromUrl(decodeURIComponent(nameFromUrl));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActionsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const { data: leadDetails, isFetching, isError } = useFetchLeadById(leadId);
  const { mutate: convertLead, isPending: isConverting } =
    useConvertLeadToUser();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleActionsDropdown = () =>
    setIsActionsDropdownOpen(!isActionsDropdownOpen);

  const openEditModal = () => {
    setIsEditLeadOpen(true);
    setIsActionsDropdownOpen(false);
  };
  const closeEditModal = () => setIsEditLeadOpen(false);

  const openAddStageModal = () => {
    setEditingStage(null);
    setIsAddStageModalOpen(true);
    setIsActionsDropdownOpen(false);
  };
  const closeAddStageModal = () => setIsAddStageModalOpen(false);

  const openEditStageModal = () => setIsEditStageModalOpen(true);
  const closeEditStageModal = () => setIsEditStageModalOpen(false);

  const openAddDocModal = () => setIsAddDocOpen(true);
  const closeAddDocModal = () => setIsAddDocOpen(false);

  const openUpdateDocModal = () => setIsUpdateDocModalOpen(true);
  const closeUpdateDocModal = () => setIsUpdateDocModalOpen(false);

  const handleEditStage = (stage) => {
    setEditingStage(stage);
    openEditStageModal();
  };

  const handleGoBack = () => navigate("/admin-dashboard/leads");

  const handleConvertLead = () => {
    if (leadId) {
      convertLead(leadId);
    }
    setIsActionsDropdownOpen(false);
  };

  const handleAddDocument = () => openAddDocModal();
  const handleDownloadDoc = (doc) => console.log("Downloading:", doc.name);
  const handleUpdateDoc = (doc) => {
    setEditingDocument(doc);
    openUpdateDocModal();
  };

  if (isFetching || leadId === null) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700">Loading leads details...</p>
        </main>
      </>
    );
  }

  if (isError || !leadDetails) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-4">
            This lead couldn't be found.
          </p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go back
          </button>
        </main>
      </>
    );
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    source,
    status,
    lead_type,
    created_at,
    assigned_to,
    pricing_summary,
    country,
    notes,
    documents,
    follow_up_date,
    last_contacted_at,
    stages,
  } = leadDetails;

  const formattedCreatedAt = created_at
    ? new Date(created_at).toLocaleString()
    : "N/A";
  const formattedFollowUpDate = follow_up_date
    ? new Date(follow_up_date).toLocaleDateString()
    : "N/A";
  const formattedLastContactedAt = last_contacted_at
    ? new Date(last_contacted_at).toLocaleString()
    : "N/A";

  const getStatusColorClass = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "proposal_sent":
        return "bg-indigo-100 text-indigo-800";
      case "negotiating":
        return "bg-purple-100 text-purple-800";
      case "closed_won":
        return "bg-emerald-100 text-emerald-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusColorClass = getStatusColorClass(status);

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className=" top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 relative">
        {isConverting && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 z-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#288DD1]" />
            <p className="mt-4 text-lg font-semibold text-gray-700">
              Converting Lead to User...
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleGoBack}
              className="p-2 mr-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">
              {first_name} {last_name || leadNameFromUrl || "N/A"}
            </h1>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleActionsDropdown}
              className="flex items-center px-4 py-2 bg-[#288DD1] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-colors"
            >
              Actions <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {isActionsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div
                  className="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu"
                >
                  <button
                    onClick={openEditModal}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                  </button>
                  <button
                    onClick={openAddStageModal}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Lead Stage
                  </button>
                  <button
                    onClick={handleConvertLead}
                    disabled={isConverting}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    role="menuitem"
                  >
                    {isConverting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <User className="w-4 h-4 mr-2" />
                    )}
                    {isConverting ? "Converting..." : "Convert to User"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Lead Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <DetailItem
              label="Full Name"
              value={`${first_name} ${last_name}`}
            />
            <DetailItem label="Email" value={email} />
            <DetailItem label="Phone" value={phone} />
            <DetailItem label="Source" value={source} />
            <DetailItem label="Country" value={country} />
            <DetailItem label="Lead Type" value={lead_type} />
            <DetailItem label="Created At" value={formattedCreatedAt} />
            <DetailItem
              label="Last Contacted At"
              value={formattedLastContactedAt}
            />
            <DetailItem label="Follow Up Date" value={formattedFollowUpDate} />
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-600">Status:</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize mt-1 ${statusColorClass}`}
              >
                {formatStatusForDisplay(status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Assigned Admin
            </h2>
            {assigned_to ? (
              <div className="text-sm grid gap-2">
                <DetailItem
                  label="Name"
                  value={`${assigned_to.first_name} ${assigned_to.last_name}`}
                />
                <DetailItem label="Email" value={assigned_to.email} />
              </div>
            ) : (
              <p className="text-gray-500">Not Assigned</p>
            )}
          </div>

          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Pricing Breakdown
            </h2>
            {pricing_summary ? (
              <div className="text-sm grid gap-2">
                <DetailItem
                  label="Total"
                  value={`${pricing_summary.total} ${pricing_summary.currency}`}
                />
                <div className="w-full grid grid-cols-2 gap-3">
                  <DetailItem
                    label="Instances"
                    value={pricing_summary.instances}
                  />
                  <DetailItem label="Months" value={pricing_summary.months} />
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No pricing information available.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">Stages</h2>
          {stages && stages.length > 0 ? (
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 capitalize">
                      {formatStatusForDisplay(stage.name)}
                    </h3>
                    <button
                      onClick={() => handleEditStage(stage)}
                      className="text-gray-400 hover:text-blue-500"
                      title="Edit Stage"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    {stage.description || "No description."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2 text-sm">
                    <DetailItem
                      label="Status"
                      value={formatStatusForDisplay(stage.status)}
                    />
                    <DetailItem
                      label="Started"
                      value={
                        stage.started_at
                          ? new Date(stage.started_at).toLocaleString()
                          : "N/A"
                      }
                    />
                    <DetailItem
                      label="Completed"
                      value={
                        stage.completed_at
                          ? new Date(stage.completed_at).toLocaleString()
                          : "N/A"
                      }
                    />
                    <DetailItem
                      label="Assigned To"
                      value={
                        stage.assigned_to
                          ? `${stage.assigned_to.first_name} ${stage.assigned_to.last_name}`
                          : "N/A"
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <h5 className="text-md font-semibold text-gray-700 mb-2">
                      Documents for this Stage:
                    </h5>
                    {stage.documents && stage.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stage.documents.map((doc) => (
                          <DocumentItem
                            key={doc.id}
                            doc={doc}
                            onDownload={handleDownloadDoc}
                            onUpdate={handleUpdateDoc}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No documents for this stage.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              No stages have been added for this lead.
            </p>
          )}
        </div>

        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">Notes</h2>
          {notes && notes.length > 0 ? (
            <div className="space-y-3">
              {notes.split("\n\n").map((note, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-gray-500 mr-2">&bull;</span>
                  <p className="text-gray-900 leading-relaxed">
                    {note.trim() || "No content for this note."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notes available.</p>
          )}
        </div>

        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#575758]">Documents</h2>
            <button
              onClick={handleAddDocument}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Document
            </button>
          </div>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  doc={doc}
                  onDownload={handleDownloadDoc}
                  onUpdate={handleUpdateDoc}
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              No documents found for this lead.
            </p>
          )}
        </div>
      </main>
      <EditLead
        isOpen={isEditLeadOpen}
        onClose={closeEditModal}
        lead={leadDetails}
      />
      <AddLeadStage
        isOpen={isAddStageModalOpen}
        onClose={closeAddStageModal}
        initialStage={editingStage}
      />
      <EditLeadStage
        isOpen={isEditStageModalOpen}
        onClose={closeEditStageModal}
        stage={editingStage}
        lead={leadDetails}
      />
      <AddLeadDocument
        isOpen={isAddDocOpen}
        onClose={closeAddDocModal}
        lead={leadDetails}
      />
      <UpdateLeadDoc
        isOpen={isUpdateDocModalOpen}
        onClose={closeUpdateDocModal}
        leadId={leadId}
        document={editingDocument}
      />
    </>
  );
}
