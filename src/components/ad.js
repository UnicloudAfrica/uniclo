import { motion } from "framer-motion";
import adbg from './assets/adBG.svg';
import admob from './assets/adMob.svg';


const Ads = () => {
    return ( 
        <>
        <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type: 'tween' }}
        className="py-[3em] px-4 md:px-8 lg:px-16 w-full z-10 font-Outfit text-[#fff]"
        >
        <div className="w-full h-[351px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative md:space-y-4">
            <img src={adbg} className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]" alt="" />
            <img src={admob} className="z-10 absolute top-0 h-full w-full object-cover block md:hidden" alt="" />
            <p className="font-semibold text-3xl md:text-5xl">Start today</p>
            <p className="font-normal px-4 md:px-0 text-xl">Sign up now and you'll be up and running on Unicloud Africa in just minutes.</p>
            <button className="px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000] mt-4">Get started now</button>
        </div>
        </motion.div>
        </>
     );
}
 
export default Ads;