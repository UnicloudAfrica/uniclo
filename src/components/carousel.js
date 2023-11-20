import map from './assets/map.svg';
import binance from './assets/binance.svg';
import bitcoin from './assets/bitcoin.svg';
import coinbase from './assets/coinbase.svg';
import tether from './assets/tether.svg';
import bitmex from './assets/bitmex.svg';
import { motion } from 'framer-motion';


const Carousel = () => {
    return ( 
        <div className=' px-0 md:px-8 lg:px-6'>
            <div className="flex flex-col w-full mt-8 mb-10 rounded-[20px] border border-[#288DD11A]">
                <div className=" w-full h-[80px] clip"></div>
                <div className=" relative w-full h-[230px] md:h-[200px] flex items-start py-5 md:py-0 md:items-center px-4 md:px-16">
                    <img src={ map } className=' w-[92px] h-[100px] md:w-auto md:h-auto' alt="" />
                    <div className=' w-full flex flex-col items-center mt-[25px] md:mt-0 ml-5 md:ml-[40px]'>
                        <p className=' text-base w-full md:text-xl font-Outfit font-medium'>Making Cloud Service Available For Africa <span className=''>Enterprises like:</span></p>
                        <div className=' absolute md:static left-4 top-[140px] flex flex-row mt-4 space-x-10 md:space-x-0 justify-between'>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1, type:'tween' }}
                                className=" w-full">
                                <div className='w-full md:mt-5 overflow-x-scroll md:overflow-visible scrollbar-hide'>
                                    <div className='flex flex-row justify-between'>
                                        <img src={ binance } className=' mr-4 ' alt="" />
                                        <img src={ bitcoin } className=' mx-4 ' alt="" />
                                        <img src={ coinbase } className=' mx-4 ' alt="" />
                                        <img src={ tether } className=' mx-4 ' alt="" />
                                        <img src={ bitmex } className=' mx-4 ' alt="" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
                <div className=" w-full h-[80px] clip"></div>
            </div>
        </div>
     );
}
 
export default Carousel;