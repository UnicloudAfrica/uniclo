import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { motion } from "framer-motion";
import admob from "./assets/adMob.svg";
import { useContext } from "react";
import { EventsContext } from "../contexts/contextprovider";
import noevent from "./assets/noevent.svg";
import adbg from "./assets/adBG.svg";
import { Link } from "react-router-dom";

const Events = () => {
  const events = [
    {
      title: "Transforming [Client Name] with Cloud Migration",
      desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......",
      date: "September 24th, 2023.",
      tag: "Past Event",
    },
    {
      title: "Transforming [Client Name] with Cloud Migration",
      desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......",
      date: "September 24th, 2023.",
      tag: "Past Event",
    },
    {
      title: "Transforming [Client Name] with Cloud Migration",
      desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......",
      date: "September 24th, 2023.",
      tag: "Upcoming Event",
    },
    {
      title: "Transforming [Client Name] with Cloud Migration",
      desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......",
      date: "September 24th, 2023.",
      tag: "Ongoing Event",
    },
  ];
  const [eventsArray] = useContext(EventsContext);

  return (
    <>
      <Navbar />
      <motion.div>
        <div>
          {eventsArray.length === 0 ? (
            <div className=" mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212] flex flex-col justify-center items-center">
              <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
                Events
              </p>
              <p className=" text-center font-normal mt-3 text-xl md:px-[15%] text-[#676767]">
                Join us for inspiring events and workshops that will help you take your business to
                the next level.
              </p>
              <img src={noevent} className=" w-[60%] md:w-[45%] mt-16" alt="" />
              <p className=" mt-16 text-center text-2xl font-medium">No Upcoming Events</p>
              <p className=" mt-3 text-[#676767] md:px-[15%] text-base font-normal text-center">
                We are currently not hosting any upcoming events. Please check back soon for our
                latest event schedule.
              </p>

              <motion.div className=" mt-16 w-full font-Outfit text-[#fff]">
                <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] p-6 relative md:space-y-2">
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
                  <p className=" font-semibold text-2xl md:text-3xl">
                    Join our webinars and access whitepapers{" "}
                  </p>
                  <p className=" font-normal px-4 md:px-0 text-base md:text-xl">
                    We offer in-depth knowledge on cloud technologies and implementation.
                  </p>
                  <div className=" flex flex-col md:flex-row items-center justify-center z-20  mt-5 md:space-x-6 space-y-4 pt-3 md:space-y-0">
                    <input
                      placeholder="Enter Email"
                      className=" w-full md:w-auto h-[52px] bg-[#133D4C80] py-2.5 px-4 md:px-7 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]"
                      type="text"
                    />
                    <button className=" w-full md:w-auto px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">
                      Subscribe
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            // Render your normal content when eventsArray is not empty
            <div>
              {
                <div className=" mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
                  <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
                    Events
                  </p>
                  <p className=" text-center font-normal mt-3 text-xl md:px-[15%] text-[#676767]">
                    Join us for inspiring events and workshops that will help you take your business
                    to the next level.
                  </p>

                  <div className=" mt-10 w-full h-[300px] flex flex-col md:flex-row ">
                    <div className=" w-full h-full md:w-[65%] md:h-auto bg-[#f5f5f4] p-6 rounded-t-[30px] md:rounded-t-0 md:rounded-tr-[0px] md:rounded-l-[30px]">
                      <button className=" bg-[#3DC8F91A] rounded-[30px] px-6 py-3 text-center font-normal text-lg">
                        <p className="gradient-text">Trending Event</p>
                      </button>
                    </div>
                    <div className=" w-full md:w-[35%] relative bg-gradient-to-r rounded-b-[30px] md:rounded-b-0 md:rounded-bl-[0px] md:border-l-2 border-dashed border-[#FFFFFF] md:rounded-r-[30px] from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] p-6">
                      <p className=" text-white font-medium text-xl md:text-2xl">
                        Transforming [Client Name] with Cloud Migration
                      </p>
                      <p className=" text-[#FFFFFFCC] text-sm mt-3 md:mt-6 mb-6">
                        Unlocking the Power of Cloud Computing Unlocking the Power of Cloud
                        Computing Unlocking the Power of Cloud Computing Unlocking the Power of
                        Cloud Computing.......
                      </p>
                      <p className=" absolute bottom-3 md:bottom-6 left-6 text-base text-white">
                        September 24th, 2023.
                      </p>
                      <img
                        src={admob}
                        className="z-10 absolute top-0 left-0 h-full w-full object-cover block"
                        alt=""
                      />
                    </div>
                  </div>

                  <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-[6em] mb-[6em]">
                    {events.map((item, index) => (
                      <div key={index} className="w-full text-center">
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto rounded-[30px] block mt-6 text-base">
                          <p className=" gradient-text">{item.tag}</p>
                        </button>
                        <p className="text-left mt-6 text-xl/ md:text-2xl font-medium">
                          {item.title}
                        </p>
                        <p className="text-left mt-3 text-[#1E1E1E99] text-sm">{item.desc}</p>
                        <p className="text-left mt-3 text-[#121212] font-medium text-base">
                          {item.date}
                        </p>
                        <button className=" block w-full md:w-auto mr-auto rounded-[30px] text-white font-semibold text-base mt-4 bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] py-3 px-16">
                          Book event
                        </button>
                      </div>
                    ))}
                  </div>

                  <motion.div className="  py-[3em] w-full font-Outfit text-[#fff]">
                    <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] p-6 relative">
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
                      <p className=" font-semibold text-2xl md:text-3xl">
                        Join our webinars and access whitepapers{" "}
                      </p>
                      <p className=" font-normal px-4 md:px-0 text-base md:text-xl">
                        We offer in-depth knowledge on cloud technologies and implementation.
                      </p>
                      <div className=" flex flex-col md:flex-row items-center justify-center z-20  mt-4 md:space-x-6 space-y-4 md:space-y-0">
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
              }
            </div>
          )}
        </div>
        <Footer />
      </motion.div>
    </>
  );
};

export default Events;
