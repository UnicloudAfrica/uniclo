import { useState } from "react";
import { motion } from "framer-motion";
import arrowDown from './assets/arrowdown.svg';

const Faq = () => {
  const faqsData = [
    {
      question: "What is UniCloud Africa, and what services does it offer?",
      answer:
        "UniCloud Africa is a leading cloud computing provider committed to revolutionizing the way businesses operate in Africa. We offer a comprehensive suite of cloud services, including Infrastructure-as-a-Service (IaaS), Platform-as-a-Service (PaaS), data storage, backup, analytics, and more.",
    },
    {
      question: "How can UniCloud Africa benefit my business?",
      answer:
        "UniCloud Africa provides secure, scalable, and reliable cloud solutions tailored to the unique needs of African businesses. Our services empower organizations to enhance operational efficiency, foster innovation, and navigate the digital landscape with confidence.",
    },
    {
      question: "Is my data secured with UniCloud Africa?",
      answer:
        "Yes, data security is a top priority for us. UniCloud Africa employs robust security measures and ensures data sovereignty, giving you the confidence that your critical information is protected within local borders.",
    },
    {
      question: "What industries does UniCloud Africa serve?",
      answer:
        "UniCloud Africa serves a diverse range of industries, including finance services, healthcare, e-commerce, public sector, enterprise, oil and gas, and more. Our tailored cloud solutions are designed to meet the specific needs of each industry.",
    },
    {
      question: "How does UniCloud Africa support scalability?",
      answer:
        "UniCloud Africa's solutions provide unparalleled scalability, allowing businesses to expand or contract their resources with agility. Whether experiencing rapid growth or fluctuating demands, our cloud services adapt to your organization's needs.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleDropDown = (index) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <motion.div
      className="py-[3em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]"
    >
      <p className=" font-medium text-[40px] leading-[50px] text-center mb-16">
        Frequently Asked Questions (FAQs)?
      </p>

      {faqsData.map((faq, index) => (
        <div
          key={index}
          onClick={() => toggleDropDown(index)}
          className={`border-y py-6 faq border-[#1E1E1E1A]${
            openIndex === index ? ' active' : ''
          }`}
        >
          <div className="flex flex-row justify-between w-full items-center">
            <p className="font-Outfit text-base md:text-lg font-normal">
              {faq.question}
            </p>
            <img
              src={arrowDown}
              className={`${
                openIndex === index ? 'transform rotate-180' : ''
              } transition-transform duration-300`}
              alt=""
            />
          </div>
          <div className={`answer${openIndex === index ? ' open' : ''}`}>
            <p className="font-Outfit font-normal text-[#676767] text-sm md:text-base mt-5 transition-all duration-500">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default Faq;
