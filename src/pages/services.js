import Footer from "../components/footer";
import Navbar from "../components/navbar";
import arrowdown from './assets/Arrow_Down_Right_LG.svg';
import cpu from './assets/cpu-setting.svg';
import driver from './assets/driver-refresh.svg';
import cloud from './assets/cloud-add.svg';
import connect from './assets/cloud-connection.svg';
import charge from './assets/cpu-charge.svg';
import chart from './assets/presention-chart.svg';
import drivere from './assets/driver.svg';
import message from './assets/message-programming.svg';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { useState } from 'react';
import { motion } from "framer-motion";
import mark from './assets/mark.svg';
import {useContext} from 'react'
import { CasesContext } from '../contexts/contextprovider';
import { Link } from 'react-router-dom';
import adbg from './assets/adBG.svg';
import admob from './assets/adMob.svg';

const Services = () => {

    const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);



    // toggle between monthly and yearly

    const [activeButton, setActiveButton] = useState('Monthly');

    const handleButtonClick = (buttonName) => {
        setActiveButton(buttonName);
    };

    const [casesArray] = useContext(CasesContext);
    const data = [
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "Provision of  scalable and customizable virtualized infrastructure resources.", img: cpu },
        { topic: "Platform-as-a-Service (PaaS)", content: "Offering a platform for application development, deployment, and management.", img: driver },
        { topic: "Data Storage and Backup", content: "Providing secure and reliable data storage options with redundancy and backup capabilities.", img: cloud },
        { topic: "Multi-Cloud and Hybrid Cloud Support", content: "Facilitating integration with other cloud platforms and on-premises infrastructure.", img: connect },
        { topic: "High Availability and Scalability", content: "Offering scalable resources and automatic load balancing for high availability and performance.", img: charge},
        { topic: "Analytics and Business Intelligence", content: "Enabling data analysis, and reporting for valuable insights and decision-making.", img: chart },
        { topic: "Cloud Marketplace and Partner Ecosystem", content: "Establishing a marketplace for third-party applications and services from trusted partners.", img: drivere },
        { topic: "Developer Tools and APIs", content: "Offering development tools, SDKs, and APIs for application integration and development.", img: message }
    ];


    const plan = [
        { plan: "Starter", price: "10", desc: "Perfect for small businesses and individuals who need basic cloud services. ", storage:"1 GB of storage", core: "1 CPU core", ram: "1 GB of RAM."},
        { plan: "Lite", price: "20", desc: "Ideal for small to medium-sized businesses who need more resources than the Starter plan.", storage:"5 GB of storage", core: "2 CPU core", ram: "2 GB of RAM."},
        { plan: "Professional", price: "50", desc: "Designed for businesses that need the most powerful cloud services.", storage:"20 GB of storage", core: "4 CPU core", ram: "4 GB of RAM."},
    ];

    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our Services</p>
            <p className=" text-center font-normal text-[#676767] mt-1 text-lg md:text-xl ">Discover a range of cloud services that empower your business to grow and succeed</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[32px] w-full mt-12">
                {data.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full bg-gradient-to-r from-[#288DD11A] to-[#3FE0C81A] relative md:h-[300px] rounded-[20px] p-6">
                            <img src={ item.img } className=" w-16 h-16" alt="" />
                            <p className="text-left mt-6 text-lg md:text-xl font-medium">{item.topic}</p>
                            <p className="text-left mt-1 text-[#1E1E1ECC] text-sm">{item.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center mt-16">Payment Plan</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Our payment structure ensures you know exactly what you are paying for without any hidden fee.</p>
            <div className=" flex justify-center items-center mt-8">
                <div className=" bg-[#EAEBF0] rounded-[20px]">
                    <button
                        className={`font-medium font-Outfit text-sm py-2 px-5 rounded-[20px] transition-all ${
                            activeButton === 'Monthly'
                                ? ' bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] text-[#121212]'
                                : ''
                        }`}
                        onClick={() => {handleButtonClick('Monthly')}}
                    >
                    Monthly
                    </button>
                    <button
                    className={`font-medium font-Outfit text-sm py-2 px-5 rounded-[20px] transition-all ${
                        activeButton === 'Yearly'
                            ? ' bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] text-[#121212]'
                            : ''
                    }`}
                    onClick={() => {handleButtonClick('Yearly')}}
                    >
                    Yearly
                    </button>
                </div>
            </div>
            <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]">
                {plan.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full bg-[#F5F5F4] rounded-[20px] p-6">
                            <p className="text-left mt-6 text-xl font-medium">{item.plan+" "+'Plan'}</p>
                            <p className="text-left mt-1 text-[#1E1E1E] text-base"><span className=" text-4xl text-[#121212]">${item.price}</span>/Month</p>
                            <p className=" text-left text-xs mt-3">{item.desc}</p>
                            <p className=" mt-6 text-base text-left">Includes:</p>
                            <div className=" mt-2 space-y-2">
                                <span className=" flex items-center space-x-2 text-sm">
                                    <img src={ mark } alt="" />
                                    <p className="">{item.storage}</p>
                                </span>
                                <span className=" flex items-center space-x-2 text-sm">
                                    <img src={ mark } alt="" />
                                    <p className="">{item.core}</p>
                                </span>
                                <span className=" flex items-center space-x-2 text-sm">
                                    <img src={ mark } alt="" />
                                    <p className="">{item.ram}</p>
                                </span>
                            </div>
                            <button className=' mt-4 flex bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] w-full justify-center rounded-[30px] py-3 items-center'>
                                <p className=' text-[#121212] text-base'>Get Started</p>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] mt-[64px] text-center">Use Cases</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Explore our case studies to see how our solutions have made a real impact.</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[3em]">
                {casesArray.slice(0,2).map((item, index) => (
                    <Link to={`/use-cases/${item.id}`}><div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <p className="text-left mt-6 text-xl md:text-2xl font-medium">{item.title}</p>
                        <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">{item.tagline.substring(0,200)+'...'}</p>
                        <button className=' flex mt-6 items-center'>
                            <p className=' gradient-text text-base'>View more</p>
                        </button>
                    </div></Link>
                ))}
            </div>

            <motion.div 
            className="  py-[3em] w-full font-Outfit text-[#fff]">
                <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative md:space-y-4">
                    <img src={adbg} className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]" alt="" />
                    <img src={admob} className="z-10 absolute top-0 h-full w-full object-cover block md:hidden" alt="" />
                    <p className=' font-semibold text-xl md:text-3xl'>Want product news and updates</p>
                    <p className=' font-normal px-4 md:px-0 text-lg md:text-xl'>Subscribe to UniCloud Africa blog to get update right in your inbox</p>
                    <div className=" flex flex-col md:flex-row items-center justify-center z-20  mt-4 md:space-x-6 space-y-4 md:space-y-0">
                        <input placeholder="Enter Email" className=" w-full md:w-auto h-[52px] bg-[#133D4C80] py-2.5 px-4 md:px-7 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]" type="text" />
                        <button className="  md:w-auto px-6 md:px-9 py-3 md:py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">Subscribe</button>
                    </div>
                </div>
            </motion.div>

        </div>
        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Services;