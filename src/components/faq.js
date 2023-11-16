import arrowDown from './assets/arrowdown.svg';
import { motion } from "framer-motion";


const Faq = () => {
    return ( 
        <>
        <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type:'tween' }}
        className="py-[3em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-[40px] leading-[50px] text-center">Frequently asked questions?</p>

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

        </motion.div>


        </>
     );
}
 
export default Faq;