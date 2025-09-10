import { useState } from "react";
import { useFetchTenantVpcs } from "../../../hooks/vpcHooks";
// import { useFetchVpcs } from "../../../hooks/adminHooks/vcpHooks";
// import AddVpc from "../vpcComps/addVpc";

const VPCs = ({ projectId = "" }) => {
  const { data: vpcs, isFetching } = useFetchTenantVpcs(projectId);
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <p>Loading vpcs...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 rounded-lg">
        <button
          onClick={openCreateModal}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base mb-6"
        >
          Add VPC
        </button>
        {vpcs && vpcs.length > 0 ? (
          <ul className="space-y-2">
            {vpcs.map((vpc) => (
              <li key={vpc.id} className="p-4 bg-white rounded shadow-sm">
                <p className="font-medium">{vpc.name}</p>
                <p className="text-sm text-gray-500">
                  {/* Fingerprint: {keyPair.fingerprint} */}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">
            No security groups found for this project.
          </p>
        )}
      </div>
      {/* <AddVpc
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
      /> */}
    </>
  );
};

export default VPCs;
