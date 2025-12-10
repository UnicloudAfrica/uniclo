import Footer from "../components/footer";
import Navbar from "../components/navbar";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import dsc from "./assets/DSC_2041.jpg";

const ExtResouce1 = () => {
  return (
    <>
      <Navbar />
      <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
        <div>
          <p className="gradient-txt text-center font-medium text-base">Published by ITPULSE</p>
          <p className="font-medium text-2xl md:text-[40px] md:leading-[50px] mt-3 md:px-[12%] text-center">
            Benue State to build modern data center and cloud system with UniCloud Africa
          </p>
          <p className="font-medium text-lg md:text-xl mt-3 md:px-[12%] text-center text-[#676767]">
            This project is a significant step forward for Benue’s digital transformation. The
            in-country cloud solution offered by UniCloud Africa ensures that the state’s data
            remains within Nigeria’s borders.
          </p>
          <button className=" bg-[#3DC8F91A] px-4 py-2 mx-auto rounded-[30px] block mt-6 text-sm md:text-base">
            <p className=" gradient-text">Technology</p>
          </button>
          <div className=" md:px-[10%]">
            <div
              className=" w-full h-[290px] md:h-[400px] my-12 bg-[#F5F5F4] rounded-[20px]"
              style={{
                backgroundImage: `url(${dsc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
          </div>
          <p
            style={{ whiteSpace: "pre-line" }}
            className=" mt-3 text-base text-[#676767]  text-justify font-normal md:px-[15%] whitespace-pre-line"
          >
            UniCloud Africa, a company specializing in local cloud solutions, has partnered with
            Benue State, North Central Nigeria to construct a state-of-the-art data center and cloud
            ecosystem in Makurdi, the state capital.
            <br />
            <br />
            This agreement, signed in Abuja yesterday, will see UniCloud Africa provide the
            necessary cloud infrastructure for the data center. They’ll also partner with Africa
            Data Centres, a renowned pan-African operator, to establish a disaster recovery site in
            Abuja.
            <br />
            <br />
            Joining UniCloud Africa in this project are several other partners like Cedarview
            Communication Limited, which will be responsible for building the high-availability
            network infrastructure that will connect government institutions and other local
            entities within Benue State.
            <br />
            <br />
            The other partner is SIT Consulting, tasked with developing innovative software
            applications specifically designed to meet the needs of Benue’s users.
            <br />
            <br />
            This project is a significant step forward for Benue’s digital transformation. The
            in-country cloud solution offered by UniCloud Africa ensures that the state’s data
            remains within Nigeria’s borders.
            <br />
            <br />
            Speaking at the signing ceremony, Dr. Joy Smart Francis, Executive Director at UniCloud
            Africa, encouraged other states in Nigeria to follow Benue’s lead in promoting Nigeria’s
            digital economy.
            <br />
            <br />
            She highlighted the benefits of the project to include improved efficiency of Benue’s
            digital ecosystem, enhanced data security for the state government, creation of new
            technical skills and job opportunities for Benue youths and the potential to serve as a
            model for nationwide digitalization and data localization.
            <br />
            <br />
            According to the MOU, the project timeline and additional details are:
            <br />
            <br />
            1. Completion is targeted within six months.
            <br />
            <br />
            2. UniCloud Africa and partners will provide comprehensive support including:
            <br />
            {"  "} i. Technical expertise for construction and operations.
            <br />
            {"  "} ii. Robust data security networks.
            <br />
            {"  "} iii. Backup power systems.
            <br />
            {"  "} iv. High-speed fiber optic connection for disaster recovery.
            <br />
            <br />
            3. Training programs to equip Benue youths and BDIC staff with necessary data center
            management skills.
            <br />
            <br />
            Responding, the Benue State Deputy Governor, His Excellency Dr. Barr. Sam Ode, expressed
            that this collaboration aligns perfectly with Governor Hyacinth Alia’s vision to develop
            the state’s ICT infrastructure and empower its youth. He believes this initiative has
            the potential to unlock a brighter future for Benue and its people.
            <br />
            <br />
            “We are delighted to be part of this initiative, which is capable of putting Benue State
            in a high position in tandem with the Federal Government’s digital economy pursuit,” he
            said.
          </p>
        </div>
        <div className=" mt-16 md:px-[15%] w-full">
          <div className=" w-full h-[300px] md:h-[620px] bg-[#f1f1f1]">
            <iframe
              className=" w-full h-full"
              src="https://www.youtube.com/embed/xxG35LfFgq0"
            ></iframe>
          </div>
        </div>
        <motion.div className=" w-full font-Outfit text-[#fff] mt-16">
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
    </>
  );
};

export default ExtResouce1;
