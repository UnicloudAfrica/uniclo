import Footer from "../components/footer";
import Navbar from "../components/navbar";
import adbg from './assets/adBG.svg';
import admob from './assets/adMob.svg';
import { motion } from "framer-motion";
import {useContext} from 'react'
import { PartnerContext } from '../contexts/contextprovider';
import { Link } from "react-router-dom";

const Partnership = () => {

    const [partnerArray] = useContext(PartnerContext);
    

    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Partnerships</p>
            <p className=" text-center font-normal mt-3 text-lg text-[#676767] md:text-xl ">We're proud to collaborate with industry leaders to deliver unmatched cloud solutions</p>
            <div className=" mt-8 flex flex-wrap justify-around space-y-4 space-x-0 md:space-x-[24px]">
            {partnerArray.map((item, index) => (
                <div key={index} className=" text-center w-full md:w-[250px]">
                    <div className="w-full h-[250px] bg-[#F5F5F4] border border-[#F5F5F7] rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <p className="mt-3 text-xl font-medium">{item.name}</p>
                </div>
            ))}
            </div>

        </div>

        <p className=' mt-8 font-Outfit text-center font-normal px-4 text-[#676767] md:px-[12%] text-lg md:text-xl'>Our partnerships enable us to provide you with the best-in-class cloud services that drive business transformation.</p>

        <motion.div 
        className="  my-[5em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[380px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative">
                    <img src={adbg} className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]" alt="" />
                    <img src={admob} className="z-10 absolute top-0 h-full w-full object-cover block md:hidden" alt="" />
                <p className=' font-semibold text-3xl md:text-4xl'>Partner with us today</p>
                <p className=' font-normal px-4 md:px-0 text-xl'>Partner with us to deliver unmatched cloud solutions.</p>
                <Link to='/contact' className=" z-20"><button className=" px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000] mt-4">Contact Us</button></Link>
            </div>
        </motion.div>

        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Partnership;