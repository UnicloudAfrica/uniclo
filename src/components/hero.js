import heroImg from "./assets/hero.webm";
import { Link } from "react-router-dom";

const Hero = () => {
  //   const isMobile = window.innerWidth <= 768;

  return (
    <>
      <div className=" text-center md:text-left py-10 flex flex-col text-[#121212]">
        <div className="w-full px-4 mt-28 md:px-8 lg:px-16 flex items-center justify-center flex-col font-Outfit text-center">
          <p className="font-medium text-[32px] leading-10 lg:text-6xl lg:leading-[80px]">
            The Continent’s Leading Truly Pan African Cloud Platform
          </p>
          <p className="w-full text-base md:text-2xl text-center font-normal mt-3 md:leading-[30px]">
            Empower Your Business in Africa with Cloud Innovation
          </p>
          <Link to="/contact">
            <button className="text-white px-6 md:px-9 py-3 text-base md:text-xl w-[231px] mt-8 rounded-[30px] bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8]">
              Get started today
            </button>
          </Link>
        </div>
        <div className="w-full px-0 md:px-8 lg:px-6 flex flex-col items-center mt-12 relative">
          <video
            className="h-[400px]  w-[100%] md:rounded-[20px] back-video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={heroImg} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </>
  );
};

export default Hero;
