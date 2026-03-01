import Footer from "../components/footer";
import Navbar from "../components/navbar";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useFetchMarketingPartners } from "../hooks/marketingHooks";

interface Partner {
  id: string | number;
  name: string;
  logo: string;
  [key: string]: any;
}

const PartnerCard = ({ partner }: { partner: Partner }) => {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full h-[200px] md:h-[220px] bg-white border border-[var(--theme-surface-alt)] rounded-[20px] flex items-center justify-center p-8 hover:shadow-lg transition-shadow duration-300">
        <img
          src={partner.logo}
          alt={partner.name}
          className="h-auto w-auto max-h-[150px] max-w-[85%] object-contain"
        />
      </div>
    </motion.div>
  );
};

const Partnership = () => {
  const isBrowser = typeof window !== "undefined";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partners = [], isFetching } = useFetchMarketingPartners() as any;

  const partnerList: Partner[] = Array.isArray(partners)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partners.map((partner: any) => ({
        id: partner.id || partner.source_id || partner.name,
        name: partner.name,
        logo: partner.logo_url || partner.logo,
      }))
    : [];

  return (
    <>
      <Navbar />
      <motion.div>
        {/* Header Section */}
        <div className="mt-[8em] md:mt-[10em] px-4 md:px-8 lg:px-16 xl:px-24 w-full font-Outfit text-[var(--theme-heading-color)]">
          <motion.p
            className="font-medium text-3xl md:text-[40px] md:leading-[50px] text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Partnerships
          </motion.p>
          <motion.p
            className="text-center font-normal mt-3 text-lg text-[var(--theme-text-color)] md:text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We're proud to collaborate with industry leaders to deliver unmatched cloud solutions
          </motion.p>

          {/* Partner Grid */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            {partnerList.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
            {isBrowser && !isFetching && partnerList.length === 0 && (
              <p className="col-span-full text-center text-sm text-[rgb(var(--theme-neutral-400))]">
                No partners available yet.
              </p>
            )}
          </div>

          {/* Description Text */}
          <motion.p
            className="mt-12 text-center font-normal text-[var(--theme-text-color)] text-lg md:text-xl max-w-3xl mx-auto"
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
          className="my-[5em] px-4 md:px-8 lg:px-16 xl:px-24 w-full font-Outfit text-[var(--theme-card-bg)]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-full h-[380px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[var(--theme-color)] via-[var(--secondary-color)] to-[var(--secondary-color)] relative overflow-hidden">
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
              <button className="px-9 py-4 bg-[var(--theme-card-bg)] rounded-[30px] text-base text-[var(--theme-heading-color)] mt-6 hover:bg-gray-100 transition-colors duration-300 font-medium">
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
