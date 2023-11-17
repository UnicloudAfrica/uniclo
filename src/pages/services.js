import Footer from "../components/footer";
import Navbar from "../components/navbar";
import arrowdown from './assets/Arrow_Down_Right_LG.svg';
import cpu from './assets/cpu-setting.svg';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { useState } from 'react';
import { motion } from "framer-motion";

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

    const [activeButton, setActiveButton] = useState('monthly');

    const handleButtonClick = (buttonName) => {
        setActiveButton(buttonName);
    };


    const data = [
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." },
        { topic: "Infrastructure-as-a-Service (IaaS)", content: "We provide African enterprises with access to on-demand, enterprise-grade computing, networking, and storage resources. With Unicloud Africa's IaaS, enterprises can quickly and easily scale their IT resources up or down as needed, without the.............." }
    ];

    const cases = [
        { topic: "Transforming [Client Name] with Cloud Migration", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
        { topic: "Transforming [Client Name] with Cloud Migration", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
    ];

    const plan = [
        { plan: "Starter", price: "10"},
        { plan: "Lite", price: "20"},
        { plan: "Professional", price: "50"},
    ];

    return ( 
        <>
        <Navbar/>
        <motion.div
        initial={{x:100, opacity:0}}
        animate={{x:0, opacity:1}}
        exit={{x:-100, opacity:0}}
        transition={{type:'spring', stiffness:80, duration:0.2}}
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our Services</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Unlocking the Power of Cloud Computing</p>
            <p className=" text-center font-normal mt-1 text-lg md:text-xl ">Discover a range of cloud services that empower your business to grow and succeed</p>
            <div className=" grid grid-cols-1 md:grid-cols-3 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em] md:mb-[10em]">
                {data.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full bg-[#F5F5F4] rounded-[20px] p-6">
                            <img src={ cpu } alt="" />
                            <p className="text-left mt-6 text-lg md:text-xl font-medium">{item.topic}</p>
                            <p className="text-left mt-1 text-[#1E1E1ECC] text-sm">{item.content}</p>
                            <button className=' flex space-x-8 mt-6 items-center'>
                                <p className=' gradient-text text-base'>View more</p>
                                <img src={ arrowdown } className=' w-4 h-4' alt="" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Payment Plan</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Our payment structure ensures you know exactly what you are paying for without any hidden fee.</p>
            <div className=" flex justify-center items-center mt-3">
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
            <div className=" grid grid-cols-1 md:grid-cols-3 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em] md:mb-[10em]">
                {plan.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full bg-[#F5F5F4] rounded-[20px] p-6">
                            <p className="text-left mt-6 text-xl font-medium">{item.plan+" "+'Plan'}</p>
                            <p className="text-left mt-1 text-[#1E1E1E] text-base"><span className=" text-4xl text-[#121212]">${item.price}</span>/Month</p>
                            <button className=' flex bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] w-full mt-32 justify-center rounded-[30px] py-3 items-center'>
                                <p className=' text-[#121212] text-base'>Get Started</p>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Use Cases</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]">
                
                {cases.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto block mt-6 text-base rounded-[30px]">
                            <p className=" gradient-text">App development</p>
                        </button>
                        <p className="text-left mt-6 text-xl md:text-3xl font-medium">{item.topic}</p>
                        <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">{item.content}</p>
                    </div>
                ))}
            </div>

        </div>
        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Services;