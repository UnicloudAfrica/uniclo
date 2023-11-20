import Footer from "../components/footer";
import Navbar from "../components/navbar";
import kwesi from './assets/Kwesi.svg';
import rudman from './assets/rudman.svg';
import Seyi from './assets/Seyi.svg';
import Ladi from './assets/Ladi.svg';
import Ads from "../components/ad";

const Advisory = () => {
    return ( 
        <>
        <Navbar/>
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our Advisory board</p>
            <p className=" text-center font-normal mt-3 text-xl md:px-[12%]">We’re a small team that loves to create great experiences and make meaningful connections between builders and customers.</p>

            <div className=" my-[5em] w-full">
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
        </div>
        <Ads/>
        <Footer/>
        </>
     );
}
 
export default Advisory;