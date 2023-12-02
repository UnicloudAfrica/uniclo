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
          <div className="relative w-full flex items-start justify-center py-5 md:py-0 md:items-center px-4 md:px-16">
            <div className=' flex flex-row justify-center py-4 space-x-4 md:py-6 items-center md:space-x-[10%]'>
                <img src={map} className='w-[92px] h-[100px] md:w-auto md:h-auto' alt="" />
                <p className=" text-base md:text-3xl xl:text-[32px] font-Outfit font-medium">Making Cloud Service Available For Africa Enterprises and Government</p>
            </div>
          </div>
          <div className="w-full h-[50px] md:h-[80px] clip"></div>
        </div>
      </div>
     );
}
 
export default Carousel;