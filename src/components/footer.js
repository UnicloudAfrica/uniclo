import logo from './assets/logo.svg';
import fb from './assets/fb.svg';
import twi from './assets/twi.svg';
import ig from './assets/ig.svg';
import whatsapp from './assets/whatsapp.svg';

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
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>Products</p>
                <span className=' font-normal space-y-3'>
                    <p>Features</p>
                    <p>Solutions</p>
                    <p>Integrations</p>
                    <p>Enterprise</p>
                    <p>Solutions</p>
                </span>
            </div>

            <div className=' text-base '>
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>Resources</p>
                <span className=' font-normal space-y-3'>
                    <p>Partners</p>
                    <p>Community</p>
                    <p>Developers</p>
                    <p>App</p>
                    <p>Blog</p>
                </span>
            </div>

            <div className=' text-base '>
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>Why Choose Us?</p>
                <span className=' font-normal space-y-3'>
                    <p>Channels</p>
                    <p>Scale</p>
                    <p>Watch the Demo</p>
                    <p>Our Competition</p>
                </span>
            </div>

            <div className=' text-base '>
                <p className=' font-semibold mb-5 text-[#F9F9F9]'>Company</p>
                <span className=' font-normal space-y-3'>
                    <p>About Us</p>
                    <p>News</p>
                    <p>Leadership</p>
                    <p>Media Kit</p>
                </span>
            </div>

        </div>
        <div className=' py-[1.5em] w-full text-center text-[#A5ACBA] font-Outfit text-base font-normal bg-[#0F171D]'>
        © 2023 Unicloud Africa. All Rights Reserved.
        </div>
        </>
     );
}
 
export default Footer;