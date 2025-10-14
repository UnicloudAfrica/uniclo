import arrowDown from "./assets/arrow-down.svg";
import outline from "./assets/outline.svg";
import { Link } from "react-router-dom";
import { useState } from "react";
import { GeneralContext } from "../contexts/contextprovider";
import logo from "./assets/logo.png";
import { useContext } from "react";

const Navbar = () => {
  function overlay() {
    //check classlist
    const overlayDiv = document.getElementById("overlay");
    if (overlayDiv.classList.contains("-translate-y-[150vh]")) {
      overlayDiv.classList.remove("-translate-y-[150vh]");
    } else if (!overlayDiv.classList.contains("-translate-y-[150vh]")) {
      overlayDiv.classList.add("-translate-y-[150vh]");
    }
  }

  const [serviceDropdown, setServiceDropdown] = useState(false);
  const [resourceDropdown, setResourceDropdown] = useState(false);
  const [communityDropdown, setCommunityDropdown] = useState(false);
  const [aboutDropdown, setAboutDropdown] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [generalitem, setGeneralItem] = useContext(GeneralContext);

  const toggleDropdown = (dropdownName) => {
    // Close any open dropdowns
    if (openDropdown) {
      openDropdown(false);
    }

    // Toggle the clicked dropdown
    switch (dropdownName) {
      case "service":
        setServiceDropdown((prevState) => !prevState);
        setOpenDropdown(() => setServiceDropdown);
        break;
      case "resource":
        setResourceDropdown((prevState) => !prevState);
        setOpenDropdown(() => setResourceDropdown);
        break;
      case "community":
        setCommunityDropdown((prevState) => !prevState);
        setOpenDropdown(() => setCommunityDropdown);
        break;
      case "about":
        setAboutDropdown((prevState) => !prevState);
        setOpenDropdown(() => setAboutDropdown);
        break;
      default:
        break;
    }
  };

  const closeServiceDropdown = () => {
    setServiceDropdown(false);
  };
  const closeResourceDropdown = () => {
    setResourceDropdown(false);
  };
  const closeCommunityDropdown = () => {
    setCommunityDropdown(false);
  };
  const closeAboutDropdown = () => {
    setAboutDropdown(false);
  };

  const [sections, setSections] = useState({
    about: false,
    services: false,
    resources: false,
    community: false,
  });

  const toggleSection = (section) => {
    setSections((prevSections) => ({
      ...prevSections,
      [section]: !prevSections[section],
    }));
  };

  return (
    <>
      <div
        id="overlay"
        className="w-full h-full max-h-screen bg-[#fff] backdrop-blur-xl p-6 flex justify-center items-start -translate-y-[150vh] shadow transition-all duration-700 top-[78px] fixed z-[9999] overflow-y-auto"
      >
        <div className="w-full mt-[2em] flex flex-col justify-center items-center space-y-5">
          <div className="w-full flex flex-row justify-between md:hidden text-lg">
            <button className="border border-[#EAEBF0] py-3 w-[48%] text-[#121212] text-center font-Outfit font-normal rounded-[30px]">
              Login
            </button>
            <button className="bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] py-3 w-[48%] text-[#fff] text-center font-Outfit font-normal rounded-[30px]">
              Register
            </button>
          </div>
          <div className="w-full text-left font-Outfit">
            <Link to="/">
              <p className="font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5">
                Home
              </p>
            </Link>
            <CollapsibleSection
              title="About"
              isOpen={sections.about}
              onToggle={() => toggleSection("about")}
            >
              <Link to="/about">
                <p className="text-sm text-[#12121299] mt-3">Learn About Us</p>
              </Link>
              <Link to="/advisory-board">
                <p className="text-sm text-[#12121299] mt-3">Advisory Board</p>
              </Link>
              <Link to="/management">
                <p className="text-sm text-[#12121299] mt-3">Management</p>
              </Link>
              <Link to="/career">
                <p className="text-sm text-[#12121299] mt-3">Career</p>
              </Link>
              <Link to="/terms">
                <p className="text-sm text-[#12121299] mt-3">Legal</p>
              </Link>
            </CollapsibleSection>
            <CollapsibleSection
              title="Services"
              isOpen={sections.services}
              onToggle={() => toggleSection("services")}
            >
              <Link to="/services">
                <p className=" mt-3 text-sm text-[#12121299]">Our Services</p>
              </Link>
              <Link to="/solutions">
                <p className=" mt-3 text-sm text-[#12121299]">Industries</p>
              </Link>
            </CollapsibleSection>
            <CollapsibleSection
              title="Resources"
              isOpen={sections.resources}
              onToggle={() => toggleSection("resources")}
            >
              <Link to="/resources">
                <p className=" mt-3 text-sm text-[#12121299]">Our Resources</p>
              </Link>
              <Link to="/faq">
                <p className=" mt-3 text-sm text-[#12121299]">FAQ</p>
              </Link>
              <Link to="/blog">
                <p className=" mt-3 text-sm text-[#12121299]">Our Blog</p>
              </Link>
            </CollapsibleSection>
            <CollapsibleSection
              title="Community"
              isOpen={sections.community}
              onToggle={() => toggleSection("community")}
            >
              <Link to="/partnership">
                <p className=" mt-3 text-sm text-[#12121299]">Partners</p>
              </Link>
              <Link to="/events">
                <p className=" mt-3 text-sm text-[#12121299]">Events</p>
              </Link>
            </CollapsibleSection>
            <Link to="/contact">
              <p className="font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5">
                Contact
              </p>
            </Link>
          </div>
        </div>
      </div>
      <div className=" py-6 z-[99999] px-4 md:px-8 lg:px-16 flex justify-between items-center fixed w-full bg-white top-0 text-[#121212]">
        <span className="">
          <img
            src={logo}
            className=" w-[75px] md:w-[120px]"
            alt="One cloud one africa"
          />
        </span>
        <div onClick={overlay} className="menu-icon md:hidden">
          <input className="menu-icon__cheeckbox" type="checkbox" />
          <div className=" lg:hidden">
            <span></span>
            <span></span>
          </div>
        </div>

        <span className="hidden lg:flex items-center space-x-8 font-Outfit text-sm">
          <Link to="/">
            <span className=" flex items-center space-x-2">
              <p>Home</p>
            </span>
          </Link>

          <div className=" relative">
            <span
              onClick={() => toggleDropdown("about")}
              className=" flex items-center space-x-2 cursor-pointer"
            >
              <p>About</p>
              <img src={arrowDown} className=" w-3 h-3" alt="" />
            </span>
            {aboutDropdown && (
              <div className=" text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6">
                <Link to="/about">
                  <span
                    onClick={closeAboutDropdown}
                    className=" flex items-center space-x-4"
                  >
                    <p>Learn about us</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/advisory-board" className="">
                  <span
                    onClick={closeAboutDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>Advisory Board</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/management" className="">
                  <span
                    onClick={closeAboutDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>Management</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/career" className="">
                  <span
                    onClick={closeAboutDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>Career</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/terms" className="">
                  <span
                    onClick={closeAboutDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>Legal</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className=" relative">
            <span
              onClick={() => toggleDropdown("service")}
              className=" flex items-center space-x-2 cursor-pointer"
            >
              <p>Services</p>
              <img src={arrowDown} className=" w-3 h-3" alt="" />
            </span>
            {serviceDropdown && (
              <div className=" text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6">
                <Link to="/services">
                  <span
                    onClick={closeServiceDropdown}
                    className=" flex items-center space-x-4"
                  >
                    <p>Our Services</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/solutions" className="">
                  <span
                    onClick={closeServiceDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>Industries</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className=" relative">
            <span
              onClick={() => toggleDropdown("resource")}
              className=" flex items-center space-x-2 cursor-pointer"
            >
              <p>Resources</p>
              <img src={arrowDown} className=" w-3 h-3" alt="" />
            </span>
            {resourceDropdown && (
              <div className=" text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6">
                <Link to="/resources">
                  <span
                    onClick={closeResourceDropdown}
                    className=" flex items-center space-x-4"
                  >
                    <p>Our Resources</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/faq" className="">
                  <span
                    onClick={closeResourceDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>FAQ</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/blog" className="">
                  <span
                    onClick={closeResourceDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>Our Blog</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className=" relative">
            <span
              onClick={() => toggleDropdown("community")}
              className=" flex items-center space-x-2 cursor-pointer"
            >
              <p>Community</p>
              <img src={arrowDown} className=" w-3 h-3" alt="" />
            </span>
            {communityDropdown && (
              <div className=" text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6">
                <Link to="/partnership">
                  <span
                    onClick={closeCommunityDropdown}
                    className=" flex items-center space-x-4"
                  >
                    <p>Partners</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
                <Link to="/events" className="">
                  <span
                    onClick={closeCommunityDropdown}
                    className=" flex items-center mt-3 space-x-4"
                  >
                    <p>Events</p>
                    <img src={outline} className=" w-3 h-3" alt="" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          <Link to="/contact">
            <span className=" flex items-center space-x-2">
              <p>Contact us</p>
            </span>
          </Link>
        </span>
        <span className="hidden md:flex items-center space-x-6 font-Outfit text-sm">
          <p>Login</p>
          <button className=" text-white px-9 py-3 rounded-[30px] bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8]">
            Register
          </button>
          <div onClick={overlay} className="menu-icon md:flex lg:hidden hidden">
            <input className="menu-icon__cheeckbox" type="checkbox" />
            <div className=" lg:hidden">
              <span></span>
              <span></span>
            </div>
          </div>
        </span>
      </div>
    </>
  );
};

export default Navbar;

const CollapsibleSection = ({ title, isOpen, onToggle, children }) => {
  return (
    <>
      <p
        className="font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5"
        onClick={onToggle}
      >
        {title}
      </p>
      {isOpen && <div className="ml-4">{children}</div>}
    </>
  );
};
