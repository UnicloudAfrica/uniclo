import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useContext, useMemo } from "react";
import { ManageContext } from "../contexts/contextprovider";
import { Link } from "react-router-dom";
import Ads from "../components/ad";

interface ManagementMember {
  name: string;
  url: string;
  desc: string;
  processedName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const Management = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [manageArray] = useContext(ManageContext) as [ManagementMember[]];
  const processedArray = useMemo(
    () =>
      manageArray.map((item) => ({
        ...item,
        processedName: encodeURIComponent(item.name).replace(/%20/g, "-"),
      })),
    [manageArray]
  );

  return (
    <>
      <Navbar />
      <div className=" mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[var(--theme-heading-color)]">
        <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
          Advisory Board
        </p>
        <p className=" text-center font-normal mt-3 text-lg md:text-xl">
          Team and Leadership at UniCloud Africa: Pioneering Excellence in the Digital Frontier
        </p>
        <p className=" text-base font-normal mt-6 text-justify text-[var(--theme-text-color)]">
          At UniCloud Africa, our strength lies in a dynamic team led by visionary leaders with a
          passion for innovation. From seasoned executives with over decades of hands-on experience
          to experts in cloud computing, our diverse team is united by a common goal: to
          revolutionize the way businesses operate in Africa.
          <br />
          <br />
          Our leadership brings a wealth of expertise in operations, finance, telecommunications,
          and technology, steering UniCloud Africa towards new heights of success.
        </p>

        <div className="mt-16 w-full">
          <div className=" mt-6 flex flex-wrap justify-around space-y-4 md:space-y-0 lg:space-y-0 space-x-0 md:space-x-[24px] ">
            {processedArray.map((item: ManagementMember, index: number) => (
              <Link
                key={index}
                to={`/advisory-board/${item.processedName}`}
                className="flex items-center justify-center w-full md:w-[250px]"
              >
                <div className="w-full text-center">
                  <div
                    className="h-[330px] bg-[var(--theme-surface-alt)] md:bg-center rounded-[20px]"
                    style={{
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                    }}
                  ></div>
                  <p className="text-left mt-4 text-lg lg:text-xl font-medium lg:h-[1.5em]">
                    {item.name}
                  </p>
                  <p className="text-left text-sm lg:h-[8em] mt-2">{item.desc}</p>
                  <p className=" gradient-text text-left text-sm">View More</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Ads />
      <Footer />
    </>
  );
};

export default Management;
