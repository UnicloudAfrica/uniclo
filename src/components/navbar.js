import logo from './assets/logo.svg';
import arrowDown from './assets/arrow-down.svg';
import outline from './assets/outline.svg';
import { Link } from 'react-router-dom';
import { useState } from 'react';
const Navbar = () => {

    function overlay(){
        //check classlist
        const overlayDiv = document.getElementById('overlay');
        if(overlayDiv.classList.contains('-translate-y-[100vh]')){
            overlayDiv.classList.remove('-translate-y-[100vh]')
        }
        else if(!overlayDiv.classList.contains('-translate-y-[100vh]')){
            overlayDiv.classList.add('-translate-y-[100vh]')
        }
    };

    const [serviceDropdown, setServiceDropdown] = useState(false);
    const [resourceDropdown, setResourceDropdown] = useState(false);
    const [communityDropdown, setCommunityDropdown] = useState(false);
    const [aboutDropdown, setAboutDropdown] = useState(false);

    const toggleServiceDropdown = () => {
        setServiceDropdown(!serviceDropdown);
      };
    
      const closeServiceDropdown = () => {
        setServiceDropdown(false);
    };

    const toggleResourceDropdown = () => {
        setResourceDropdown(!resourceDropdown);
      };
    
      const closeResourceDropdown = () => {
        setResourceDropdown(false);
    };
    
    const toggleCommunityDropdown = () => {
        setCommunityDropdown(!communityDropdown);
      };
    
      const closeCommunityDropdown = () => {
        setCommunityDropdown(false);
    };

    const toggleAboutDropdown = () => {
        setAboutDropdown(!aboutDropdown);
      };
    
      const closeAboutDropdown = () => {
        setAboutDropdown(false);
    };

    return ( 
        <>
        <div id="overlay" className=" w-full bg-[#fff] backdrop-blur-xl p-6 flex justify-center items-center pb-[100px] -translate-y-[100vh] shadow transition-all duration-700 top-[78px] fixed z-[9999]">
            <div className="w-full flex flex-col justify-center items-center space-y-5">
                <div className=' w-full flex flex-row justify-between'>
                    <button className=' border border-[#1e1e1e99] py-3 w-[48%] text-[#121212] text-center font-Outfit font-normal rounded-[30px]'>Login</button>
                    <button className=' bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] py-3 w-[48%] text-[#fff] text-center font-Outfit font-normal rounded-[30px]'>Register</button>
                </div>
                <div className=' w-full text-left'>
                    <Link to='/'><p className=" font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5 ">Home</p></Link>
                    <p className=" font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5 ">About</p>
                    <span className=' text-xs text-[#12121299] mt-3'>
                        <Link to='/about'><p className=' mt-3'>Learn About Us</p></Link>
                        <Link to='/terms'><p className=' mt-3'>Legal</p></Link>
                    </span>
                    <p className=" font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5 ">Services</p>
                    <span className=' text-xs text-[#12121299] mt-3'>
                        <Link to='/services'><p className=' mt-3'>Our Services</p></Link>
                        <Link to='/solutions'><p className=' mt-3'>Solutions</p></Link>
                    </span>
                    <p className=" font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5 ">Resources</p>
                        <span className=' text-xs text-[#12121299] mt-3'>
                            <Link to='/resources'><p className=' mt-3'>Our resources</p></Link>
                            <Link to='/faq'><p className=' mt-3'>FAQ</p></Link>
                            <Link to='/blog'><p className=' mt-3'>Our Blog</p></Link>
                        </span>
                    <p className=" font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5 ">Community</p>
                    <span className=' text-xs text-[#12121299] mt-3'>
                            <Link to='/partnership'><p className=' mt-3'>Partners</p></Link>
                            <Link to='/events'><p className=' mt-3'>Events</p></Link>
                        </span>
                    <p className=" font-medium cursor-pointer text-lg text-[#121212] font-Outfit mt-5 ">Contact</p>
               </div>
            </div>
        </div>
        <div className=" py-6 z-[99999] px-4 md:px-8 lg:px-16 flex justify-between items-center fixed w-full bg-white top-0 text-[#121212]">
            <span className="">
                <img 
                src={ logo }
                className=' w-[75px]'
                 alt="" />
            </span>
            <div onClick={ overlay } className="menu-icon md:hidden">
                <input className="menu-icon__cheeckbox" type="checkbox" />
                <div className=' lg:hidden'>
                    <span></span>
                    <span></span>
                </div>
            </div>
            
            <span className='hidden lg:flex items-center space-x-8 font-Outfit text-sm'>
                <Link to='/'><span className=' flex items-center space-x-2'>
                    <p>Home</p>
                </span></Link>

                <div className=' relative'>
                    <span onClick={ toggleAboutDropdown } className=' flex items-center space-x-2 cursor-pointer'>
                        <p>About</p>
                        <img src={ arrowDown } className=' w-3 h-3' alt="" />
                    </span>
                    {  aboutDropdown && (<div className=' text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6'>
                        <Link to='/about'><span onClick={ closeAboutDropdown } className=' flex items-center space-x-4'>
                            <p>Learn about us</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                        <Link to='/terms' className=''><span onClick={ closeAboutDropdown } className=' flex items-center mt-3 space-x-4'>
                            <p>Legal</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                    </div>)}
                </div>

                <div className=' relative'>
                    <span onClick={ toggleServiceDropdown } className=' flex items-center space-x-2 cursor-pointer'>
                        <p>Services</p>
                        <img src={ arrowDown } className=' w-3 h-3' alt="" />
                    </span>
                    { serviceDropdown && (<div className=' text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6'>
                        <Link to='/services'><span onClick={ closeServiceDropdown } className=' flex items-center space-x-4'>
                            <p>Our Services</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                        <Link to='/solutions' className=''><span onClick={ closeServiceDropdown } className=' flex items-center mt-3 space-x-4'>
                            <p>Solutions</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                    </div>)}
                </div>

                <div className=' relative'>
                    <span onClick={ toggleResourceDropdown } className=' flex items-center space-x-2 cursor-pointer'>
                        <p>Resources</p>
                        <img src={ arrowDown } className=' w-3 h-3' alt="" />
                    </span>
                    { resourceDropdown && (<div className=' text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6'>
                        <Link to='/resources'><span onClick={ closeResourceDropdown } className=' flex items-center space-x-4'>
                            <p>Our resources</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                        <Link to='/faq' className=''><span onClick={ closeResourceDropdown } className=' flex items-center mt-3 space-x-4'>
                            <p>FAQ</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                        <Link to='/blog' className=''><span onClick={ closeResourceDropdown } className=' flex items-center mt-3 space-x-4'>
                            <p>Our Blog</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                    </div>)}
                </div>
                 
                <div className=' relative'>
                    <span onClick={ toggleCommunityDropdown } className=' flex items-center space-x-2 cursor-pointer'>
                        <p>Community</p>
                        <img src={ arrowDown } className=' w-3 h-3' alt="" />
                    </span>
                    { communityDropdown && (<div className=' text-white bg-[#494E51] absolute w-[198px] top-10 rounded-[15px] py-3 px-6'>
                        <Link to='/partnership'><span onClick={ closeCommunityDropdown } className=' flex items-center space-x-4'>
                            <p>Partners</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                        <Link to='/events' className=''><span onClick={ closeCommunityDropdown } className=' flex items-center mt-3 space-x-4'>
                            <p>Events</p>
                            <img src={ outline } className=' w-3 h-3' alt="" />
                        </span></Link>
                    </div>)}
                </div>

                <Link to='/contact'><span className=' flex items-center space-x-2'>
                    <p>Contact us</p>
                </span></Link>

            </span>
            <span className='hidden md:flex items-center space-x-6 font-Outfit text-sm'>
                <p>Login</p>
                <button 
                className=' text-white px-9 py-3 rounded-[30px] bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8]'>
                    Register
                </button>
                <div onClick={ overlay } className="menu-icon md:flex lg:hidden hidden">
                    <input className="menu-icon__cheeckbox" type="checkbox" />
                    <div className=' lg:hidden'>
                        <span></span>
                        <span></span>
                    </div>
            </div>
            </span>
        </div>
        </>
     );
}
 
export default Navbar;