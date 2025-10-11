import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import {
  useDeleteClientSecurityGroup,
  useFetchClientSecurityGroups,
} from "../../../hooks/clientHooks/securityGroupHooks";
import AddSG from "../sgComps/addSG";
import ViewSGModal from "../sgComps/viewSG";
import DeleteSGModal from "../sgComps/deleteSG";

const SecurityGroup = ({ projectId = "", region = "" }) => {
  const { data: securityGroups, isFetching } = useFetchClientSecurityGroups(
    projectId,
    region
  );
  const { mutate: deleteSecurityGroup, isPending: isDeleting } =
    useDeleteClientSecurityGroup();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const [viewModal, setViewModal] = useState(null); // securityGroup object
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Pagination logic
  const totalItems = securityGroups?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSecurityGroups =
    securityGroups?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    const payload = {
      project_id: projectId,
      region: region,
    };
    deleteSecurityGroup(
      { id: deleteModal.id, payload },
      {
        onSuccess: () => {
          setDeleteModal(null);
        },
        onError: (err) => {
          console.error("Failed to delete Security Group:", err);
          setDeleteModal(null);
        },
      }
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <p>Loading security groups...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 rounded-[10px] font-Outfit">
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={openCreateModal}
            className="rounded-[30px] py-3 px-9 bg-[--theme-color] text-white font-normal text-base hover:bg-[--secondary-color] transition-colors"
          >
            Add SG
          </button>
        </div>
        {currentSecurityGroups && currentSecurityGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSecurityGroups.map((sg) => (
              <div
                key={sg.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-medium text-gray-800 truncate pr-2"
                      title={sg.name}
                    >
                      {sg.name}
                    </h3>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => setViewModal(sg)}
                        className="text-gray-400 hover:text-[--theme-color] transition-colors"
                        title="View Security Group Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            id: sg.id,
                            name: sg.name,
                          })
                        }
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Security Group"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{sg.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No security groups found for this project.
          </p>
        )}
      </div>
      <AddSG
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
        region={region}
      />
      <ViewSGModal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        securityGroup={viewModal}
      />
      <DeleteSGModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        securityGroupName={deleteModal?.name || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default SecurityGroup;
