import Footer from "../components/footer";
import Navbar from "../components/navbar";
import cpu from "./assets/cpu-setting.svg";
import driver from "./assets/driver-refresh.svg";
import cloud from "./assets/cloud-add.svg";
import connect from "./assets/cloud-connection.svg";
import charge from "./assets/cpu-charge.svg";
import chart from "./assets/presention-chart.svg";
import drivere from "./assets/driver.svg";
import message from "./assets/message-programming.svg";
import { motion } from "framer-motion";
import { useContext } from "react";
import { CasesContext } from "../contexts/contextprovider";
import { Link } from "react-router-dom";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";

interface CaseItem {
  id: string;
  url: string;
  title: string;
  tagline: string;
}

const Services = () => {
  const [casesArray] = useContext(CasesContext);
  const data = [
    {
      topic: "Infrastructure-as-a-Service (IaaS)",
      content: "Provision of  scalable and customizable virtualized infrastructure resources.",
      img: cpu,
    },
    {
      topic: "Platform-as-a-Service (PaaS)",
      content: "Offering a platform for application development, deployment, and management.",
      img: driver,
    },
    {
      topic: "Data Storage and Backup",
      content:
        "Providing secure and reliable data storage options with redundancy and backup capabilities.",
      img: cloud,
    },
    {
      topic: "Multi-Cloud and Hybrid Cloud Support",
      content:
        "Facilitating integration with other cloud platforms and on-premises infrastructure.",
      img: connect,
    },
    {
      topic: "High Availability and Scalability",
      content:
        "Offering scalable resources and automatic load balancing for high availability and performance.",
      img: charge,
    },
    {
      topic: "Analytics and Business Intelligence",
      content: "Enabling data analysis, and reporting for valuable insights and decision-making.",
      img: chart,
    },
    {
      topic: "Cloud Marketplace and Partner Ecosystem",
      content:
        "Establishing a marketplace for third-party applications and services from trusted partners.",
      img: drivere,
    },
    {
      topic: "Developer Tools and APIs",
      content:
        "Offering development tools, SDKs, and APIs for application integration and development.",
      img: message,
    },
  ];

  return (
    <>
      <Navbar />
      <motion.div>
        <div className=" mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
          <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
            Our Services
          </p>
          <p className=" text-center font-normal text-[#676767] mt-1 text-lg md:text-xl ">
            Discover a range of cloud services that empower your business to grow and succeed
          </p>
          <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px] w-full mt-12">
            {data.map((item, index) => (
              <div key={index} className="w-full text-center">
                <div className=" w-full bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.1)] to-[rgb(var(--secondary-color-rgb)/0.1)] relative md:h-[300px] rounded-[20px] p-6">
                  <img src={item.img} className=" w-16 h-16" alt="" />
                  <p className="text-left mt-6 text-lg md:text-xl font-medium">{item.topic}</p>
                  <p className="text-left mt-1 text-[#1E1E1ECC] text-sm">{item.content}</p>
                </div>
              </div>
            ))}
          </div>

          <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] mt-[64px] text-center">
            Use Cases
          </p>

          <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[3em]">
            {(casesArray as unknown as CaseItem[]).map((item) => (
              <Link key={item.id} to={`/use-cases/${item.id}`}>
                <div className="w-full text-center">
                  <div
                    className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-left mt-6 text-xl md:text-2xl font-medium">{item.title}</p>
                  <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">
                    {item.tagline.substring(0, 200) + "..."}
                  </p>
                  <button className=" flex mt-6 items-center tracki">
                    <p className=" gradient-text text-base">View more</p>
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <motion.div className=" md:mt-[128px]  py-[3em] w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] relative md:space-y-4">
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
              <p className=" font-semibold text-xl md:text-3xl">Want product news and updates</p>
              <p className=" font-normal px-4 md:px-0 text-lg md:text-xl">
                Subscribe to UniCloud Africa blog to get update right in your inbox
              </p>
              <div className=" flex flex-col md:flex-row items-center justify-center z-20  mt-4 md:space-x-6 space-y-4 md:space-y-0">
                <input
                  placeholder="Enter Email"
                  className=" w-full md:w-auto h-[52px] bg-[#133D4C80] py-2.5 px-4 md:px-7 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]"
                  type="text"
                />
                <Link to="/contact" target="_blank" rel="noopener noreferrer">
                  <button className="  md:w-auto px-6 md:px-9 py-3 md:py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">
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

export default Services;
