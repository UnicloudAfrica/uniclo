import { Link } from "react-router-dom";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import press1 from "./assets/press1.png";
import press2 from "./assets/press2.png";
import press3 from "./assets/press3.png";
import press4 from "./assets/press4.png";
import press5 from "./assets/press5.png";
import press6 from "./assets/press6.png";
import press7 from "./assets/press7.svg";

export default function Press() {
  const pressNews = [
    {
      title:
        "UniCloud Africa Launches Pan-African Cloud Platform with Billings in Local Currency, Data Sovereignty and 99.999% Uptime",
      source: "Independent",
      link: "https://independent.ng/unicloud-africa-debuts-sovereign-cloud-platform-with-99-999-uptime-sla-zero-egress-fees-local-currency-billing/",
      image: press1,
      action: "Read More",
    },
    {
      title: "Pan-African AI cloud debuts across 6 countries",
      source: "The Sun",
      link: "https://businessday.ng/technology/article/unicloud-africa-redefines-cloud-computing-with-local-currency-billing-ai-driven-infrastructure/",
      image: press2,
      action: "Read More",
    },
    {
      title:
        "UniCloud Africa Launches Pan-African Cloud Platform with Billings in Local Currency, Data Sovereignty and 99.999% Uptime",
      source: "Techeconomy",
      link: "https://techeconomy.ng/unicloud-africa-launches-pan-african-cloud-platform/",
      image: press3,
      action: "Read More",
    },
    {
      title:
        "UniCloud Africa redefines cloud computing with local currency billing, AI-driven infrastructure",
      source: "Business Day",
      link: "https://businessday.ng/technology/article/unicloud-africa-redefines-cloud-computing-with-local-currency-billing-ai-driven-infrastructure/",
      image: press4,
      action: "Read More",
    },
    {
      title: "Why Africa needs own cloud solutions – Experts",
      source: "Daily Trust",
      link: "https://dailytrust.com/why-africa-needs-own-cloud-solutions-experts/",
      image: press5,
      action: "Read More",
    },
    {
      title: "UniCloud Africa Launches Localized Cloud Solution In Lagos",
      source: "CIO Africa",
      link: "https://cioafrica.co/unicloud-africa-launches-localized-cloud-solution-in-lagos/",
      image: press6,
      action: "Read More",
    },
    {
      title: "UNICLOUD Africa Provides Home-Grown Digital Data Protection",
      source: "TVC News",
      link: "https://youtu.be/I44hd18k5_w?si=GNHWlByXpCwveTNp",
      image: press7,
      action: "Watch Video",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212] max-w-[1300px] mx-auto">
        <div className=" flex items-center justify-center flex-col">
          <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
            Press & Media
          </p>
          <p className=" text-center font-normal mt-3 md:px-[15%] text-[#676767] text-lg md:text-xl ">
            Writing about UniCloud? Get brand assets and product screenshots for use in web and
            print media
          </p>
          <Link to="/contact" className=" mx-auto">
            <button className="text-white px-6 md:px-9 py-3 text-base md:text-xl w-[231px] mt-8 rounded-[30px] bg-gradient-to-r from-[var(--theme-color)] via-[var(--secondary-color)] to-[var(--secondary-color)]">
              Get Press Kit
            </button>
          </Link>
        </div>

        <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] w-full mt-12 md:mt-16 pb-[6em]">
          {pressNews.map((item, index) => (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              key={index}
              className="block"
            >
              <div className="w-full ">
                {/* image container */}
                <div
                  className="w-full h-[290px]  border-[#EAEBF0] rounded-[15px]"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>

                {/* text */}
                <p className="t mt-6 text-lg lg:text-2xl text-[#121212] font-medium leading-[1] ">
                  {item.title}
                </p>
                <div className="flex flex-col mt-3">
                  <p className="text-left text-[#676767] text-base md:text-lg font-normal leading-[1.5]">
                    {item.source}
                  </p>
                  <p className=" gradient-text text-xl font-medium mt-6 cursor-pointer">
                    {item.action}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
