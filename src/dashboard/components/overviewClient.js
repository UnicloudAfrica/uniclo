import certs from "./assets/certs.svg";

const OverviewClient = () => {
  const certificates = [
    {
      id: 1,
      title: "Certificate of Incorporation",
      name: "OLIVIA FORD",
      subtitle: "MASTER HERBALIST DIPLOMA COURSE",
      date: "February 1, 2024",
      img: certs,
    },
    {
      id: 2,
      title: "Certificate of Achievement",
      name: "OLIVIA FORD",
      subtitle: "MASTER HERBALIST DIPLOMA COURSE",
      date: "February 1, 2024",
      img: certs,
    },
    {
      id: 3,
      title: "Certificate of Achievement",
      name: "OLIVIA FORD",
      subtitle: "MASTER HERBALIST DIPLOMA COURSE",
      date: "February 1, 2024",
      img: certs,
    },
  ];

  return (
    <>
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-80  px-4  overflow-y-auto space-y-4 divide-y ">
          {certificates.map((cert, index) => (
            <div key={index} className=" pt-8 ">
              <img src={cert.img} alt={cert.title} />
              <p className=" mt-1.5 text-center text-[#1C1C1C80] text-xs font-normal">
                {cert.title}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8">
          <div className="max-w-2xl">
            {/* Header */}
            <div className=" pb-4 border-b border-[#EDEFF6] mb-4">
              <div className=" flex justify-between items-center mb-2.5">
                <div className="text-base font-medium text-[#575758]">ID:</div>
                <div className="text-base font-medium text-[#575758]">
                  #CL-198
                </div>
              </div>
              <div className="text-right flex justify-between items-center">
                <div className="text-base font-medium text-[#575758]">
                  Status:
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2">
              <div className=" flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">Name:</div>
                <div className="text-base font-medium text-[#575758]">
                  Ozi Young
                </div>
              </div>
              <div className="text-right flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Email Address:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  ozi@gmail.com
                </div>
              </div>

              <div className=" flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Phone Number:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  08111112223
                </div>
              </div>

              <div className=" flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Current Module:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  Z4 Compute Instances
                </div>
              </div>

              <div className=" flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Start Date:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  April 13, 2025 - 2:45 PM
                </div>
              </div>
              <div className=" flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  End Date:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  May 13, 2025
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewClient;
