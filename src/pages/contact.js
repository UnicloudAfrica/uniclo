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
import arrow from'./assets/arrow-down.svg';
import { useState, useEffect } from 'react';
import { countries } from 'countries-list';

const Contact = () => {

    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [completePhoneNumber, setCompletePhoneNumber] = useState('');
    const [countryList, setCountryList] = useState([]);

    const handleSelectClick = () => {
        setIsSelectOpen(!isSelectOpen);
    };

    const handleSelectBlur = () => {
        setIsSelectOpen(false);
    };


    useEffect(() => {
        // Extract country data from the countries-list package
        const country = Object.entries(countries).map(([code, details]) => ({
          code,
          name: details.name,
          phone: details.phone,
        }));
    
        setCountryList(country);
    }, [countries]);

    const handleCountryChange = (e) => {
        const selectedCode = e.target.value;
        setSelectedCountry(selectedCode);
        
        // Set the initial part of the phone number based on the selected country's code
        const countryCode = countryList.find(country => country.code === selectedCode);
        setPhoneNumber(countryCode ? countryCode.code : ''); 
    };
    
    const handlePhoneNumberChange = (e) => {
        // Extract the part of the phone number after the country code
        const enteredPhoneNumber = e.target.value.replace(`+${selectedCountry} `, '');
    
        // Update the phone number state with the entered part
        setPhoneNumber(enteredPhoneNumber);
        setCompletePhoneNumber(`+${selectedCountry} ${enteredPhoneNumber}`);
    };


    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 font-Outfit w-full text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Contact us</p>
            <p className=" text-center font-normal mt-3 text-[#000000CC] md:px-[10%] text-lg md:text-xl ">Ready to transform your business in the cloud? Contact UniCloud Africa now for secure, scalable, and reliable solutions. Let's shape your digital future together!</p>

            <motion.div
        className=" my-8 w-full">
            <div className=" w-full p-3 mt-16 md:p-8 border rounded-[30px] border-[#DAE0E6]">
                <p className=" font-medium text-xl md:text-3xl">Have a question, need support, or want to chat?</p>
                <p className=" font-normal mt-3 text-base md:text-lg text-[#1E1E1ECC] ">Our friendly team would love to hear from you.</p>
                <div className="relative w-[169px]">
                    <select
                        name=""
                        className="appearance-none text-[#676767] text-sm px-4 py-[10px] border border-[#D0D5DD] rounded-[8px] mt-8"
                        id=""
                        onClick={ handleSelectClick }
                        onBlur={ handleSelectBlur }
                    >
                        <option value="">Reason of contact</option>
                        <option value="">Inquiry</option>
                        <option value="">Business</option>
                        <option value="">Partnerships</option>
                        <option value="">Infrastructure Deployment</option>
                    </select>
                    <img src={ arrow } className={`absolute right-0 top-[61%] transition-transform ${
                    isSelectOpen ? 'rotate-180' : 'rotate-0'
                }`} alt=""/>
                </div>

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

                <div className=" w-full flex mt-8 flex-col md:flex-row justify-between mb-6 space-y-6 md:space-y-0">
                    <span className=" w-full md:w-[48%]">
                        <label className=" font-Outfit text-base text-[#1E1E1EB2] font-medium" for="first-name">Email</label>
                        <input type="text" id="Last Name" placeholder="Enter email address" class=" h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
                    </span>
                    <span className=" w-full md:w-[48%]">
                        <label className=" font-Outfit text-base text-[#1E1E1EB2] font-medium" for="first-name">Phone</label>
                        <div className=" mt-2 flex h-[45px] w-full bg-[#F5F5F4] text-base font-normal shadow-md shadow-[#1018280D]">
                            <select value={selectedCountry} onChange={handleCountryChange} className=" text-[#1E1E1E33] w-[20%] p-2.5 bg-transparent focus:border-0 focus:border-[#DAE0E6]">
                            <option value="">Select Country</option>
                            {countryList.map((country, index) => (
                                <option key={index} value={country.phone}>
                                {country.code +'  '+ '+'+ country.phone}
                                </option>
                            ))}
                            </select>

                            <input
                            type="tel"
                            value={selectedCountry !== '' ? `+${selectedCountry} ${phoneNumber}` : phoneNumber}
                            onChange={(e) => handlePhoneNumberChange(e)}
                            // onInput={}
                            placeholder="Enter your phone number"
                            className=" w-[80%] p-2.5 bg-transparent text-[#1E1E1E33]"
                            />
                        </div>

                    </span>
                </div>

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

        <div className=" w-full p-5 mt-16 md:p-8 border rounded-[30px] border-[#DAE0E6] flex flex-col lg:flex-row justify-center md:justify-between items-start space-y-6 lg:space-y-0">
            <div className=" space-y-2 w-full lg:w-1/3">
                <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                    <img src={ office } alt="" />
                </button>
                <p className=" font-medium text-xl">Our head office</p>
                <p className=" text-sm text-[#676767]">Baderinwa Alabi Street, Central Lekki<br></br>Residents' Association, Rahman Adeboyejo<br></br> Street Lekki Phase 1 Lagos, Nigeria</p>
            </div>

            <div className=" space-y-2 w-full lg:w-1/3">
                <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                    <img src={ chat } alt="" />
                </button>
                <p className=" font-medium text-xl">Connect with us on</p>
                <p className=" text-sm"> <span className=" block gradient-text">support@unicloudafrica.com</span></p>
            </div>

            <div className=" space-y-2 w-full lg:w-1/3">
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