import { useState, useContext } from 'react';
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import time from './assets/time.svg';
import dollar from './assets/dollar.svg';
import pin from './assets/map-pin.svg';
import arrow from'./assets/arrow-down.svg';
import { PageContext, CareerContext } from '../contexts/contextprovider';
import { Link } from 'react-router-dom';

const Career = () => {
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [careerArray] = useContext(CareerContext);
    const [selectedLocation, setSelectedLocation] = useState('all'); // Initialize with 'all'

    const handleSelectClick = () => {
        setIsSelectOpen(!isSelectOpen);
    };

    const handleSelectBlur = () => {
        setIsSelectOpen(false);
    };
    const handleLocationChange = (e) => {
        setSelectedLocation(e.target.value);
    };

    const filteredCareers = careerArray.filter((item) => {
        if (selectedLocation === 'all') {
            return true; // Show all items when 'all' is selected
        } else {
            return item.location === selectedLocation;
        }
    });

    return ( 
        <>
        <Navbar/>
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 font-Outfit w-full text-[#121212]">
            <div className=" flex flex-col items-center">
                <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Career</p>
                <p className=" text-center font-normal mt-3 text-[#676767] md:px-[10%] text-lg md:text-xl ">Want to work with some of the best global talent and build cloud solutions for African enterprises and Government. Join the team — we’re hiring!</p>

                {/* <div className=" flex items-center mx-auto mt-8 space-x-4">
                    <p className=" text-base text-[#676767] font-medium">Location:</p>
                    <div className=" w-full flex border border-[#D0D5DD] rounded-lg p-2.5 space-x-4">
                        <div className="relative w-[169px] flex md:w-[220px]">
                            <img src={ pin } alt="" />
                            <select
                                name=""
                                className="appearance-none text-[#676767] w-[169px] flex md:w-[220px] bg-transparent no-focus-outline ml-2"
                                id=""
                                onClick={ handleSelectClick }
                                onBlur={ handleSelectBlur }
                                onChange={handleLocationChange}
                            >
                                <option value="all">View All</option>
                                <option value="Nigeria">Nigeria</option>
                                <option value="Ghana">Ghana</option>
                                <option value="South Africa">South Africa</option>
                                <option value="Liberia">Liberia</option>
                            </select>
                            <img src={ arrow } className={`absolute right-0 top-[20%] transition-transform ${
                            isSelectOpen ? 'rotate-180' : 'rotate-0'
                        }`} alt=""/>
                        </div>
                    </div>
                </div> */}
            </div>

            <div 
            className=" mt-16">
                <div className="">
                    <div className=" flex flex-col justify-around">
                        {/* <div className=" w-full mt-4 space-y-5">
                            {filteredCareers.map((item, index) => (
                                <Link to={`/careers/${item.id}`}><div key={index} className="border border-[#EAECF0] hover:bg-[#F5F5F4] rounded-[16px] bg-transparent w-full p-6 space-y-5 mb-6">             
                                    <div className=" w-full flex justify-between items-center">
                                        <p className=" font-Outfit font-medium text-base md:text-lg">{item.title}</p>
                                        <p className=' text-[#676767] font-Outfit text-base'>Posted: <span>{item.date}</span></p>
                                    </div>
                                    <p className=" text-sm md:text-base text-[#676767] text-opacity-80 font-normal font-Outfit">{item.desc}</p>
                                    <div className=" flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full">
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ time } className="" alt="" />
                                            <p className=" font-Outfit text-[#676767] md:text-base text-sm font-medium">{item.duration}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2">
                                            <img src={ dollar } className="" alt="" />
                                            <p className=" font-Outfit text-[#676767] md:text-base text-sm font-medium">{item.pay}</p>
                                        </span>
                                        <span className=" flex flex-row space-x-2 items-center">
                                            <p className=" font-Outfit text-[#676767]">Location:</p>
                                            <p className=" font-Outfit text-[#676767] md:text-base text-sm font-medium">{item.location}</p>
                                        </span>
                                    </div>
                                </div></Link>
                            ))}
                        </div> */}
                        <p className=' font-medium text-4xl capitalize text-center mb-16'>No Job Listings at this moment</p>
                    </div>
                    
                </div>
            </div>
        </div>
        <Footer/>
        </>
     );
}
 
export default Career;