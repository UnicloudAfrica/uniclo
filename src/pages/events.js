import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { motion } from "framer-motion";
import admob from './assets/adMob.svg';

const Events = () => {

    const events = [
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Past Event" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Past Event" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Upcoming Event" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Ongoing Event" },
    ];


    return ( 
        <>
        <Navbar/>
        <motion.div
        initial={{x:100, opacity:0}}
        animate={{x:0, opacity:1}}
        exit={{x:-100, opacity:0}}
        transition={{type:'spring', stiffness:80, duration:0.2}}
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-[40px] leading-[50px] text-center">Events</p>
            <p className=" text-center font-normal mt-3 text-xl ">Discover Upcoming Events</p>

            <div className=" mt-10 w-full h-[300px] flex">
                <div className=" w-[65%] bg-[#f5f5f4] p-6 rounded-l-[30px]">
                    <button className=" bg-[#3DC8F91A] rounded-[30px] px-6 py-3 text-center font-normal text-lg">
                    <p className="gradient-text">Trending Event</p>
                    </button>
                </div>
                <div className=" w-[35%] relative bg-gradient-to-r border-l-2 border-dashed border-[#FFFFFF] rounded-r-[30px] from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] p-6">
                    <p className=" text-white font-medium text-2xl">Transforming [Client Name] with Cloud Migration</p>
                    <p className=" text-[#FFFFFFCC] text-sm mt-6">Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......</p>
                    <p className=" absolute bottom-6 left-6 text-base text-white">September 24th, 2023.</p>
                    <img src={admob} className="z-10 absolute top-0 left-0 h-full w-full object-cover block" alt="" />
                </div>
            </div>

            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-16 mb-[6em]">
                {events.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto rounded-[30px] block mt-6 text-base">
                            <p className=" gradient-text">{item.tag}</p>
                        </button>
                        <p className="text-left mt-6 text-2xl font-medium">{item.title}</p>
                        <p className="text-left mt-3 text-[#1E1E1E99] text-sm">{item.desc}</p>
                        <p className="text-left mt-3 text-[#121212] font-medium text-base">{item.date}</p>
                        <button className=" block mr-auto rounded-[30px] text-white font-semibold text-base mt-4 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] py-3 px-16">Book event</button>
                    </div>
                ))}
            </div>

        </div>
        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Events;