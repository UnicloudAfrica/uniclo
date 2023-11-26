import Ads from "../components/ad";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { motion } from "framer-motion";
import office from './assets/office.svg';
import chat from './assets/chat.svg';
import message from './assets/message.svg';
import fb from './assets/facebook.svg';
import linked from './assets/linkedin.svg';
import twi from './assets/twitter.svg';

const Contact = () => {
    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 font-Outfit w-full text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Contact us</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Got a question or need some help? Send us a note to Our Experts</p>

            <motion.div
        className=" my-8 w-full">
            <div className=" w-full p-3 mt-16 md:p-8 border rounded-[30px] border-[#DAE0E6]">
                <p className=" font-medium text-xl md:text-3xl">Have a question, need support. or want to chat?</p>
                <p className=" font-normal mt-3 text-base md:text-lg ">Our friendly team would love to hear from you.</p>
                <div className=" w-full flex mt-8 flex-col md:flex-row justify-between mb-6 space-y-6 md:space-y-0">
                    <span className=" w-full md:w-[48%]">
                        <label className=" font-Outfit text-base text-[#1E1E1EB2] font-medium" for="first-name">First name</label>
                        <input type="text" id="Last Name" placeholder="First Name" class=" h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
                    </span>
                    <span className=" w-full md:w-[48%]">
                        <label className=" font-Outfit text-base text-[#1E1E1EB2] font-medium" for="first-name">Last Name</label>
                        <input type="text" id="mail" placeholder="Last Name" class=" h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
                    </span>
                </div>
                <label className=" font-Outfit text-base text-[#1E1E1EB2] font-medium" for="first-name">Email</label>
                <input type="text" id="phone" placeholder="Enter your email address" class=" h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>

                <label className=" font-Outfit text-base text-[#1E1E1EB2] font-medium" for="Message">Message</label>
                <textarea id="message" rows={6} placeholder="" class=" mb-4 bg-[#F5F5F4] shadow-md shadow-[#1018280D] font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>

                <label className="flex items-center">
                    <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-base text-[#1E1E1E99] font-Outfit font-medium">
                    You agree to our friendly privacy policy.
                    </span>
                </label>

                <button className=" w-full flex h-[45px] mt-6 rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center items-center">
                    <p className=" font-Outfit text-base text-white">Send Message</p>
                </button>
            </div>
        </motion.div>

        <div className=" w-full p-5 mt-16 md:p-8 border rounded-[30px] border-[#DAE0E6] flex flex-col md:flex-row justify-center md:justify-between items-start space-y-6 md:space-y-0">
            <div className=" space-y-2 w-full md:w-1/3">
                <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                    <img src={ office } alt="" />
                </button>
                <p className=" font-medium text-xl">Our head office</p>
                <p className=" text-sm text-[#676767]">Baderinwa Alabi Street, Central Lekki<br></br>Residents' Association, Rahman Adeboyejo<br></br> Street Lekki Phase 1 Lagos, Nigeria</p>
            </div>

            <div className=" space-y-2 w-full md:w-1/3">
                <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                    <img src={ chat } alt="" />
                </button>
                <p className=" font-medium text-xl">Connect with us on</p>
                <p className=" text-sm"> <span className=" block gradient-text">support@unicloudafrica.com</span></p>
            </div>

            <div className=" space-y-2 w-full md:w-1/3">
                <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                    <img src={ message } alt="" />
                </button>
                <p className=" font-medium text-xl">Connect with us on social media</p>
                <span className=" flex space-x-6">
                    <img src={ fb } className=" w-4 h-4" alt="" />
                    <img src={ linked } className=" w-4 h-4" alt="" />
                    <img src={ twi } className=" w-4 h-4" alt="" />
                </span>
            </div>

        </div>
        </div>
        <Ads/>
        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Contact;