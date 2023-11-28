import Certifications from "../components/certifications";
import Navbar from "../components/navbar";
import awardOne from './assets/awardone.svg';
import awardTwo from './assets/awardtwo.svg';
import awardThree from './assets/awardthree.svg';
import awardFour from './assets/awardfour.svg';
import awardfive from './assets/awardfive.svg';
import awardSix from './assets/awardSix.svg';
import Ads from "../components/ad";
import mission from './assets/mission.svg';
import vision from './assets/vision.svg';
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
                <p className=" text-base md:text-lg mt-6 font-normal text-center text-[#121212de] md:px-[15%]">At UniCloud Africa, we are committed to revolutionizing the way businesses operate in Africa. With a team of experienced cloud experts and a passion for innovation, we aim to provide secure, scalable, and reliable cloud solutions that empower African organisations to thrive in the digital age.</p>
                <div className=" px-0 md:px-8 lg:px-6 w-full">
                    <div className=" border border-[#EAEBF0] h-[400px] w-full md:rounded-[20px] bg-[#3AF3FC] mt-16 group">

                    </div>
                </div>
                <div className=" mt-[5em]">
                    <p className=" px-4 md:px-8 lg:px-16 text-center font-medium text-3xl md:text-[40px] leading-[50px]">Our Journey</p>
                    <p className=" text-lg md:text-xl mt-3 font-normal text-center text-[#121212de]">Crafting a Cloud Computing Legacy for African Businesses</p>
                    <p className=" px-4 md:px-8 lg:px-16 my-6 text-sm font-normal">Founded in 2020 in the vibrant city of Lagos, Nigeria, UniCloud Africa emerged from the vision of a group of seasoned entrepreneurs. Fueled by a profound understanding of the challenges faced by African businesses—ranging from limited access to capital and unreliable infrastructure to a scarcity of skilled IT professionals—our founders embarked on a mission to revolutionize the cloud computing landscape for the African continent.<br></br><br></br>
                    Recognizing the increasing adoption of cloud computing as a catalyst for enhancing agility, scalability, and operational efficiency among African businesses, the founders set out to create a cloud computing provider that would be not only affordable and reliable but also tailored to the unique needs of the region.<br></br><br></br>
                    Today, UniCloud Africa stands as a beacon in the African tech landscape, proudly holding its position as one of the leading cloud computing providers on the continent. Our comprehensive suite of cloud services spans compute, storage, networking, and managed services, catering to businesses of all sizes—from dynamic startups to multinational corporations.<br></br><br></br>
                    At the core of UniCloud Africa's mission is a steadfast commitment to supporting the growth and development of African businesses. We have instituted various programs and initiatives designed to facilitate the seamless adoption of cloud computing, enabling businesses to harness its transformative power to their advantage. In collaboration with local universities and training organizations, we are actively nurturing the next generation of African professionals, equipping them with the skills essential for success in the dynamic realm of cloud computing.<br></br><br></br>
                    UniCloud Africa is more than just a cloud computing provider; it is a testament to innovation and entrepreneurship. From its visionary beginnings, the company has evolved into a crucial player in Africa's tech ecosystem, playing a pivotal role in steering the growth and development of businesses across the continent. Our story is one of dedication, empowerment, and a relentless pursuit of excellence in supporting the digital transformation journey of African enterprises.</p>

                    <div className=" mt-[5em] px-4 md:px-8 lg:px-16">
                        <p className="  text-center font-medium text-3xl md:text-[40px] leading-[50px]">Our Vision and Mission</p>
                        <p className=" text-lg md:text-xl mt-4 font-normal text-center md:px-[12%]">A vanguard for Africa's digital evolution, and catalyst for transformative change across industries and communities</p>

                        <div className="flex flex-col md:flex-row justify-between items-start mt-8 md:space-x-[64px]">
                            <img src={ vision } className=" block w-16 h-16 md:w-auto md:h-auto" alt="" />
                            <div className=" flex flex-col items-start">
                                <p className=" text-2xl mt-3 md:mt-0 md:text-3xl font-medium">Our Vision</p>
                                <p className=" whitespace-pre-line mt-3 text-base font-normal">At UniCloud Africa, our vision is to be the vanguard of Africa's digital evolution, a catalyst for transformative change across industries and communities. We aspire to create a seamless and interconnected digital ecosystem where innovation knows no bounds.<br></br><br></br>
                                We envision a future where UniCloud Africa stands as the foremost enabler of technological progress, empowering businesses to transcend traditional boundaries and embrace the full spectrum of opportunities in the digital realm. Our commitment is to be the architect of sustainable growth, fostering a landscape where African organizations not only thrive but lead on the global stage.<br></br><br></br>
                                In this vision, we see One Cloud, One Africa as more than a mantra—it's a commitment to unifying the continent under the umbrella of technological excellence. We strive to be the partner of choice for enterprises aspiring to navigate the digital future with confidence, agility, and unparalleled success.<br></br><br></br>
                                UniCloud Africa's vision is to be the driving force behind Africa's digital narrative, shaping a future where innovation is boundless, connectivity is seamless, and the potential for growth is limitless. Together, let's redefine what's possible in the digital age.</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row  justify-between items-start mt-16 md:space-x-[64px]">
                            <img src={ mission } className=" block w-16 h-16 md:w-auto md:h-auto" alt="" />
                            <div className=" flex flex-col items-start">
                                <p className=" text-2xl mt-3 md:mt-0 md:text-3xl font-medium">Our Mission</p>
                                <p className=" whitespace-pre-line mt-3 text-base font-normal">At UniCloud Africa, our mission is to innovate and deliver accessible cloud solutions, empowering businesses across Africa to thrive in the digital age. We prioritize accessibility, collaboration, and sustainable impact, aiming to create a unified ecosystem where organizations of all sizes can confidently navigate and succeed in the evolving digital landscape. UniCloud Africa is not just a cloud provider; we are a catalyst for digital transformation, committed to being the trusted partner that propels African organizations toward unparalleled success.</p>
                            </div>
                        </div>
                    </div>

                    <div className=" my-[5em] w-full px-4 md:px-8 lg:px-16">
                        <p className=" font-medium text-2xl md:text-[40px] md:leading-[50px] text-center">Our core value</p>
                        <p className=" text-center font-normal text-base text-[#121212de] md:text-lg md:px-[10%]">Our values define the Unicloud Africa’s culture, who we are, and what we do every day. They are the foundation of our identity </p>
                        <p className=" text-[80px] md:text-[180px] text-center font-medium gradient-text">R.I.D.E</p>
                        <div className=" flex flex-col w-full space-y-4">
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">R<span className=" text-lg">esponsibility </span></p>
                                <p className=" mt-2 font-normal text-base text-[#121212de]">We take responsibility for our actions and our impact on the world. We are committed to being a responsible business and a good corporate citizen.</p>
                            </span>
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">I<span className=" text-lg">nnovation </span></p>
                                <p className=" mt-2 font-normal text-base text-[#121212de]">We are constantly innovating to find new and better ways to serve our customers. We are committed to providing our customers with the latest and greatest cloud computing solutions.</p>
                            </span>
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">D<span className=" text-lg">ependability  </span></p>
                                <p className=" mt-2 font-normal text-base text-[#121212de]">Our customers can depend on us to provide them with reliable and high-quality cloud computing services. We are committed to meeting and exceeding our customers' expectations.</p>
                            </span>
                            <span className=" text-left">
                                <p className=" text-[26px] font-medium">E<span className=" text-lg">xcellence</span></p>
                                <p className=" mt-2 font-normal text-base text-[#121212de]">We strive for excellence in everything we do. We are committed to providing our customers with the best possible cloud computing experience.</p>
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
                        <p className=" text-center font-normal mt-3 text-base md:text-lg md:px-[5%]">At UniCloud Africa, we stand at the intersection of innovation and impact, recognizing our profound responsibility to uplift the communities and regions we proudly serve in the African continent.</p>
                        <div className=" w-full flex flex-col-reverse lg:flex-row justify-between mt-8 md:mt-16">
                            <div className=" w-full lg:w-[48%] flex flex-col space-y-6 mt-8 md:mt-0">
                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Education</p>
                                    <p className=" font-normal text-base text-[#121212de]">We support programs that provide access to quality education for children and adults in Africa.</p>
                                </span>
                                
                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Environment</p>
                                    <p className=" font-normal text-base text-[#121212de]">We are committed to reducing our environmental impact and supporting sustainable development initiatives.</p>
                                </span>

                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Diversity and inclusion</p>
                                    <p className=" font-normal text-base text-[#121212de]">We believe that diversity and inclusion are essential to building a better world. That's why we are committed to creating a workplace where everyone feels welcome and respected.</p>
                                </span>

                                <span className=" text-left">
                                    <p className=" font-medium text-xl">Community engagement</p>
                                    <p className=" font-normal text-base text-[#121212de]">We give back to the communities where we live and work by supporting local charities and volunteering our time.</p>
                                </span>
                            </div>
                            <div className=" w-full lg:w-[48%] mt-5 lg:mt-0 h-[400px] rounded-[30px] bg-[#231546] block corp"></div>
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