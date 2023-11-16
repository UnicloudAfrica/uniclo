import Footer from "../components/footer";
import Navbar from "../components/navbar";
import search from "./assets/search-normal.svg";
import adbg from './assets/adBG.svg';
import admob from './assets/adMob.svg';
import { motion } from "framer-motion";

const Blog = () => {

    const blog = [
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"App Development" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"App Development" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Web Development" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Web Development" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Web Development" },
        { title: "Transforming [Client Name] with Cloud Migration", desc: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing.......", date:'September 24th, 2023.', tag:"Web Development" },
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
        <div className="mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-[40px] leading-[50px] text-center">Our Blog</p>
            <p className=" text-center font-normal mt-3 text-xl ">Explore Our Latest Blog Posts</p>
            <div className=" w-full flex justify-between items-center relative">
                <select name="" id="" className=" px-6 py-3 border text-base border-[#EAEBF0] flex justify-center rounded-[10px] custom-dropdown w-[250px]">
                    <option value="">All Categories</option>
                </select>

                <input  placeholder="Search blog posts" className="px-6 py-3 border text-base placeholder:text-[#1e1e1e] border-[#EAEBF0] flex justify-center rounded-[10px] w-[250px] relative" type="text"/>
                    <img src={ search } className=" right-6 top-[30%] absolute" alt="" />
            </div>

            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-16 mb-[12em]">
                {blog.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto rounded-[30px] block mt-6 text-base">
                            <p className=" gradient-text">{item.tag}</p>
                        </button>
                        <p className="text-left mt-6 text-2xl font-medium">{item.title}</p>
                        <p className="text-left mt-3 text-[#1E1E1E99] text-sm">{item.desc}</p>
                        <p className="text-left mt-3 text-[#121212] font-medium text-base">{item.date}</p>
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
                    <p className=' font-semibold text-3xl'>Want product news and updates</p>
                    <p className=' font-normal px-4 md:px-0 text-xl'>Subscribe to Unicloud Africa blog to get update right in your inbox</p>
                    <div className=" flex items-center justify-center z-20  mt-4 space-x-6">
                        <input placeholder="Enter Email" className=" h-[52px] bg-[#133D4C80] p-2.5 text-base placeholder:text-white placeholder:font-Outfit font-Outfit  rounded-[30px]" type="text" />
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
 
export default Blog;