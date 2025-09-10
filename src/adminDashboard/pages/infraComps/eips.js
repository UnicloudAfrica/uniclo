import { useState } from "react";
import { useFetchElasticIps } from "../../../hooks/adminHooks/eipHooks";
import AddEip from "../eipComps/addEip";

const EIPs = ({ projectId = "" }) => {
  const { data: eips, isFetching } = useFetchElasticIps(projectId);
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <p>Loading EIPs...</p>
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
          Add EIP
        </button>
        {eips && eips.length > 0 ? (
          <ul className="space-y-2">
            {eips.map((eip) => (
              <li key={eip.id} className="p-4 bg-white rounded shadow-sm">
                <p className="font-medium">{eip.name}</p>
                <p className="text-sm text-gray-500">
                  {/* Fingerprint: {keyPair.fingerprint} */}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">
            No Elastic IPs found for this project.
          </p>
        )}
      </div>
      <AddEip
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
      />
    </>
  );
};

export default EIPs;
