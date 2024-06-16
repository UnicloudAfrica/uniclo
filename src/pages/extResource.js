import Footer from "../components/footer";
import Navbar from "../components/navbar";
import data24 from "./assets/data24.jpg";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ExtResouce = () => {
  return (
    <>
      <Navbar />
      <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
        <div>
          <p className="gradient-txt text-center font-medium text-base">
            Published by Graphic.com.gh
          </p>
          <p className="font-medium text-2xl md:text-[40px] md:leading-[50px] mt-3 md:px-[12%] text-center">
            Africa Data Centres and Onix Data Centre announce partnership
          </p>
          <p className="font-medium text-lg md:text-xl mt-3 md:px-[12%] text-center text-[#676767]">
            Ghana is set to become a key player in the continent's data storage
            revolution as Africa Data Centres joins forces with Onix Data Centre
            in a strategic partnership.
          </p>
          <button className=" bg-[#3DC8F91A] px-4 py-2 mx-auto rounded-[30px] block mt-6 text-sm md:text-base">
            <p className=" gradient-text">Technology</p>
          </button>
          <div className=" md:px-[10%]">
            <div
              className=" w-full h-[290px] md:h-[400px] my-12 bg-[#F5F5F4] rounded-[20px]"
              style={{
                backgroundImage: `url(${data24})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
          </div>
          <p
            style={{ whiteSpace: "pre-line" }}
            className=" mt-3 text-base text-[#676767]  text-justify font-normal md:px-[15%] whitespace-pre-line"
          >
            This collaboration marks a significant milestone for Africa Data
            Centres, as they strive to extend their reach across the continent
            and offer world-class data solutions.
            <br />
            <br />
            The deal will primarily focus on Ghana, but also explore mutually
            beneficial opportunities in other West African markets where Africa
            Data Centres currently lacks a physical presence. This strategic
            move allows them to offer customers a wider geographical reach,
            enhanced expertise, and a seamless experience across multiple
            locations.
            <br />
            <br />
            Dr. Krishnan Ranganath, Regional Executive for West Africa at Africa
            Data Centres, spoke at the signing ceremony in Accra last Friday. He
            highlighted the partnership's potential to provide clients with
            exceptional data services, leveraging innovative technologies and
            sustainable practices to effectively serve the West African market.
            <br />
            <br />
            Looking beyond Ghana, Dr. Ranganath also sees this collaboration as
            a stepping stone towards a more robust African data storage
            landscape, promoting data sovereignty within the continent.
            <br />
            <br />
            The benefits extend beyond just data centres. Yen Choi, CEO of Onix
            Data Centre, emphasised the positive impact for various sectors,
            including financial institutions, online gamers, travel agencies,
            and social media influencers. He explained how the Ghanaian data
            centre will significantly improve the performance of internet-based
            platforms throughout the country.
            <br />
            <br />
            The world-class nature of the facility was further emphasised by Mr.
            Choi. He stated that the data centre boasts the same level of
            quality as those used by tech giants like Facebook and Google.
            <br />
            <br />
            The importance of local data storage for African nations was further
            underscored by Ladi Okuneye, CEO of UniCloud Africa. He stressed the
            critical role data plays in today's world, likening it to "the next
            oil globally." According to Mr. Okuneye, the ability for African
            countries to store their own data is becoming increasingly vital as
            its value continues to rise.
            <br />
            <br />
            This partnership between Africa Data Centres and Onix Data Centre
            signifies a significant step forward for Ghana and West Africa in
            the ever-evolving world of data storage. As Africa's digital
            landscape continues to flourish, this focus on local solutions is
            likely to become even more prominent.
          </p>
        </div>
        <div className=" mt-16 md:px-[15%] w-full">
          <div className=" w-full h-[290px] md:h-[400px] bg-[#f1f1f1]">
            <iframe
              className=" w-full h-full"
              src="https://www.youtube.com/embed/gulR52moU0k"
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
            <p className=" font-semibold text-xl md:text-3xl">
              Want product news and updates
            </p>
            <p className=" font-normal px-4 md:px-0 text-lg md:text-xl">
              Subscribe to UniCloud Africa blog to get update right in your
              inbox
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

export default ExtResouce;
