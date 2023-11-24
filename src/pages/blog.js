import Footer from "../components/footer";
import Navbar from "../components/navbar";
import search from "./assets/search-normal.svg";
import adbg from './assets/adBG.svg';
import admob from './assets/adMob.svg';
import { motion } from "framer-motion";
import {useContext} from 'react'
import { BlogContext } from '../contexts/contextprovider';
import { Link } from 'react-router-dom';

const Blog = () => {


    const [blogArray] = useContext(BlogContext);


    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <div className="mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our Blog</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Explore Our Latest Blog Posts</p>
            <div className=" w-full flex justify-between items-center relative mt-6">
                <select name="" id="" className="  px-3 md:px-6 py-3 border text-xs md:text-base border-[#EAEBF0] flex justify-center rounded-[10px] custom-dropdown w-[140px]  md:w-[250px]">
                    <option value="">All Categories</option>
                </select>

                <input  placeholder="Search blog posts" className=" px-3 md:px-6 py-3 border text-xs md:text-base placeholder:text-[#1e1e1e] border-[#EAEBF0] flex justify-center rounded-[10px] w-[140px]  md:w-[250px] relative" type="text"/>
                    <img src={ search } className=" right-3 top-[35%] md:right-6 md:top-[30%] absolute w-3 h-3 md:w-auto md:h-auto" alt="" />
            </div>

            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-16 mb-[12em]">
                {blogArray.map((item, index) => (
                    <Link to={`/blogs/${item.id}`}><div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto rounded-[30px] block mt-6 text-sm md:text-base">
                            <p className=" gradient-text">{item.tag}</p>
                        </button>
                        <p className="text-left mt-6 text-xl md:text-2xl font-medium">{item.title.substring(0,40) + '...'}</p>
                        <p className="text-left mt-3 text-[#1E1E1E99] text-sm">{item.content.substring(0,190) + '...'}</p>
                        <p className="text-left mt-3 text-[#121212] font-medium text-base">{item.date}</p>
                    </div></Link>
                ))}
            </div>

            <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, type:'tween' }}
            className="  py-[3em] w-full font-Outfit text-[#fff]">
                <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative md:space-y-4">
                    <img src={adbg} className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]" alt="" />
                    <img src={admob} className="z-10 absolute top-0 h-full w-full object-cover block md:hidden" alt="" />
                    <p className=' font-semibold text-xl md:text-3xl'>Want product news and updates</p>
                    <p className=' font-normal px-4 md:px-0 text-lg md:text-xl'>Subscribe to Unicloud Africa blog to get update right in your inbox</p>
                    <div className=" flex flex-col md:flex-row items-center justify-center z-20  mt-4 md:space-x-6 space-y-4 md:space-y-0">
                        <input placeholder="Enter Email" className=" w-full md:w-auto h-[52px] bg-[#133D4C80] p-2.5 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]" type="text" />
                        <button className=" w-full md:w-auto px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">Subscribe</button>
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