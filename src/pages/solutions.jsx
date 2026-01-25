// import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getFirestore, collection, query, orderBy, onSnapshot} from 'firebase/firestore';
import arrowdown from "./assets/Arrow_Down_Right_LG.svg";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
// import DetailedSolution from "./detailedSolu";
import { motion } from "framer-motion";
import { useContext } from "react";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { CasesContext, SolutionsContext } from "../contexts/contextprovider";

const Solutions = () => {
  const [solutionsArray] = useContext(SolutionsContext);
  const [casesArray] = useContext(CasesContext);

  return (
    <>
      <div>
        <Navbar />
        <motion.div>
          <div className=" mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
              Solutions
            </p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl text-[#676767] ">
              Discover Your Custom Cloud Advantage: Tailored Solutions for Every Industry
            </p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-16">
              {solutionsArray
                // Ensure 'order' property exists and is numeric
                .filter((item) => typeof item.order === "number")
                // Sort the array based on the 'order' property
                .sort((a, b) => a.order - b.order)
                .map((item, index) => (
                  <Link to={`/solutions/${item.id}`}>
                    <div key={item.id} id={item.id} className="w-full text-center">
                      <div
                        className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"
                        style={{
                          backgroundImage: `url(${item.url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      ></div>
                      <p className="text-left mt-3 text-xl md:text-2xl font-medium">{item.topic}</p>
                      <p className="text-left mt-1 text-[#676767] text-sm ">{item.desc}</p>
                      <button className=" flex mt-6 items-center">
                        <p className=" gradient-text text-base">View more</p>
                      </button>
                    </div>
                  </Link>
                ))}
            </div>

            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] mt-16 lg:mt-40 text-center">
              Use Cases
            </p>
            {/* <p className=" text-center font-normal mt-3 text-lg md:text-xl text-[#676767]">
              Explore our case studies to see how our solutions have made a real
              impact.
            </p> */}
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
                    <p className="text-left mt-6 text-xl lg:text-2xl font-medium">{item.title}</p>
                    <p className="text-left mt-3 text-[#676767] text-sm">
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
      </div>
    </>
  );
};

export default Solutions;
