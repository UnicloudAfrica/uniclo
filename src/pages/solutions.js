import { useEffect, useState, useRef } from "react";
import { Link } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, query, orderBy, onSnapshot} from 'firebase/firestore';
import arrowdown from './assets/Arrow_Down_Right_LG.svg';
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import DetailedSolution from "./detailedSolu";
import { motion } from "framer-motion";
import {useContext} from 'react'
import { CasesContext, SolutionsContext } from '../contexts/contextprovider';


const Solutions = () => {

    const [solutionsArray] = useContext(SolutionsContext);
    const [casesArray] = useContext(CasesContext);

    return ( 
        <>
        <div>
        <Navbar/>
        <motion.div
         
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">

            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Solutions</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Tailored Cloud Solutions for Every Industry</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em] md:mb-[10em]">
                {solutionsArray.map((item, index) => (
                    <div key={item.id} id={item.id} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <p className="text-left mt-3 text-xl font-medium">{item.topic}</p>
                        <p className="text-left mt-1 text-[#1e1e1e] text-sm">{item.desc}</p>
                        <Link to={`/solutions/${item.id}`}><button className=' flex space-x-8 mt-6 items-center'>
                            <p className=' gradient-text text-base'>View more</p>
                            <img src={ arrowdown } className=' w-4 h-4' alt="" />
                        </button></Link>
                    </div>
                ))}
            </div>
            
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] mt-[4em] text-center">Use Cases</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Explore our case studies to see how our solutions have made a real impact.</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]">
                {casesArray.map((item, index) => (
                    <Link to={`/use-cases/${item.id}`}><div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <p className="text-left mt-6 text-xl md:text-3xl font-medium">{item.title}</p>
                        <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">{item.tagline.substring(0,200)+'...'}</p>
                    </div></Link>
                ))}
            </div>
        </div>
        <Footer/>
        </motion.div>
        </div>
        </>
     );
}
 
export default Solutions;