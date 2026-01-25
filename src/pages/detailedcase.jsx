import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import React from "react";
import { initializeApp } from "firebase/app";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { getFirestore, getDoc, doc, getDocs, collection, query } from "firebase/firestore";
import { motion } from "framer-motion";
import copy from "./assets/copy.svg";
import DOMPurify from "dompurify";

const DetailedCases = () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [selectedCaseItem, setSelectedCaseItem] = useState([
    {
      title: "",
      tagline: "",
      date: "",
      url: "",
      content: "\n",
    },
  ]);
  const [otherCases, setOtherCases] = useState([]);

  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const docRef = doc(db, "cases", id); // 'id' is the name of the document
      getDoc(docRef)
        .then((doc) => {
          if (doc.exists()) {
            const reso = { id: doc.id, ...doc.data() };
            console.log("Document data:", reso);
            setSelectedCaseItem(reso);
          } else {
            // Handle the case where the document does not exist
            console.log("Document does not exist");
          }
        })
        .catch((error) => {
          // Handle any potential errors
          console.error("Error getting document:", error);
        });
    }

    // Fetch all documents in the 'cases' collection
    const casesCollectionRef = collection(db, "cases");
    const q = query(casesCollectionRef);
    getDocs(q)
      .then((querySnapshot) => {
        const otherCasesData = [];
        querySnapshot.forEach((doc) => {
          const caseData = { id: doc.id, ...doc.data() };
          if (id !== doc.id) {
            otherCasesData.push(caseData);
          }
        });
        setOtherCases(otherCasesData);
      })
      .catch((error) => {
        console.error("Error getting documents:", error);
      });
  }, [id, db]);

  //func to copy link
  const [buttonText, setButtonText] = useState("Copy link");
  const handleLinkCopy = (e) => {
    const currentLink = window.location.href;

    navigator.clipboard
      .writeText(currentLink)
      .then(() => {
        setButtonText("Copied!");
        setTimeout(() => {
          setButtonText("Copy link");
        }, 2000); // Change back to 'Copy link' after 3000 milliseconds (3 seconds)
      })
      .catch((err) => {
        console.error("Unable to copy link to clipboard", err);
      });
  };

  return (
    <>
      <Navbar />
      <motion.div>
        <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
          <p className=" font-medium text-3xl md:text-4xl text-center">Use Case</p>
          <div
            className=" w-full h-[350px] my-16 bg-[#F5F5F4] rounded-[20px]"
            style={{
              backgroundImage: `url(${selectedCaseItem.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <p className=" font-medium text-lg md:text-2xl md:px-[15%] text-left">
            {selectedCaseItem.title}
          </p>
          <p
            style={{ whiteSpace: "pre-line" }}
            className=" mt-3 md:px-[15%] text-sm text-justify font-normal whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedCaseItem.content) }}
          />
          <div className=" md:px-[15%] mt-6">
            <button
              onClick={handleLinkCopy}
              className=" flex px-3 py-2 border border-[#EAEBF0] rounded-[8px] justify-center items-center space-x-2"
            >
              <img src={copy} className=" w-4 h-4" alt="" />
              <p className=" text-xs font-medium">{buttonText}</p>
            </button>
          </div>

          <p className=" font-medium text-3xl md:text-3xl leading-[50px] text-center mt-16">
            Explore other use case
          </p>
          <p className=" text-center font-normal mt-3 text-xl text-[#676767]">
            Explore our case studies to see how our solutions have made a real impact.
          </p>

          <div
            className={`grid grid-cols-1 md:grid-cols-${
              otherCases.length > 1 ? 2 : 1
            } gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]`}
          >
            {otherCases.slice(0, 2).map((item, index) => (
              <Link to={`/use-cases/${item.id}`} key={index}>
                <div className="w-full text-center">
                  <div
                    className="w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-left mt-6 text-xl lg:text-2xl font-medium">{item.title}</p>
                  <p className="text-left mt-3 text-[#676767] text-sm">
                    {item.tagline.substring(0, 200) + "..."}
                  </p>
                  <button className=" flex mt-6 items-center">
                    <p className=" gradient-text text-base">View more</p>
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <motion.div className=" w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] relative md:space-y-4">
              <img
                src={adbg}
                className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]"
                alt=""
              />
              <img
                src={admob}
                className="z-10 absolute top-0 h-full w-full object-cover block md:hidden"
                alt=""
              />
              <p className=" font-semibold text-xl md:text-3xl">Want product news and updates</p>
              <p className=" font-normal px-4 md:px-0 text-lg md:text-xl">
                Subscribe to UniCloud Africa blog to get update right in your inbox
              </p>
              <div className=" flex flex-col md:flex-row items-center justify-center z-20  mt-4 md:space-x-6 space-y-4 md:space-y-0">
                <input
                  placeholder="Enter Email"
                  className=" w-full md:w-auto h-[52px] bg-[#133D4C80] py-2.5 px-4 md:px-7 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]"
                  type="text"
                />
                <Link to="/contact" target="_blank" rel="noopener noreferrer">
                  <button className="  md:w-auto px-6 md:px-9 py-3 md:py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">
                    Subscribe
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <Footer />
      </motion.div>
    </>
  );
};

export default DetailedCases;
