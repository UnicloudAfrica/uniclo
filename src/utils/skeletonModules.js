import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const SkeletonModules = () => {
  // Placeholder accordion data structure based on observed content counts
  const accordionSkeletonData = [
    { id: 1, title: "", contentCount: 6 },
    { id: 2, title: "", contentCount: 2 },
    { id: 3, title: "", contentCount: 1 },
    { id: 4, title: "", contentCount: 1 },
  ];

  return (
    <>
      {/* Cart Button Skeleton */}
      <div className="mb-6">
        <Skeleton width={120} height={40} borderRadius={20} />
      </div>

      {/* Cart Debug Info Skeleton (if items present) */}
      <div className="mb-6">
        <Skeleton width="100%" height={40} />
        <div className="mt-2 space-y-1">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} width="80%" height={20} />
          ))}
        </div>
      </div>

      <div className="w-full">
        {/* Accordion Skeleton */}
        {accordionSkeletonData.map((item) => (
          <div
            key={item.id}
            className="border-b border-gray-200 last:border-b-0"
          >
            {/* Header Skeleton */}
            <div className="w-full flex items-center justify-between py-4 px-0 text-left">
              <Skeleton width={200} height={24} />
              <Skeleton width={100} height={32} borderRadius={8} />
            </div>

            {/* Collapsible Content Skeleton */}
            <div className="pb-4 rounded-md mb-2">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: item.contentCount }, (_, index) => (
                  <div
                    className="relative w-full border border-[#E9EAF4] py-6 px-5 rounded-[10px]"
                    key={index}
                  >
                    <div className="max-w-[300px]">
                      <Skeleton width={250} height={20} />
                      <div className="flex items-center space-x-2 mt-4">
                        <Skeleton width={150} height={16} />
                      </div>
                      <Skeleton width={100} height={24} className="mt-4" />
                      <Skeleton width={200} height={16} className="mt-4" />
                      <div className="flex items-center space-x-4 mt-4">
                        <Skeleton width={100} height={32} borderRadius={4} />
                        <Skeleton width={120} height={32} borderRadius={20} />
                      </div>
                    </div>
                    <Skeleton
                      width={40}
                      height={40}
                      circle={true}
                      className="absolute top-1/3 right-8 lg:right-[60px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
