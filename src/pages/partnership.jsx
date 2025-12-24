import Footer from "../components/footer";
import Navbar from "../components/navbar";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Partner logos
import zadaraLogo from "../components/assets/partnership/unicloud-africa-zadara.png";
import touchnetLogo from "../components/assets/partnership/unicloud-africa-touchnet.png";
import oadcLogo from "../components/assets/partnership/unicloud-africa-oadc.png";
import cedarviewLogo from "../components/assets/partnership/unicloud-africa-cedarview.png";
import hyperiaLogo from "../components/assets/partnership/unicloud-africa-hyperia.png";
import ipnxLogo from "../components/assets/partnership/unicloud-africa-ipnx.png";
import ixpnLogo from "../components/assets/partnership/unicloud-africa-ixpn.png";
import nordenLogo from "../components/assets/partnership/unicloud-africa-norden.png";
import wioccLogo from "../components/assets/partnership/unicloud-africa-wiocc.png";
import scryaiLogo from "../components/assets/partnership/unicloud-africa-scryai.png";
import decaLogo from "../components/assets/partnership/unicloud-africa-deca.png";
import megamoreLogo from "../components/assets/partnership/unicloud-africa-megamore.png";

// Partner data with logos in order matching the design mockup
const partners = [
  { name: "Zadara", logo: zadaraLogo },
  { name: "TouchNet", logo: touchnetLogo },
  { name: "Open Access Data Centres", logo: oadcLogo },
  { name: "Cedarview", logo: cedarviewLogo },
  { name: "Hyperia", logo: hyperiaLogo },
  { name: "ipNX", logo: ipnxLogo },
  { name: "IXPN", logo: ixpnLogo },
  { name: "Norden", logo: nordenLogo },
  { name: "WIOCC", logo: wioccLogo },
  { name: "SCRYAI", logo: scryaiLogo },
  { name: "DECA", logo: decaLogo },
  { name: "MegaMore", logo: megamoreLogo },
];

const PartnerCard = ({ partner }) => {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full h-[200px] md:h-[220px] bg-white border border-[#E5E7EB] rounded-[20px] flex items-center justify-center p-8 hover:shadow-lg transition-shadow duration-300">
        <img
          src={partner.logo}
          alt={partner.name}
          className="h-auto w-auto max-h-[150px] max-w-[85%] object-contain"
        />
      </div>
      <p className="mt-4 text-lg md:text-xl font-medium text-[#121212] text-center">
        {partner.name}
      </p>
    </motion.div>
  );
};

const Partnership = () => {
  return (
    <>
      <Navbar />
      <motion.div>
        {/* Header Section */}
        <div className="mt-[8em] md:mt-[10em] px-4 md:px-8 lg:px-16 xl:px-24 w-full font-Outfit text-[#121212]">
          <motion.p
            className="font-medium text-3xl md:text-[40px] md:leading-[50px] text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Partnerships
          </motion.p>
          <motion.p
            className="text-center font-normal mt-3 text-lg text-[#676767] md:text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We're proud to collaborate with industry leaders to deliver unmatched cloud solutions
          </motion.p>

          {/* Partner Grid */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            {partners.map((partner, index) => (
              <PartnerCard key={index} partner={partner} />
            ))}
          </div>

          {/* Description Text */}
          <motion.p
            className="mt-12 text-center font-normal text-[#676767] text-lg md:text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our partnerships enable us to provide you with the best-in-class cloud services that
            drive business transformation.
          </motion.p>
        </div>

        {/* CTA Banner */}
        <motion.div
          className="my-[5em] px-4 md:px-8 lg:px-16 xl:px-24 w-full font-Outfit text-[#fff]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-full h-[380px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] relative overflow-hidden">
            <img
              src={adbg}
              className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px] opacity-30"
              alt=""
            />
            <img
              src={admob}
              className="z-10 absolute top-0 h-full w-full object-cover block md:hidden opacity-30"
              alt=""
            />
            <p className="z-20 font-semibold text-3xl md:text-4xl">Partner with us today</p>
            <p className="z-20 font-normal px-4 md:px-0 text-xl mt-3">
              Partner with us to deliver unmatched cloud solutions.
            </p>
            <Link to="/contact" className="z-20">
              <button className="px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000] mt-6 hover:bg-gray-100 transition-colors duration-300 font-medium">
                Contact Us
              </button>
            </Link>
          </div>
        </motion.div>

        <Footer />
      </motion.div>
    </>
  );
};

export default Partnership;
