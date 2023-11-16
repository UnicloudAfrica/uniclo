import Footer from "../components/footer";
import Navbar from "../components/navbar";
import arrowdown from './assets/Arrow_Down_Right_LG.svg';
import adbg from './assets/adBG.svg';
import admob from './assets/adMob.svg';
import { motion } from "framer-motion";

const Resources = () => {

    const data = [
        { topic: "Navigating the Cloud", desc: "A Guide for African Businesses" },
        { topic: "A Guide for African Businesses", desc: "Emerging Trends in Africa" },
    ];
    const cases = [
        { topic: "Transforming [Client Name] with Cloud Migration", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
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
            <p className=" font-medium text-[40px] leading-[50px] text-center">Resources</p>
            <p className=" text-center font-normal mt-3 text-xl ">Stay informed and inspired</p>
            <p className=" text-center font-normal mt-1 text-xl ">Explore our blog for insightful articles on cloud trends, best practices, and success stories</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8">
                {data.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <p className="text-left mt-3 text-xl font-medium">{item.topic}</p>
                        <p className="text-left mt-1 text-[#1e1e1e] text-base">{item.desc}</p>
                        <button className=' flex space-x-8 mt-6 items-center'>
                            <p className=' gradient-text text-base'>View more</p>
                            <img src={ arrowdown } className=' w-4 h-4' alt="" />
                        </button>
                    </div>
                ))}
            </div>

            <p className=" mt-16 font-medium text-[40px] leading-[50px] text-center">Use Cases</p>
            <div className=" grid grid-cols-1 w-full mt-8 gap-[32px]">
                {cases.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[15px]"></div>
                        <p className="text-left mt-3 text-xl font-medium">{item.topic}</p>
                        <p className="text-left mt-1 text-[#1e1e1e] text-base">{item.content}</p>
                    </div>
                ))}
            </div>

            <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, type:'tween' }}
            className="  py-[3em] w-full font-Outfit text-[#fff]">
                <div className=" w-full h-[351px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative md:space-y-4">
                    <img src={adbg} className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]" alt="" />
                    <img src={admob} className="z-10 absolute top-0 h-full w-full object-cover block md:hidden" alt="" />
                    <p className=' font-semibold text-3xl'>Join our webinars and access whitepapers </p>
                    <p className=' font-normal px-4 md:px-0 text-xl'>We offer in-depth knowledge on cloud technologies and implementation.</p>
                    <div className=" flex items-center justify-center z-20  mt-4 space-x-6">
                        <input className=" h-[52px] bg-[#133D4C80] p-2.5 text-base font-Outfit  rounded-[30px]" type="text" />
                        <button className=" px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">Subscribe</button>
                    </div>
                </div>
            </motion.div>

        </div>
        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Resources;