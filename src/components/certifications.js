import certiOne from './assets/certione.svg';
import certiTwo from './assets/certiTwo.svg';
import certiThree from './assets/certiThree.svg';
import certiFour from './assets/certiFour.svg';
import certiFive from './assets/certiFive.svg';
import certiSix from './assets/certiSix.svg';

const Certifications = () => {
    return ( 
        <div className=" px-4 md:px-8 lg:px-16 my-[5em] font-Outfit w-full flex flex-col justify-center items-center">
            <p className=" font-medium text-2xl md:text-[40px] md:leading-[50px] text-center">Our Certifications</p>
            <p className=" text-center font-normal text-base md:text-xl text-[#676767] mt-3 md:px-[10%]">Unicloud Africa is a certified cloud service provider, Our certifications demonstrate our commitment to providing our customers with the highest quality of service and support.</p>
            <div className=' flex flex-col md:flex-row items-center space-y-8 md:space-y-0 justify-between mt-16 w-full'>
                <img src={ certiOne } className='' alt="" />
                <img src={ certiTwo } className='' alt="" />
                <img src={ certiThree } className='' alt="" />
                <img src={ certiFour } className='' alt="" />
                <img src={ certiFive } className='' alt="" />
            </div>
            <img src={ certiSix } className=' mt-8' alt="" />
        </div>
     );
}
 
export default Certifications;