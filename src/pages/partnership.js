import Footer from "../components/footer";
import Navbar from "../components/navbar";
import adbg from './assets/adBG.svg';
import admob from './assets/adMob.svg';
import { motion } from "framer-motion";

const Partnership = () => {

    const data = [
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
        { name: "Company’s name ", img: "img" },
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
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Partnerships</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">We're proud to collaborate with industry leaders to deliver unmatched cloud solutions</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px] lg:gap-[5%] w-full mt-8">
                {data.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[250px] bg-[#F5F5F4] border border-[#F5F5F7] rounded-[20px]"></div>
                        <p className=" mt-3 text-xl font-medium">{item.name}</p>
                    </div>
                ))}
            </div>
        </div>

        <p className=' mt-[6em] md:mt-[10em] text-center font-normal px-4 md:px-[12%] text-lg md:text-xl'>Our partnerships enable us to provide you with the best-in-class cloud services that drive business transformation.</p>

        <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type:'tween' }}
        className="  my-[5em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[380px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative space-y-4">
                    <img src={adbg} className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]" alt="" />
                    <img src={admob} className="z-10 absolute top-0 h-full w-full object-cover block md:hidden" alt="" />
                <p className=' font-semibold text-3xl md:text-5xl'>Partner with us today</p>
                <p className=' font-normal px-4 md:px-0 text-xl'>Partner with us to deliver unmatched cloud solutions.</p>
                <button className=" px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000] mt-4">Contact Us</button>
            </div>
        </motion.div>

        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Partnership;