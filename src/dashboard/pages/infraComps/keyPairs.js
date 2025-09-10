import { useState } from "react";
import { useFetchTenantKeyPairs } from "../../../hooks/keyPairsHook";
// import AddKeyPair from "../keyPairComps/addKeyPairs";

const KeyPairs = ({ projectId = "" }) => {
  const { data: keyPairs, isFetching } = useFetchTenantKeyPairs(projectId);
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <p>Loading key pairs...</p>
      </div>
    );
  }

  return (
    <>
      {" "}
      <div className="bg-gray-50 rounded-lg">
        <button
          onClick={openCreateModal}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base mb-6"
        >
          Add Key Pair
        </button>
        {keyPairs && keyPairs.length > 0 ? (
          <ul className="space-y-2">
            {keyPairs.map((keyPair) => (
              <li key={keyPair.id} className="p-4 bg-white rounded shadow-sm">
                <p className="font-medium">{keyPair.name}</p>
                <p className="text-sm text-gray-500">
                  Fingerprint: {keyPair.fingerprint}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No key pairs found for this project.</p>
        )}
      </div>
      {/* <AddKeyPair
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
      /> */}
    </>
  );
};

export default KeyPairs;
