import Certifications from "../components/certifications";
import Navbar from "../components/navbar";
import awardOne from './assets/awardone.svg';
import awardTwo from './assets/awardtwo.svg';
import awardThree from './assets/awardthree.svg';
import awardFour from './assets/awardfour.svg';
import awardfive from './assets/awardfive.svg';
import awardSix from './assets/awardSix.svg';
import Ads from "../components/ad";
import Footer from "../components/footer";
import { motion } from "framer-motion";



const About = () => {

    const data = [
        { name: "Name", position: "Position" },
        { name: "Name", position: "Position" },
        { name: "Name", position: "Position" },
        { name: "Name", position: "Position" },
        { name: "Name", position: "Position" },
        { name: "Name", position: "Position" },
    ];

    return ( 
        <>
            <Navbar/>
            <motion.div
>
            <div className=" mt-[8em] w-full font-Outfit">
                <p className=" text-3xl md:text-[50px] font-medium text-center">About us</p>
                <p className=" text-base md:text-lg mt-6 font-normal text-center md:px-[15%]">At UniCloud Africa, we are committed to revolutionizing the way businesses operate in Africa. With a team of experienced cloud experts and a passion for innovation, we aim to provide secure, scalable, and reliable cloud solutions that empower African organisations to thrive in the digital age.</p>
                <div className=" px-0 md:px-8 lg:px-6 w-full">
                    <div className=" border border-[#EAEBF0] h-[400px] w-full md:rounded-[20px] bg-[#3AF3FC] mt-16 group">

                    </div>
                </div>
                <div className=" mt-[5em]">
                    <p className=" px-4 md:px-8 lg:px-16 text-center font-medium text-3xl md:text-[40px] leading-[50px]">Our Story</p>
                    <p className=" px-4 md:px-8 lg:px-16 my-3 text-sm font-normal">Unicloud Africa was founded in 2020 in Lagos, Nigeria, by a team of experienced entrepreneurs who saw a need for a cloud computing provider that was specifically designed to meet the needs of African businesses.<br></br>
                    The founders of Unicloud Africa had a deep understanding of the challenges that African businesses face, such as limited access to capital, unreliable infrastructure, and a shortage of skilled IT workers. They also recognized that African businesses are increasingly adopting cloud computing to improve their agility, scalability, and efficiency.
                    With this in mind, the founders of Unicloud Africa set out to create a cloud computing provider that was affordable, reliable, and easy to use. They also wanted to create a provider that was committed to supporting the growth and development of African businesses.<br></br>
                    Today, Unicloud Africa is one of the leading cloud computing providers in Africa. The company offers a wide range of cloud services, including compute, storage, networking, and managed services. Unicloud Africa's services are used by businesses of all sizes, from startups to multinational corporations.<br></br>
                    Unicloud Africa is committed to supporting the growth and development of African businesses. The company offers a variety of programs and initiatives to help African businesses adopt cloud computing and use it to their advantage. Unicloud Africa also partners with local universities and training organizations to provide African workers with the skills they need to succeed in the cloud computing industry.<br></br>
                    Unicloud Africa is a story of innovation and entrepreneurship. The company was founded by a team of visionary entrepreneurs who saw a need for a cloud computing provider that was specifically designed to meet the needs of African businesses. Today, Unicloud Africa is one of the leading cloud computing providers in Africa, and it is playing a vital role in supporting the growth and development of African businesses.</p>

                    <div className=" my-[5em] w-full px-4 md:px-8 lg:px-16">
                        <p className=" font-medium text-2xl md:text-[40px] md:leading-[50px] text-center">Our core value</p>
                        <p className=" text-center font-normal text-base md:text-lg md:px-[10%]">Our values define the Unicloud Africa’s culture, who we are, and what we do every day. They are the foundation of our identity </p>
                        <p className=" text-[80px] md:text-[180px] text-center font-medium gradient-text">R.I.D.E</p>
                        <div className=" flex flex-col w-full space-y-4">
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">R<span className=" text-lg">esponsibility </span></p>
                                <p className=" mt-3 font-normal text-sm">We take responsibility for our actions and our impact on the world. We are committed to being a responsible business and a good corporate citizen.</p>
                            </span>
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">I<span className=" text-lg">nnovation </span></p>
                                <p className=" mt-3 font-normal text-sm">We are constantly innovating to find new and better ways to serve our customers. We are committed to providing our customers with the latest and greatest cloud computing solutions.</p>
                            </span>
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">D<span className=" text-lg">ependability  </span></p>
                                <p className=" mt-3 font-normal text-sm">Our customers can depend on us to provide them with reliable and high-quality cloud computing services. We are committed to meeting and exceeding our customers' expectations.</p>
                            </span>
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">E<span className=" text-lg">xcellence</span></p>
                                <p className=" mt-3 font-normal text-sm">We strive for excellence in everything we do. We are committed to providing our customers with the best possible cloud computing experience.</p>
                            </span>
                        </div>
                    </div>

                    <Certifications/>

                    <div className="my-[5em] py-8 w-full bg-[#0F171D] flex justify-center items-center flex-col text-white">
                        <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our leadership team</p>
                        <p className=" text-center font-normal mt-3 text-base md:text-xl md:px-[12%] text-[#ffffffcc]">We’re a small team that loves to create great experiences and make meaningful connections between builders and customers.</p>
                        <div className=" flex justify-center items-center">
                            <div className=' grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-[32px] lg:gap-[5%] items-center justify-center mt-16 w-full md:px-16 space-y-10 md:space-y-0'>
                                <img src={ awardOne } className=' ' alt="" />
                                <img src={ awardTwo } className=' ' alt="" />
                                <img src={ awardThree } className=' ' alt="" />
                                <img src={ awardFour } className=' ' alt="" />
                                <img src={ awardfive } className=' ' alt="" />
                                <img src={ awardSix } className=' ' alt="" />
                            </div>
                        </div>
                    </div>

                    <div className=" my-[5em] w-full px-4 md:px-8 lg:px-16">
                        <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our Corporate Social Responsibility</p>
                        <p className=" text-center font-normal mt-3 text-base md:text-lg md:px-[5%]">At UniCloud Africa, we stand at the intersection of innovation and impact, recognizing our profound responsibility to uplift the communities and regions we proudly serve in the African continent. With over 1.3 billion people in Africa, we are fully aware of the transformative power of education and the urgent need to address the educational challenges facing our youth.</p>
                        <div className=" w-full flex flex-col-reverse lg:flex-row justify-between mt-16">
                            <div className=" w-full lg:w-[48%] flex flex-col space-y-6">
                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Education</p>
                                    <p className=" font-normal text-sm">We support programs that provide access to quality education for children and adults in Africa.</p>
                                </span>
                                
                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Environment</p>
                                    <p className=" font-normal text-sm">We are committed to reducing our environmental impact and supporting sustainable development initiatives.</p>
                                </span>

                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Diversity and inclusion</p>
                                    <p className=" font-normal text-sm">We believe that diversity and inclusion are essential to building a better world. That's why we are committed to creating a workplace where everyone feels welcome and respected.</p>
                                </span>

                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Community engagement</p>
                                    <p className=" font-normal text-sm">We give back to the communities where we live and work by supporting local charities and volunteering our time.</p>
                                </span>
                            </div>
                            <div className=" w-full lg:w-[48%] mt-5 lg:mt-0 h-[370px] rounded-[30px] bg-[#231546] block corp"></div>
                        </div>
                    </div>

                    <Ads/>

                    <Footer/>

                </div>
            </div>
            </motion.div>
        </>
     );
}
 
export default About;