import leftBorder from "./assets/leftBorder.svg";
import rightBorder from "./assets/rightBorder.svg";
import map from "./assets/mapBig.svg";

const Acheive = () => {
  return (
    <section
      aria-labelledby="achieve-heading"
      className=" px-4 md:px-8 lg:px-16 my-[5em] flex flex-col justify-center w-full items-center"
    >
      <h2
        id="achieve-heading"
        className=" font-Outfit font-medium text-center text-2xl md:px-[10%] md:text-[40px] md:leading-[50px]"
      >
        We are building a network that will expand local cloud infrastructure to
        every part of Africa
      </h2>
      <div className=" flex flex-col md:flex-row items-center justify-center md:justify-between w-full font-Outfit font-medium mt-16">
        <div className=" w-full md:w-[15%] flex md:flex-col justify-between md:justify-start relative items-start">
          {/* <span className=" flex flex-col ml-5 md:ml-0 md:pl-5 md:mb-0 justify-start md:pb-3 md:border-l">
                        <p className=" text-[32px] md:text-[40px]">500+</p>
                        <p className="text-base md:text-xl">Clouds</p>
                    </span>
                    <img src={ leftBorder } className=' centered absolute md:top-5 block md:hidden -top-12 left-[30%] md:left-0 z-10 rotate-90 md:rotate-0 h-[150px] md:h-auto' alt="" />
                    <span className=" flex flex-col ml-5 md:ml-0 md:pl-5 mr-5 md:mr-0 md:mt-0 md:border-t md:border-l justify-start">
                        <p className=" text-[32px] md:text-[40px]">24+</p>
                        <p className="text-base md:text-xl">Countries</p>
                    </span> */}
        </div>

        <div className=" w-full md:w-[70%] flex justify-center my-16 md:my-0 items-center">
          <img
            src={map}
            className=" w-[100%] md:w-[50%] z-20"
            alt="Map of Africa showing network expansion"
          />
        </div>

        <div className=" w-full md:w-[15%] xl:w-[10%] flex justify-between md:justify-end md:flex-col  relative md:tems-end">
          {/* <span className=" flex flex-col ml-5 md:ml-0 md:mr-0 md:mb-0 md:pr-5 md:text-right justify-start md:justify-end md:pb-3 md:border-r">
                        <p className=" text-[32px] md:text-[40px]">250+</p>
                        <p className="text-base md:text-xl">Partners</p>
                    </span>
                    <img src={ rightBorder } className=' centered rotate-90 block md:hidden md:rotate-0 absolute -top-5 left-[30%] md:left-0 z-10 md:top-2 h-[150px] md:h-auto md:w-full' alt="" />
                    <span className=" flex flex-col mr-5 md:mr-0 md:mt-0 md:border-t md:pr-5  text-right md:border-r justify-start md:justify-end">
                        <p className=" text-[32px] md:text-[40px]">50+</p>
                        <p className="text-base md:text-xl">Data Center</p>
                    </span> */}
        </div>
      </div>
    </section>
  );
};

export default Acheive;
