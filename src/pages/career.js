import { useState, useContext } from 'react';
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import time from './assets/time.svg';
import dollar from './assets/dollar.svg';
import pin from './assets/map-pin.svg';
import arrow from'./assets/arrow-down.svg';
import { PageContext, CareerContext } from '../contexts/contextprovider';

const Career = () => {
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [careerArray] = useContext(CareerContext);

    const handleSelectClick = () => {
        setIsSelectOpen(!isSelectOpen);
    };

    const handleSelectBlur = () => {
        setIsSelectOpen(false);
    };

    // Create separate arrays for each scope
    const softwareDevelopmentArray = careerArray.filter(item => item.scope === 'Software Development');
    const customerSupportArray = careerArray.filter(item => item.scope === 'Customer Support');
    const designArray = careerArray.filter(item => item.scope === 'Design');

    return ( 
        <>
        <Navbar/>
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 font-Outfit w-full text-[#121212]">
            <div className=" flex flex-col items-center">
                <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Career</p>
                <p className=" text-center font-normal mt-3 text-[#676767] md:px-[10%] text-lg md:text-xl ">Want to work with some of the best global talent and build cloud solutions for African enterprises and Government. Join the team — we’re hiring!</p>

                <div className=" flex items-center mx-auto mt-8 space-x-4">
                    <p className=" text-base text-[#676767] font-medium">Location:</p>
                    <div className=" w-full flex border border-[#D0D5DD] rounded-lg p-2.5 space-x-4">
                        <div className="relative w-[169px] flex md:w-[220px]">
                            <img src={ pin } alt="" />
                            <select
                                name=""
                                className="appearance-none text-[#676767] no-focus-outline ml-2"
                                id=""
                                onClick={ handleSelectClick }
                                onBlur={ handleSelectBlur }
                            >
                                <option value="all">View All</option>
                                <option value="">Nigeria</option>
                                <option value="">Ghana</option>
                                <option value="">South Africa</option>
                                <option value="">Liberia</option>
                            </select>
                            <img src={ arrow } className={`absolute right-0 top-[20%] transition-transform ${
                            isSelectOpen ? 'rotate-180' : 'rotate-0'
                        }`} alt=""/>
                        </div>
                    </div>
                </div>
            </div>

            <div 
            className=" mt-16">
                {/* //Design */}
                <div className="border-y py-10">
                    <div className=" flex flex-col lg:flex-row items- justify-around">
                        <div className=" w-full lg:w-[38%] relative space-y-3 lg:space-y-0">
                            <p className=" font-Outfit text-base md:text-xl text-[#121212] font-semibold">Design</p>
                            <p className=" font-Outfit text-sm md:text-base text-[#676767]" >Open positions in our design team.</p>
                        </div>
                        <div className=" w-full mt-4 lg:mt-0 lg:w-[58%] space-y-5">
                            {designArray.map((item, index) => (
                                <div key={index} className="border border-[#EAECF0] rounded-[16px] bg-transparent w-full p-6 space-y-5">             
                                    <div className=" w-full flex justify-between items-center">
                                        <p className=" font-Outfit font-medium text-base md:text-lg">{item.title}</p>
                                        <button className="  px-[10px] py-1 text-white font-Outfit rounded-2xl bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC]"><a target="blank" className=' w-full h-full' href={item.link}>Apply Now</a></button>
                                    </div>
                                    <p className=" text-sm md:text-base text-[#676767] text-opacity-80 font-normal font-Outfit">{item.desc}</p>
                                    <div className=" flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full">
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ time } className="" alt="" />
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.duration}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ dollar } className="" alt="" />
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.pay}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2 items-center">
                                            <p className=" font-Outfit text-[#98A2B3]">Location:</p>
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.location}</p>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* //software */}
                <div className="py-10 border-b">
                    <div className=" flex flex-col lg:flex-row items- justify-around">
                        <div className=" w-full lg:w-[38%] relative space-y-3 lg:space-y-0">
                            <p className=" font-Outfit text-base md:text-xl text-[#121212] font-semibold">Software Development</p>
                            <p className=" font-Outfit text-sm md:text-base text-[#676767] " >Open positions in our software team.</p>
                        </div>
                        <div className=" w-full mt-4 lg:mt-0 lg:w-[58%] space-y-5">
                            {softwareDevelopmentArray.map((item, index) => (
                                <div key={index} className="border border-[#EAECF0] rounded-[16px] bg-transparent w-full p-6 space-y-5">             
                                    <div className=" w-full flex justify-between items-center">
                                        <p className=" font-Outfit font-medium text-base md:text-lg">{item.title}</p>
                                        <button className="  px-[10px] py-1 text-white font-Outfit rounded-2xl bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC]" ><a target="blank" className=' w-full h-full' href={item.link}>Apply Now</a></button>
                                    </div>
                                    <p className=" text-sm md:text-base text-[#676767] text-opacity-80 font-normal font-Outfit">{item.desc}</p>
                                    <div className=" flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full">
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ time } className="" alt="" />
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.duration}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ dollar } className="" alt="" />
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.pay}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2 items-center">
                                            <p className=" font-Outfit text-[#98A2B3]">Location:</p>
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.location}</p>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* //Customer */}
                <div className="py-10">
                    <div className=" flex flex-col lg:flex-row items- justify-around">
                        <div className=" w-full lg:w-[38%] relative space-y-3 lg:space-y-0">
                            <p className=" font-Outfit text-base md:text-xl text-[#121212] font-semibold">Software Development</p>
                            <p className=" font-Outfit text-sm md:text-base text-[#676767] " >Open positions in our software team.</p>
                        </div>
                        <div className=" w-full mt-4 lg:mt-0 lg:w-[58%] space-y-5">
                            {customerSupportArray.map((item, index) => (
                                <div key={index} className="border border-[#EAECF0] rounded-[16px] bg-transparent w-full p-6 space-y-5">             
                                    <div className=" w-full flex justify-between items-center">
                                        <p className=" font-Outfit font-medium text-base md:text-lg">{item.title}</p>
                                        <button className="  px-[10px] py-1 text-white font-Outfit rounded-2xl bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC]"><a target="blank" className=' w-full h-full' href={item.link}>Apply Now</a></button>
                                    </div>
                                    <p className=" text-sm md:text-base text-[#676767] text-opacity-80 font-normal font-Outfit">{item.desc}</p>
                                    <div className=" flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full">
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ time } className="" alt="" />
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.duration}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ dollar } className="" alt="" />
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.pay}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2 items-center">
                                            <p className=" font-Outfit text-[#98A2B3]">Location:</p>
                                            <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">{item.location}</p>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


            </div>
        </div>
        <Footer/>
        </>
     );
}
 
export default Career;