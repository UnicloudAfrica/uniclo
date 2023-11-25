import Navbar from '../components/navbar';
import arrowDown from './assets/arrowdown.svg';
import { motion } from "framer-motion";
import adbg from './assets/adBG.svg';
import avatar from './assets/avatar.svg';
import Footer from '../components/footer';
import { useState } from 'react'


const FaqPage = () => {

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
        {
          question: "Can UniCloud Africa help with data backup and recovery?",
          answer:
            "Absolutely. UniCloud Africa offers data storage and backup solutions to ensure the safety and accessibility of your critical data. In the event of unforeseen circumstances, our services facilitate quick data recovery.",
        },
        {
          question: "What sets UniCloud Africa apart from other cloud providers?",
          answer:
            "UniCloud Africa stands out with its commitment to local expertise, data sovereignty, and a comprehensive suite of cloud services. We prioritize the unique needs of African businesses and provide a secure foundation for digital transformation.",
        },
        {
          question: "Does UniCloud Africa offer technical support?",
          answer:
            "Yes, UniCloud Africa is dedicated to providing excellent customer support. Our team of local experts is available 24/7 to assist you with technical inquiries, ensuring a smooth experience with our cloud solutions.",
        },
        {
          question: "How can my business collaborate with UniCloud Africa's ecosystem?",
          answer:
            "UniCloud Africa actively engages with local ecosystems and offers a Cloud Marketplace, fostering collaboration within a robust partner ecosystem. Contact us to explore partnership opportunities and join the digital transformation journey.",
        },
        {
            question: "How can I get started with UniCloud Africa's services?",
            answer: `
              Excited to begin? Follow these simple steps to sign up:<br/>
              - Click on "Sign Up" at the top-right corner.<br/>
              - Provide your name and email address.<br/>
              - Create a secure password.<br/>
              - Click "Sign Up" to join UniCloud Africa and unlock a world of secure, scalable cloud solutions for your business.
            `,
        }
    ];

    const [openIndex, setOpenIndex] = useState(null);

    const toggleDropDown = (index) => {
        setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
    };

    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type: 'tween' }}
        className="py-[3em] px-4 md:px-8 lg:px-16 w-full mt-[8em] font-Outfit text-[#121212]"
        >
        <p className=" font-medium text-[40px] leading-[50px] text-center mb-6">
            Frequently asked questions?
        </p>
        <p className=" font-medium text-lg md:text-xl text-center mb-16">
            Have questions? we’re here to help.
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
            <div
            className={`mt-3 text-sm md:text-base answer${openIndex === index ? ' open' : ''}`}
            dangerouslySetInnerHTML={{ __html: faq.answer }}
          />
            </div>
        ))}
        </motion.div>


        <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type:'tween' }}
        className="  py-[3em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative space-y-4">
                <img src={ adbg } className=" absolute h-[300px]" alt="" />
                <img src={ avatar } className='' alt="" />
                <p className=' font-medium px-4 md:px-0 text-xl'>Still have questions?</p>
                <p className=' font-normal px-4 md:px-0 text-base text-[#FFFFFFCC]'>Can’t find the answer you’re looking for? Please chat to our friendly team.</p>
                <button className=" px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000] mt-4">Get started now</button>
            </div>
        </motion.div>
        </motion.div>
        <Footer/>
        </>
     );
}
 
export default FaqPage;