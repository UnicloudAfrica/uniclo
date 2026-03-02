import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { getFirestore, getDoc, doc, getDocs, collection, query } from "firebase/firestore";
import { motion } from "framer-motion";
import copy from "./assets/copy.svg";
import DOMPurify from "dompurify";
import { CasesContext } from "../contexts/contextprovider";
import logger from "../utils/logger";

interface CaseItem {
  id: string;
  title: string;
  tagline: string;
  date: string;
  url: string;
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const DetailedCases = () => {
  // ... firebase config
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [casesArray] = useContext(CasesContext) as [CaseItem[]];

  const emptyCase = {
    title: "",
    tagline: "",
    date: "",
    url: "",
    content: "\n",
    id: "",
  };
  const [selectedCaseItem, setSelectedCaseItem] = useState<CaseItem>(emptyCase);
  const [otherCasesState, setOtherCasesState] = useState<CaseItem[]>([]);

  const { id } = useParams();

  const selectedFromContext = useMemo(() => {
    if (!id || !casesArray.length) return null;
    return casesArray.find((item) => item.id === id) || null;
  }, [id, casesArray]);

  const otherCasesFromContext = useMemo(() => {
    if (!id || !casesArray.length) return [];
    return casesArray.filter((item) => item.id !== id);
  }, [id, casesArray]);

  const resolvedSelected = selectedFromContext || selectedCaseItem;
  const resolvedOtherCases =
    otherCasesFromContext.length > 0 ? otherCasesFromContext : otherCasesState;

  const db = useMemo(() => {
    if (typeof window === "undefined") return null;
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
    return getFirestore(app);
  }, []);

  useEffect(() => {
    if (selectedFromContext) {
      setSelectedCaseItem(selectedFromContext);
    }
  }, [selectedFromContext]);

  useEffect(() => {
    if (!id || !db || casesArray.length) return;
    const docRef = doc(db, "cases", id);
    getDoc(docRef)
      .then((doc) => {
        if (doc.exists()) {
          const reso = { id: doc.id, ...doc.data() } as CaseItem;
          setSelectedCaseItem(reso);
        } else {
          logger.log("Document does not exist");
        }
      })
      .catch((error) => {
        logger.error("Error getting document:", error);
      });
  }, [id, db, casesArray.length]);

  useEffect(() => {
    if (!id || !db || casesArray.length) return;
    const casesCollectionRef = collection(db, "cases");
    const q = query(casesCollectionRef);
    getDocs(q)
      .then((querySnapshot) => {
        const otherCasesData: CaseItem[] = [];
        querySnapshot.forEach((doc) => {
          const caseData = { id: doc.id, ...doc.data() } as CaseItem;
          if (id !== doc.id) {
            otherCasesData.push(caseData);
          }
        });
        setOtherCasesState(otherCasesData);
      })
      .catch((error) => {
        logger.error("Error getting documents:", error);
      });
  }, [id, db, casesArray.length]);

  //func to copy link
  const [buttonText, setButtonText] = useState("Copy link");
  const handleLinkCopy = () => {
    const currentLink = globalThis.window.location.href;

    navigator.clipboard
      .writeText(currentLink)
      .then(() => {
        setButtonText("Copied!");
        setTimeout(() => {
          setButtonText("Copy link");
        }, 2000); // Change back to 'Copy link' after 3000 milliseconds (3 seconds)
      })
      .catch((err) => {
        logger.error("Unable to copy link to clipboard", err);
      });
  };

  return (
    <>
      <Navbar />
      <motion.div>
        <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[var(--theme-heading-color)]">
          <p className=" font-medium text-3xl md:text-4xl text-center">Use Case</p>
          <div
            className=" w-full h-[350px] my-16 bg-[var(--theme-surface-alt)] rounded-[20px]"
            style={{
              backgroundImage: `url(${resolvedSelected.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <p className=" font-medium text-lg md:text-2xl md:px-[15%] text-left">
            {resolvedSelected.title}
          </p>
          <p
            style={{ whiteSpace: "pre-line" }}
            className=" mt-3 md:px-[15%] text-sm text-justify font-normal whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resolvedSelected.content) }}
          />
          <div className=" md:px-[15%] mt-6">
            <button
              onClick={handleLinkCopy}
              className=" flex px-3 py-2 border border-[var(--theme-surface-alt)] rounded-[8px] justify-center items-center space-x-2"
            >
              <img src={copy} className=" w-4 h-4" alt="" />
              <p className=" text-xs font-medium">{buttonText}</p>
            </button>
          </div>

          <p className=" font-medium text-3xl md:text-3xl leading-[50px] text-center mt-16">
            Explore other use case
          </p>
          <p className=" text-center font-normal mt-3 text-xl text-[var(--theme-text-color)]">
            Explore our case studies to see how our solutions have made a real impact.
          </p>

          <div
            className={`grid grid-cols-1 md:grid-cols-${
              resolvedOtherCases.length > 1 ? 2 : 1
            } gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]`}
          >
            {resolvedOtherCases.slice(0, 2).map((item, index) => (
              <Link to={`/use-cases/${item.id}`} key={index}>
                <div className="w-full text-center">
                  <div
                    className="w-full h-[290px] bg-[var(--theme-surface-alt)] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <p className="text-left mt-6 text-xl lg:text-2xl font-medium">{item.title}</p>
                  <p className="text-left mt-3 text-[var(--theme-text-color)] text-sm">
                    {item.tagline.substring(0, 200) + "..."}
                  </p>
                  <button className=" flex mt-6 items-center">
                    <p className=" gradient-text text-base">View more</p>
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <motion.div className=" w-full font-Outfit text-[var(--theme-card-bg)]">
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
                  className=" w-full md:w-auto h-[52px] bg-[rgb(var(--secondary-color-rgb) / 0.5)] py-2.5 px-4 md:px-7 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]"
                  type="text"
                />
                <Link to="/contact" target="_blank" rel="noopener noreferrer">
                  <button className="  md:w-auto px-6 md:px-9 py-3 md:py-4 bg-[var(--theme-card-bg)] rounded-[30px] text-base text-[var(--theme-heading-color)]">
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
