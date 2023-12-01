import logo from './assets/logo.svg';
import fb from './assets/fb.svg';
import twi from './assets/twi.svg';
import ig from './assets/ig.svg';
import whatsapp from './assets/whatsapp.svg';
import { Link } from 'react-router-dom';

const Footer = () => {
    return ( 
        <>
        <div className=" mt-[1.5em] py-[3em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#A5ACBA] bg-[#0F171D] flex flex-col md:flex-row items-start justify-between space-y-5 md:space-y-0 z-[99]">

            <div className=" space-y-6">
                <span className="">
                    <img 
                    src={ logo } 
                    className=''
                    alt="" />
                </span>
                <p className=' font-normal text-base'>Cloud solutions for Africa's future.</p>
                <span className=' flex items-center space-x-6'>
                    
                    <img 
                    src={ fb }
                    alt="" />

                    <img 
                    src={ twi }
                    alt="" />

                    <img 
                    src={ ig }
                    alt="" />

                    <img 
                    src={ whatsapp }
                    alt="" />
                </span>
            </div>

            <div className=' text-base '>
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>Services</p>
                <span className='  mt-3'>
                    <Link to='/services'><p className=' mt-3'>Our Services</p></Link>
                    <Link to='/solutions'><p className=' mt-3'>Solutions</p></Link>
                </span>
            </div>

            <div className=' text-base '>
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>Resources</p>
                <span className=' mt-3'>
                    <Link to='/resources'><p className=' mt-3'>Our Resources</p></Link>
                    <Link to='/faq'><p className=' mt-3'>FAQ</p></Link>
                    <Link to='/blog'><p className=' mt-3'>Our Blog</p></Link>
                </span>
            </div>

            <div className=' text-base '>
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>Community</p>
                <span className=' mt-3'>
                    <Link to='/partnership'><p className=' mt-3'>Partners</p></Link>
                    <Link to='/events'><p className=' mt-3'>Events</p></Link>
                </span>
            </div>

            <div className=' text-base '>
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>About</p>
                <span className=' mt-3'>
                    <Link to='/about'><p className=' mt-3'>Learn About Us</p></Link>
                    <Link to='/advisory-board'><p className=' mt-3'>Advisory Board</p></Link>
                    <Link to='/career'><p className=' mt-3'>Career</p></Link>
                    <Link to='/terms'><p className=' mt-3'>Legal</p></Link>
                </span>
            </div>

        </div>
        <div className=' py-[1.5em] w-full text-center text-[#A5ACBA] font-Outfit text-base font-normal bg-[#0F171D]'>
        © 2023 UniCloud Africa. All Rights Reserved.
        </div>
        </>
     );
}
 
export default Footer;