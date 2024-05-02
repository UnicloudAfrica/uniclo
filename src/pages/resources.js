import Footer from "../components/footer";
import Navbar from "../components/navbar";
import arrowdown from "./assets/Arrow_Down_Right_LG.svg";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { motion } from "framer-motion";
import { useContext } from "react";
import { ResourcesContext, CasesContext } from "../contexts/contextprovider";
import { Link } from "react-router-dom";

const Resources = () => {
  const [resourcesArray] = useContext(ResourcesContext);
  const [casesArray] = useContext(CasesContext);

  return (
    <>
      <Navbar />
      <motion.div>
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
          <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
            Resources
          </p>
          <p className=" text-center font-normal mt-1 text-lg md:text-xl text-[#676767] ">
            Explore our resources for cloud services, cloud computing and web
            hosting.
          </p>
          <div
            className={`grid grid-cols-1 md:grid-cols-${
              resourcesArray.length > 1 ? 2 : 1
            } gap-[32px] lg:gap-[4%] w-full mt-10 mb-[3em]`}
          >
            {resourcesArray.map((item, index) => (
              <Link to={`/resources/${item.id}`}>
                <div key={index} className="w-full text-center">
                  <div
                    className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-left mt-3 text-lg md:text-xl font-medium">
                    {item.title}
                  </p>
                  <p className="text-left mt-1 text-[#676767] text-sm md:text-base">
                    {item.tagline}
                  </p>
                  <button className=" flex space-x-8 mt-6 items-center">
                    <p className=" gradient-text text-base">View more</p>
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] mt-16 text-center">
            Use Cases
          </p>
          <p className=" text-center font-normal mt-3 text-lg md:text-xl ">
            Explore our case studies to see how our solutions have made a real
            impact.
          </p>
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]">
            {casesArray.map((item, index) => (
              <Link to={`/use-cases/${item.id}`}>
                <div key={index} className="w-full text-center">
                  <div
                    className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-left mt-6 text-xl lg:text-2xl font-medium">
                    {item.title}
                  </p>
                  <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">
                    {item.tagline.substring(0, 200) + "..."}
                  </p>
                  <button className=" flex mt-6 items-center">
                    <p className=" gradient-text text-base">View more</p>
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <motion.div className="  py-[3em] w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative">
              <img
                src={adbg}
                className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]"
                alt=""
              />
              <img
                src={admob}
                className="z-10 absolute top-0 h-full w-full object-cover block md:hidden"
                alt=""
              />
              <p className=" font-semibold text-xl md:text-3xl">
                Join our webinars and access whitepapers{" "}
              </p>
              <p className=" font-normal px-4 md:px-0 text-base md:text-xl md:mt-2">
                We offer in-depth knowledge on cloud technologies and
                implementation.
              </p>
              <div className=" flex flex-col md:flex-row items-center md:mt-4 justify-center z-20  mt-4 md:space-x-6 space-y-4 md:space-y-0">
                <input
                  placeholder="Enter Email"
                  className=" w-full md:w-auto h-[52px] bg-[#133D4C80] py-2.5 px-4 md:px-7 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]"
                  type="text"
                />
                <Link to="/contact" target="_blank" rel="noopener noreferrer">
                  <button className=" w-full md:w-auto px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">
                    Subscribe
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        <Footer />
      </motion.div>
    </>
  );
};

export default Resources;
