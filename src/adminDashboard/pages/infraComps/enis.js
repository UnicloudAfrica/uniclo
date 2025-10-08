import { useFetchNetworkInterfaces } from "../../../hooks/adminHooks/networkHooks";

const ENIs = ({ projectId = "" }) => {
  const { data: networkInterfaces, isFetching } =
    useFetchNetworkInterfaces(projectId);

  return (
    <>
      <div className="p-4 bg-gray-50 rounded-lg">
        Elastic Network Interfaces content for project: {projectId}.
      </div>
    </>
  );
};

export default ENIs;
