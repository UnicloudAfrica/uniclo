import certiOne from './assets/certione.png';
import certiTwo from './assets/certiTwo.png';
import certiThree from './assets/certiThree.png';
import certiFour from './assets/certiFour.png';
import certiFive from './assets/certiFive.png';
import certiSix from './assets/certiSix.png';

const Certifications = () => {
    return ( 
        <div className=" px-4 md:px-8 lg:px-16 my-[5em] font-Outfit w-full flex flex-col justify-center items-center">
            <p className=" font-medium text-2xl md:text-[40px] md:leading-[50px] text-center">Our Certifications</p>
            <p className=" text-center font-normal text-base md:text-xl text-[#676767] mt-3 md:px-[10%]">UniCloud Africa is a certified cloud service provider, Our certifications demonstrate our commitment to providing our customers with the highest quality of service and support.</p>
            <div className=' flex flex-col md:flex-row md:flex-wrap justify-center items-center md:justify-around space-y-4 md:space-y-0 space-x-0 md:space-x-[24px] mt-16 w-full'>
                <img src={ certiOne } className=' w-[150px]' alt="" />
                <img src={ certiTwo } className=' w-[150px]' alt="" />
                <img src={ certiThree } className=' w-[150px]' alt="" />
                <img src={ certiFour } className=' w-[150px]' alt="" />
                <img src={ certiFive } className=' w-[150px] md' alt="" />
                <img src={ certiSix } className=' w-[150px]' alt="" />
            </div>
        </div>
     );
}
 
export default Certifications;