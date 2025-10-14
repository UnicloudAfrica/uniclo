import beneone from "./assets/beneone.svg";
import benetwo from "./assets/benetwo.svg";
import benethree from "./assets/benethree.svg";
import benefour from "./assets/benefour.svg";
import benefive from "./assets/benefive.svg";
import benesix from "./assets/benesix.svg";
import { motion } from "framer-motion";

const Features = () => {
  return (
    <>
      <section
        aria-labelledby="features-heading"
        className="py-[3em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]"
      >
        <motion.div className=" flex flex-col md:flex-row w-full justify-between items-start">
          <h2
            id="features-heading"
            className=" w-full md:w-[48%] font-medium text-2xl md:text-3xl lg:text-4xl lg:leading-[50px] xl:leading-[48px] xl:text-5xl"
          >
            Cloud Services for African Businesses & Governments
          </h2>
          <p className=" w-full md:w-[48%] text-base lg:text-lg xl:text-xl mt-3 md:mt-0">
            Get on-demand, enterprise-grade cloud services for compute,
            networking, and storage, anywhere - on-premises, hybrid,
            multi-cloud, and at the edge. Pay only for what you use and lower
            your costs.
          </p>
        </motion.div>

        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px]  mt-8 md:mt-16">
          <motion.div className="w-full md:h-[270px] lg:h-auto rounded-[20px] bg-gradient-to-r from-[#288DD11A] to-[#3FE0C81A] p-5 lg:p-7">
            <span className=" flex flex-col md:flex-row items-start md:items-center md:space-x-3">
              <img src={beneone} alt="Zero-risk services icon" />
              <p className=" font-medium text-xl mt-2">
                Zero-risk Cloud Services
              </p>
            </span>
            <p className=" text-[#121212CC] text-sm md:text-base mt-2">
              Improve your cloud services with sccess to fully-managed IT
              infrastructure on demand. Only pay for what you use. Scale up,
              down or turn it off at any time. No long-term contract or CapEx
              hardware investments.
            </p>
          </motion.div>

          <motion.div className="w-full md:h-[270px] lg:h-auto rounded-[20px] bg-gradient-to-r from-[#288DD11A] to-[#3FE0C81A] p-5 lg:p-7">
            <span className=" flex flex-col md:flex-row items-start md:items-center md:space-x-3">
              <img src={benetwo} alt="Hybrid-ready design icon" />
              <p className=" font-medium text-xl mt-2">
                Hybrid-Ready by Design
              </p>
            </span>
            <p className=" text-[#121212CC] text-sm md:text-base mt-2">
              Simplify complex distributed infrastructure whether, on-prem,
              across multiple clouds or at the edge. Centralize your management
              capabilities and deliver the best price-performance ratio for any
              workload.
            </p>
          </motion.div>

          <motion.div className="w-full md:h-[270px] lg:h-auto rounded-[20px] bg-gradient-to-r from-[#288DD11A] to-[#3FE0C81A] p-5 lg:p-7">
            <span className=" flex flex-col md:flex-row items-start md:items-center md:space-x-3">
              <img src={benethree} alt="Global reach icon" />
              <p className=" font-medium text-xl mt-2">
                Global Reach, Local Appeal
              </p>
            </span>
            <p className=" text-[#121212CC] text-sm md:text-base mt-2">
              Deliver the performance and reliability your customers expect no
              matter the location. Offer low-latency edge services with our
              existing fully-managed clouds or global base of MSP partners.
            </p>
          </motion.div>

          <motion.div className="w-full md:h-[270px] lg:h-auto rounded-[20px] bg-gradient-to-r from-[#288DD11A] to-[#3FE0C81A] p-5 lg:p-7">
            <span className=" flex flex-col md:flex-row items-start md:items-center md:space-x-3">
              <img src={benefour} alt="Cloud trust icon" />
              <p className=" font-medium text-xl mt-2">Trust your Cloud</p>
            </span>
            <p className=" text-[#121212CC] text-sm md:text-base mt-2">
              Take control of your data with UniCloud’s secure-by-design
              infrastructure, data protection solutions, and our global network
              of partners. Isolate your data with click-to-provision options for
              dedicated storage at the controller level.
            </p>
          </motion.div>

          <motion.div className="w-full md:h-[270px] lg:h-auto rounded-[20px] bg-gradient-to-r from-[#288DD11A] to-[#3FE0C81A] p-5 lg:p-7">
            <span className=" flex flex-col md:flex-row items-start md:items-center md:space-x-3">
              <img src={benefive} alt="Centralized monitoring icon" />
              <p className=" font-medium text-xl mt-2">
                Centralized and Easy Monitoring
              </p>
            </span>
            <p className=" text-[#121212CC] text-sm md:text-base mt-2">
              Access our simple dashboard based cloud management. Web-based
              interface to monitor your applications and infrastructure with
              visualized dashboards, automated monitoring and alerting and
              detailed reporting.
            </p>
          </motion.div>

          <motion.div className="w-full md:h-[270px] lg:h-auto rounded-[20px] bg-gradient-to-r from-[#288DD11A] to-[#3FE0C81A] p-5 lg:p-7">
            <span className=" flex flex-col md:flex-row items-start md:items-center md:space-x-3">
              <img src={benesix} alt="24/7 support icon" />
              <p className=" font-medium text-xl mt-2">
                24/7/365 DevOps Support
              </p>
            </span>
            <p className=" text-[#121212CC] text-sm md:text-base mt-2">
              Free your IT team from ongoing maintenance. we deliver
              around-the-clock, proactive monitoring and support, and seamless
              upgrades, backed by our industry-leading uptime SLAs.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Features;
