import map from './assets/map.svg';
import binance from './assets/binance.svg';
import bitcoin from './assets/bitcoin.svg';
import coinbase from './assets/coinbase.svg';
import tether from './assets/tether.svg';
import bitmex from './assets/bitmex.svg';
import { motion } from 'framer-motion';


const Carousel = () => {
    return ( 
        <div className='px-0 md:px-8 lg:px-6'>
        <div className="flex flex-col w-full mt-8 mb-10 rounded-[20px] border border-[#288DD11A]">
          <div className="w-full h-[50px] md:h-[80px] clip"></div>
          <div className="relative w-full h-[150px] md:h-[200px] flex items-start py-5 md:py-0 md:items-center px-4 md:px-16">
            <div className=' w-[30%] md:w-[20%]'>
                <img src={map} className='w-[92px] h-[100px] md:w-auto md:h-auto' alt="" />
            </div>
            <div className=' w-[80%] flex flex-col'>
                <p className=" text-base md:text-xl font-Outfit font-medium">
                Making Cloud Service Available For Africa <span className="">Enterprises like:</span>
                </p>
                <div className="mt-4 w-full md:mt-5 flex justify-between space-x-6 md:space-x-0  overflow-x-scroll scrollbar-hide">
                    <img src={binance} className= "w-[100px] md:w-auto md:h-auto " alt="" />
                    <img src={bitcoin} className=" w-[100px] md:w-auto md:h-auto " alt="" />
                    <img src={coinbase} className=" w-[100px] md:w-auto md:h-auto " alt="" />
                    <img src={tether} className=" w-[100px] md:w-auto md:h-auto " alt="" />
                    <img src={bitmex} className=" w-[100px] md:w-auto md:h-auto " alt="" />
                </div>
            </div>
          </div>
          <div className="w-full h-[50px] md:h-[80px] clip"></div>
        </div>
      </div>
     );
}
 
export default Carousel;