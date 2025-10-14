import linkin from "./assets/linkedin.png";
import twi from "./assets/twitter.png";
import ig from "./assets/ig.svg";
import whatsapp from "./assets/whatsapp.svg";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { GeneralContext } from "../contexts/contextprovider";

const Footer = () => {
  const [generalitem, setGeneralItem] = useContext(GeneralContext);

  return (
    <>
      <footer className=" mt-[1.5em] py-[3em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#A5ACBA] bg-[#0F171D] flex flex-col md:flex-row items-start justify-between space-y-5 md:space-y-0 z-[99]">
        <div className=" ">
          <span className="">
            <img
              src={generalitem.logourl}
              className=" -ml-5 w-28"
              alt="UniCloud Africa Logo"
            />
          </span>
          <p className=" font-normal text-base">
            Cloud solutions for Africa's future.
          </p>
          <span className=" mt-4 flex items-center space-x-6">
            <a href={generalitem.linkedin}>
              <img src={linkin} className=" w-6" alt="LinkedIn" />
            </a>

            <a href={generalitem.twitter}>
              <img src={twi} className=" w-6" alt="Twitter" />
            </a>

            <a href={generalitem.ig}>
              <img src={ig} className=" w-6" alt="Instagram" />
            </a>
          </span>
        </div>

        <div className=" text-base ">
          <p className=" font-semibold mb-5 text-[#F9F9F9]">Services</p>
          <span className="  mt-3">
            <Link to="/services">
              <p className=" mt-3">Our Services</p>
            </Link>
            <Link to="/solutions">
              <p className=" mt-3">Industries</p>
            </Link>
          </span>
        </div>

        <div className=" text-base ">
          <p className=" font-semibold mb-5 text-[#F9F9F9]">Resources</p>
          <span className=" mt-3">
            <Link to="/resources">
              <p className=" mt-3">Our Resources</p>
            </Link>
            <Link to="/faq">
              <p className=" mt-3">FAQ</p>
            </Link>
            <Link to="/blog">
              <p className=" mt-3">Our Blog</p>
            </Link>
          </span>
        </div>

        <div className=" text-base ">
          <p className=" font-semibold mb-5 text-[#F9F9F9]">Community</p>
          <span className=" mt-3">
            <Link to="/partnership">
              <p className=" mt-3">Partners</p>
            </Link>
            <Link to="/events">
              <p className=" mt-3">Events</p>
            </Link>
          </span>
        </div>

        <div className=" text-base ">
          <p className=" font-semibold mb-5 text-[#F9F9F9]">About</p>
          <span className=" mt-3">
            <Link to="/about">
              <p className=" mt-3">Learn About Us</p>
            </Link>
            <Link to="/advisory-board">
              <p className=" mt-3">Advisory Board</p>
            </Link>
            <Link to="/career">
              <p className=" mt-3">Career</p>
            </Link>
            <Link to="/terms">
              <p className=" mt-3">Legal</p>
            </Link>
          </span>
        </div>
      </footer>
      <div className=" py-[1.5em] w-full text-center text-[#A5ACBA] font-Outfit text-base font-normal bg-[#0F171D]">
        {new Date().getFullYear()} UniCloud Africa. All Rights Reserved ©.
      </div>
    </>
  );
};

export default Footer;
