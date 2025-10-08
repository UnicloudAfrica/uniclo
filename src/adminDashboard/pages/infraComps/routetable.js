import { useFetchRouteTables } from "../../../hooks/adminHooks/routeTableHooks";

const RouteTables = ({ projectId = "", region = "" }) => {
  const { data: eips, isFetching } = useFetchRouteTables(projectId, region);
  return (
    <>
      <div className="p-4 bg-gray-50 rounded-lg">
        Route Tables content for project: {projectId}.
      </div>
    </>
  );
};

export default RouteTables;
