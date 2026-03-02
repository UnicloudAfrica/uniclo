import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc, getDocs, collection, query } from "firebase/firestore";
import { motion } from "framer-motion";
import copy from "./assets/copy.svg";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import DOMPurify from "dompurify";
import { ResourcesContext } from "../contexts/contextprovider";
import logger from "../utils/logger";

interface ResourceItem {
  id: string;
  title: string;
  tagline: string;
  date: string;
  url: string;
  content: string;
  [key: string]: any;
}

const DetailedResources = () => {
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
  const [resourcesArray] = useContext(ResourcesContext) as [ResourceItem[]];

  const emptyResource = {
    title: "",
    tagline: "",
    date: "",
    url: "",
    content: "",
    id: "",
  };
  const [selectedResourceItem, setSelectedResourceItem] = useState<ResourceItem>(emptyResource);
  const [otherResourcesState, setOtherResourcesState] = useState<ResourceItem[]>([]);

  const { id } = useParams();

  const selectedFromContext = useMemo(() => {
    if (!id || !resourcesArray.length) return null;
    return resourcesArray.find((item) => item.id === id) || null;
  }, [id, resourcesArray]);

  const otherResourcesFromContext = useMemo(() => {
    if (!id || !resourcesArray.length) return [];
    return resourcesArray.filter((item) => item.id !== id);
  }, [id, resourcesArray]);

  const resolvedSelected = selectedFromContext || selectedResourceItem;
  const resolvedOtherResources =
    otherResourcesFromContext.length > 0 ? otherResourcesFromContext : otherResourcesState;

  const db = useMemo(() => {
    if (typeof window === "undefined") return null;
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
    return getFirestore(app);
  }, []);

  useEffect(() => {
    if (selectedFromContext) {
      setSelectedResourceItem(selectedFromContext);
    }
  }, [selectedFromContext]);

  useEffect(() => {
    if (!id || !db || resourcesArray.length) return;
    const docRef = doc(db, "resources", id);
    getDoc(docRef)
      .then((doc) => {
        if (doc.exists()) {
          const reso = { id: doc.id, ...doc.data() } as ResourceItem;
          setSelectedResourceItem(reso);
        } else {
          logger.log("Document does not exist");
        }
      })
      .catch((error) => {
        logger.error("Error getting document:", error);
      });
  }, [id, db, resourcesArray.length]);

  useEffect(() => {
    if (!id || !db || resourcesArray.length) return;
    const resourcesCollectionRef = collection(db, "resources");
    const q = query(resourcesCollectionRef);
    getDocs(q)
      .then((querySnapshot) => {
        const otherResourcesData: ResourceItem[] = [];
        querySnapshot.forEach((doc) => {
          const resourceData = { id: doc.id, ...doc.data() } as ResourceItem;
          if (id !== doc.id) {
            otherResourcesData.push(resourceData);
          }
        });
        setOtherResourcesState(otherResourcesData);
      })
      .catch((error) => {
        logger.error("Error getting documents:", error);
      });
  }, [id, db, resourcesArray.length]);

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
          <p className=" font-medium text-xl md:text-2xl text-center">Resources</p>
          <div
            className=" w-full h-[350px] my-16 bg-[var(--theme-surface-alt)] rounded-[20px]"
            style={{
              backgroundImage: `url(${resolvedSelected.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <p className=" font-medium text-xl md:text-2xl text-center">{resolvedSelected.title}</p>
          <p
            style={{ whiteSpace: "pre-line" }}
            className=" mt-6 text-sm md:px-[15%] font-normal text-justify whitespace-pre-line mb-5"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resolvedSelected.content) }}
          />
          <div className=" md:px-[15%]">
            <button
              onClick={handleLinkCopy}
              className=" flex px-3 py-2 border border-[var(--theme-surface-alt)] rounded-[8px] justify-center items-center space-x-2"
            >
              <img src={copy} className=" w-4 h-4" alt="" />
              <p className=" text-xs font-medium">{buttonText}</p>
            </button>
          </div>

          {resolvedOtherResources.length > 1 && (
            <p className=" font-medium text-[40px] leading-[50px] text-center mt-16">
              Other Resources
            </p>
          )}

          {resolvedOtherResources.length > 1 && (
            <div
              className={`grid grid-cols-1 md:grid-cols-${
                resolvedOtherResources.length > 1 ? 2 : 1
              } gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]`}
            >
              {resolvedOtherResources.map((item, index) => (
                <Link to={`/resources/${item.id}`} key={index}>
                  <div className="w-full text-center">
                    <div
                      className="w-full h-[290px] bg-[var(--theme-surface-alt)] rounded-[20px]"
                      style={{
                        backgroundImage: `url(${item.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                    <p className="text-left mt-6 text-xl lg:text-3xl font-medium">{item.title}</p>
                    <p className="text-left mt-3 text-[rgb(var(--theme-neutral-900) / 0.8)] text-sm">
                      {item.tagline.substring(0, 200) + "..."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <motion.div className="  py-[3em] w-full font-Outfit text-[var(--theme-card-bg)]">
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

export default DetailedResources;
