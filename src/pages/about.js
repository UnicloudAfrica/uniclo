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
import kwesi from './assets/Kwesi.svg';
import rudman from './assets/rudman.svg';
import Seyi from './assets/Seyi.svg';
import Ladi from './assets/Ladi.svg';


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
            initial={{x:100, opacity:0}}
            animate={{x:0, opacity:1}}
            exit={{x:-100, opacity:0}}
            transition={{type:'spring', stiffness:80, duration:0.2}}>
            <div className=" mt-[8em] w-full font-Outfit">
                <p className=" text-3xl md:text-[50px] font-medium text-center">About us</p>
                <p className=" text-base md:text-lg font-normal text-center md:px-[15%]">At UniCloud Africa, we are committed to revolutionizing the way businesses operate in Africa. With a team of experienced cloud experts and a passion for innovation, we aim to provide secure, scalable, and reliable cloud solutions that empower African organisations to thrive in the digital age.</p>
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

                    <div className=" my-[5em] w-full px-4 md:px-8 lg:px-16">
                        <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our leadership team</p>
                        <p className=" text-center font-normal mt-3 text-base md:text-xl md:px-[12%]">We’re a small team that loves to create great experiences and make meaningful connections between builders and customers.</p>
                        <div className=" mt-16 flex flex-col">
                            <div className=" w-full flex flex-col md:flex-row justify-between items-start">
                                <div className=" w-full md:w-[30%] h-[330px] bg-[#F5F5F4] rounded-[20px] relative">
                                    <img src={ kwesi } className=" absolute top-0 left-0 w-full h-full object-cover rounded-[20px] border border-[#EAEBF0]" alt="" />
                                </div>
                                <div className=" w-full md:w-[65%]">
                                    <p className=" font-medium text-black text-xl mt-5">Mr. Kwesi Amoafo-Yeboah</p>
                                    <p className=" text-sm mt-3">Mr. Kwesi Amoafo-Yeboah received a BS degree in Engineering and Petro-Physics from San Francisco State University, San Francisco, California - USA. Subsequently, he has held electronic design engineer positions at Fisher-Berkeley Corporation where he focused on the design and testing of hospital communication systems. He moved from there to hold various engineering and management positions with oil service giant, Schlumberger Technology Corporation. From 1986 to present he has founded and managed several companies in the fields of financial services, telecommunications and equities management. He was responsible for the successful introduction of the Western Union Money Transfer Service to Ghana, Nigeria, Kenya, Uganda, Ethiopia, Eritrea and Zambia. He is a board member in several privately held companies including his positions as Chairman of i-Zone Limited, Chairman of BlueCIoud Networks Limited, Chairman of Gudu Studios Limited and Vice Chairman of Achimota Golf Club where he previously served as Captain. In the 2008 elections in Ghana, Mr. Amoafo-Yeboah contested for the high office of President as an Independent Candidate on the singular theme of job and opportunity creation for all Ghanaians. Mr. Amoafo-Yeboah was subsequently appointed Chairman of the Ghana Venture Capital Trust Fund from 2013 to 2017.</p>
                                </div>
                            </div>

                            <div className=" w-full flex flex-col-reverse md:flex-row justify-between items-start mt-16 md:text-right">
                                <div className=" w-full md:w-[65%]">
                                    <p className=" font-medium text-black text-xl mt-5">Mr. Muhammed Rudman</p>
                                    <p className=" text-sm mt-3">Muhammed Rudman is the pioneer CEO of the Internet Exchange Point of Nigeria (IXPN), Nigeria's first and only neutral IXP. A seasoned ICT professional with over 20 years of extensive experience in network design, implementation, optimization, and management. Rudman worked in technical and management roles for numerous firms before joining IXPN, including Galaxy IT & T Limited.
                                    He is a member of several professional organizations both within and outside of Nigeria and has made significant contributions to the development of the country's ICT sector.
                                    He presently serves as Vice President of the Association of Telecommunications Companies of Nigeria (ATCON) and as Chairman of the Nigeria IPv6 Council, a branch of the global IPv6 Forum. Rudman is also a board member of the African Internet exchange Points Association.
                                    Rudman served as the Executive President of the Nigerian Internet Registration Association (NiRA) from 2019 to 2023. NiRA is the administrator of the .ng ccTLD (country code Top Level Domain) on behalf of Nigeria.
                                    He has served on a number of strategic and policy-making committees across the country. Rudman served on the Presidential Committee on the National Broadband Plan 2020-2025 and the Committee to Review National Cybersecurity Policy and Strategy 2021. He was recognized as one of the 100 Leading Telecom & ICT Personalities in Nigeria in 2018 by ATCON (Association of Telecommunications Companies of Nigeria).</p>
                                </div>
                                <div className=" w-full md:w-[30%] h-[330px] bg-[#F5F5F4] rounded-[20px] relative">
                                    <img src={ rudman } className=" absolute top-0 left-0 w-full h-full object-cover rounded-[20px] border border-[#EAEBF0]" alt="" />
                                </div>
                            </div>

                            <div className=" w-full flex flex-col md:flex-row justify-between items-start mt-16">
                                <div className=" w-full md:w-[30%] h-[520px] bg-[#F5F5F4] rounded-[20px] relative">
                                    <img src={ Seyi } className=" absolute top-0 left-0 w-full h-full object-cover rounded-[20px] border border-[#EAEBF0]" alt="" />
                                </div>
                                <div className=" w-full md:w-[65%]">
                                    <p className=" font-medium text-black text-xl mt-5">Mr.Seyi Katola</p>
                                    <p className=" text-sm mt-3">Seyi is an accomplished finance professional and prize winner – graduated in 1987, qualified as a Chartered Accountant shortly thereafter and became a Fellow of the Institute of Chartered Accountants of Nigeria ICAN in 1999; Fellow, the Chartered Institute of Taxation of Nigeria (CITN), Full Member of the Nigerian Institute of Management (MNIM); a Certified Forensic Accountant (CFA); a Certified Mediator (Neutral) and an Alumnus of the Institute of Public-Private Partnership, Washington DC.
                                    Seyi had worked in various high profile firms and companies – Managing Partner, JHI-AO&A Chartered Accountants (an affiliate of JHI, USA). He was an Accountant of Lagos Chamber of Commerce & Industry; Financial Controller at Topbrass Aviation Limited; Head, Financial/Internal Control Division of Vigeo Group; General Manager, Finance of Vigilant Insurance Company Limited (now NEM Insurance Plc), Chief Financial Officer and later elected as Executive Director, Finance of Century Group.
                                    He served as the Chairman, Accounting Technical Committee of the Nigerian Insurers Association, NIA (2002/3), Member of both the Annual General Meeting and Publication Committees of the Chartered Institute of Taxation of Nigeria (CITN); Member, Steering Committees of the Nigerian Accounting Standard Board – NASB – now Financial Reporting Council (FRC), He was a facilitator at ICAN MCPE Programme (2001 – 2004) and still facilitates for ELAN, ICAN, and CITN. In 2017, Seyi was appointed the Coordinator for the newly birthed ICAN MCPE E-Learning Programme
                                    In February 2012, Seyi Katola was elected a Non-Executive Director, Century Bumi Limited, a Nigerian-Malaysian company. He has been the Chairman, Bratim Group (professional training institutions and business school), Abuja for over eighteen years.
                                    In October 2018, Seyi was also seconded by SKC, to serve as the GMD/CEO of Universal Group, a business combo which operates in the Power, Real Estates, Tracking & Fleet Management and Oil & Gas Services subsectors of the Nigerian economy.
                                    Seyi, in 2021, was appointed, by the Chief Judge of Lagos State, to the nine-man Governing Council of the Lagos Multi-Door Courthouse (LMDC), for the promotion of the court-connected Alternative Dispute Resolution (ADR), the first in Africa. He is the current Chairman, Finance & Administration Committee and a Member of the Financing Committee of LMDC Governing Council.</p>
                                </div>
                            </div>

                            <div className=" w-full flex flex-col-reverse md:flex-row justify-between items-start mt-16 md:text-right">
                                <div className=" w-full md:w-[65%]">
                                    <p className=" font-medium text-black text-xl mt-5">Mr. Ladi Okuneye</p>
                                    <p className=" text-sm mt-3">Ladi Okuneye is an executive with over 20 years of hands-on experience and a progressive track record in operations, business startup, consulting, project management, finance and marketing for Telecoms, Media and Technology companies in Africa, Europe and North America.</p>

                                    <p className=" text-sm mt-3">Mr. Okuneye has been engaged in numerous projects within the African telecommunications sector, including the turnaround of struggling operations, network transmission design and fibre roll-out, regulatory and market entry projects. He is a Subject Matter Expert on Satellite and Rural Connectivity Solutions.</p>
                                </div>
                                <div className=" w-full md:w-[30%] h-[310px] bg-[#F5F5F4] rounded-[20px] relative">
                                    <img src={ Ladi } className=" absolute top-0 left-0 w-full h-full object-cover rounded-[20px] border border-[#EAEBF0]" alt="" />
                                </div>
                            </div>

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