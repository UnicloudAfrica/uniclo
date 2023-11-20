import Navbar from '../components/navbar';
import arrowDown from './assets/arrowdown.svg';
import { motion } from "framer-motion";
import adbg from './assets/adBG.svg';
import avatar from './assets/avatar.svg';
import Footer from '../components/footer';


const FaqPage = () => {
    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type:'tween' }}
        className="mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Frequently asked questions?</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl md:px-[12%]">Have questions? we’re here to help.</p>
            <span className=' w-full border-t border-[#1E1E1E1A] py-6 flex justify-between items-center md:mt-16 mt-8'>
                <p className=' text-base md:text-lg font-normal'>How do I create an account on Unicloud Africa?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full border-y border-[#1E1E1E1A] py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>How can I contact your customer support?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full border-y border-[#1E1E1E1A] py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>How do I create an account on Unicloud Africa?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full border-y border-[#1E1E1E1A] py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>What types of cloud computing services are available?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full  py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>What are the benefits of using cloud computing?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full border-t border-[#1E1E1E1A] py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>How do I create an account on Unicloud Africa?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full border-y border-[#1E1E1E1A] py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>How can I contact your customer support?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full border-y border-[#1E1E1E1A] py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>How do I create an account on Unicloud Africa?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full border-y border-[#1E1E1E1A] py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>What types of cloud computing services are available?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

            <span className=' w-full  py-6 flex justify-between items-center'>
                <p className=' text-base md:text-lg font-normal'>What are the benefits of using cloud computing?</p>
                <img 
                src={ arrowDown }
                alt="" />
            </span>

        </motion.div>

        <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type:'tween' }}
        className="  py-[3em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative space-y-4">
                <img src={ adbg } className=" absolute h-[300px]" alt="" />
                <img src={ avatar } className='' alt="" />
                <p className=' font-medium px-4 md:px-0 text-xl'>Still have questions?</p>
                <p className=' font-normal px-4 md:px-0 text-base text-[#FFFFFFCC]'>Can’t find the answer you’re looking for? Please chat to our friendly team.</p>
                <button className=" px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000] mt-4">Get started now</button>
            </div>
        </motion.div>
        </motion.div>
        <Footer/>
        </>
     );
}
 
export default FaqPage;