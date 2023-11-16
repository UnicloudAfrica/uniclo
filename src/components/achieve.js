import leftBorder from './assets/leftBorder.svg';
import rightBorder from './assets/rightBorder.svg';
import map from './assets/mapBig.svg';

const Acheive = () => {
    return ( 
        <div className=" px-4 md:px-8 lg:px-16 my-[5em] flex flex-col justify-center w-full items-center">
            <p className=" font-Outfit font-medium text-center text-2xl md:w-[500px] md:text-[40px] md:leading-[50px]">Our Achievement made us well known through out </p>
            <div className=" flex flex-col md:flex-row items-center justify-center md:justify-between w-full font-Outfit font-medium mt-16">
                <div className=" w-full md:w-[15%] flex md:flex-col justify-between md:justify-start relative items-start">
                    <span className=" flex flex-col ml-5 md:mb-5 justify-start">
                        <p className=" text-[32px] md:text-[40px]">500+</p>
                        <p className="text-base md:text-xl">Clouds</p>
                    </span>
                    <img src={ leftBorder } className=' centered absolute md:top-5 -top-12 left-[30%] md:left-0 z-10 rotate-90 md:rotate-0 h-[150px] md:h-auto' alt="" />
                    <span className=" flex flex-col ml-5 mr-5 md:mr-0 md:mt-10 justify-start">
                        <p className=" text-[32px] md:text-[40px]">24+</p>
                        <p className="text-base md:text-xl">Countries</p>
                    </span>
                </div>

                <div className=' w-full md:w-[70%] flex justify-center my-8 md:my-0 items-center'>
                    <img src={ map } className=' w-[100%] md:w-[50%] z-20' alt="" />
                </div>

                <div className=" w-full md:w-[15%] flex justify-between md:justify-end md:flex-col  relative md:tems-end">
                    <span className=" flex flex-col ml-5 md:ml-0 mr-5 md:mb-5 justify-start md:justify-end">
                        <p className=" text-[32px] md:text-[40px]">250+</p>
                        <p className="text-base md:text-xl">Partners</p>
                    </span>
                    <img src={ rightBorder } className=' centered rotate-90 md:rotate-0 absolute -top-10 left-[30%] md:left-0 z-10 md:top-5 h-[150px] md:h-auto md:w-full' alt="" />
                    <span className=" flex flex-col mr-5 md:mt-10 text-right justify-start">
                        <p className=" text-[32px] md:text-[40px]">200+</p>
                        <p className="text-base md:text-xl">Daily shipment</p>
                    </span>
                </div>
            </div>
        </div>
     );
}
 
export default Acheive;