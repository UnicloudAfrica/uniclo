import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState, useContext } from "react";
import { initializeApp, getApps } from "firebase/app";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { getFirestore, getDocs, collection, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import copy from "./assets/copy.svg";
import { BlogContext } from "../contexts/contextprovider";
import DOMPurify from "dompurify";

interface BlogItem {
  id: string;
  title: string;
  desc: string;
  date: string;
  url: string;
  content: string;
  drawin: string;
  tag: string;
  processedName?: string;
  [key: string]: any;
}

const DetailedBlog = () => {
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
  const [blogArray] = useContext(BlogContext) as [BlogItem[]];
  const processedArray = useMemo(
    () =>
      blogArray.map((item) => ({
        ...item,
        processedName: encodeURIComponent(item.title).replace(/%20/g, "-"),
      })),
    [blogArray]
  );

  const emptyBlog = {
    topic: "",
    desc: "",
    date: "",
    url: "",
    content: "",
    title: "",
    drawin: "",
    tag: "",
  };
  const [selectedBlogItem, setSelectedBlogItem] = useState<BlogItem>(emptyBlog as BlogItem);
  const [otherBlogsState, setOtherBlogsState] = useState<BlogItem[]>([]);

  const { title } = useParams();
  const decodedTitle = useMemo(
    () => (title ? decodeURIComponent(title).replace(/-/g, " ") : ""),
    [title]
  );

  const selectedFromContext = useMemo(() => {
    if (!decodedTitle || !blogArray.length) return null;
    return blogArray.find((item) => item.title === decodedTitle) || null;
  }, [blogArray, decodedTitle]);

  const otherBlogsFromContext = useMemo(() => {
    if (!decodedTitle || !blogArray.length) return [];
    return blogArray.filter((item) => item.title !== decodedTitle);
  }, [blogArray, decodedTitle]);

  const resolvedSelected = selectedFromContext || selectedBlogItem;
  const resolvedOtherBlogs =
    otherBlogsFromContext.length > 0 ? otherBlogsFromContext : otherBlogsState;

  const db = useMemo(() => {
    if (typeof window === "undefined") return null;
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    return getFirestore(app);
  }, []);

  useEffect(() => {
    if (selectedFromContext) {
      setSelectedBlogItem(selectedFromContext);
    }
  }, [selectedFromContext]);

  useEffect(() => {
    if (!decodedTitle || !db || blogArray.length) return;
    const blogsCollectionRef = collection(db, "blog");
    const q = query(blogsCollectionRef, where("title", "==", decodedTitle));

    getDocs(q)
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const blogs = { id: doc.id, ...doc.data() } as BlogItem;
          setSelectedBlogItem(blogs);
        } else {
          console.log("Document does not exist for decoded title:", decodedTitle);
        }
      })
      .catch((error) => {
        console.error("Error getting documents:", error);
      });
  }, [decodedTitle, db, blogArray.length]);

  useEffect(() => {
    if (!decodedTitle || !db || blogArray.length) return;
    const blogsCollectionRef = collection(db, "blog");
    const q = query(blogsCollectionRef);
    getDocs(q)
      .then((querySnapshot) => {
        const otherBlogsData = [];
        querySnapshot.forEach((doc) => {
          const blogData = { id: doc.id, ...doc.data() } as BlogItem;
          if (decodedTitle !== doc.data().title) {
            otherBlogsData.push(blogData);
          }
        });
        setOtherBlogsState(otherBlogsData);
      })
      .catch((error) => {
        console.error("Error getting documents:", error);
      });
  }, [decodedTitle, db, blogArray.length]);

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
        console.error("Unable to copy link to clipboard", err);
      });
  };

  return (
    <>
      <Navbar />
      <motion.div>
        <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[var(--theme-heading-color)]">
          {resolvedSelected && resolvedSelected.date ? (
            <div>
              <p className="gradient-txt text-center font-medium text-base">
                {"Published " + resolvedSelected.date}
              </p>
              <p className="font-medium text-2xl md:text-[40px] md:leading-[50px] mt-3 md:px-[12%] text-center">
                {resolvedSelected.title}
              </p>
              <p className="font-medium text-lg md:text-xl mt-3 md:px-[12%] text-center text-[var(--theme-text-color)]">
                {resolvedSelected.drawin}
              </p>
            </div>
          ) : null}
          <button className=" bg-[rgb(var(--secondary-color-rgb) / 0.1)] px-4 py-2 mx-auto rounded-[30px] block mt-6 text-sm md:text-base">
            <p className=" gradient-text">{selectedBlogItem.tag}</p>
          </button>
          <div
            className=" w-full h-[350px] my-12 bg-[var(--theme-surface-alt)] rounded-[20px]"
            style={{
              backgroundImage: `url(${resolvedSelected.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <p
            style={{ whiteSpace: "pre-line" }}
            className=" mt-3 text-base text-[var(--theme-text-color)] text-justify font-normal md:px-[15%] whitespace-pre-line"
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

          <p className=" font-medium text-3xl  text-center mt-16">View our latest blogs</p>
          <div
            className={`grid grid-cols-1 md:grid-cols-${
              resolvedOtherBlogs.length > 1 ? 2 : 1
            } gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]`}
          >
            {processedArray
              .filter((item) => item.title !== resolvedSelected.title)
              .slice(0, 2)
              .map((item, index) => (
                <Link to={`/blogs/${item.processedName}`} key={index}>
                  <div className="w-full text-center">
                    <div
                      className="w-full h-[290px] bg-[var(--theme-surface-alt)] rounded-[20px]"
                      style={{
                        backgroundImage: `url(${item.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                    <p className="text-left mt-6 text-xl lg:text-2xl font-medium md:h-[2.5em]">
                      {item.title}
                    </p>
                    <p className="text-left mt-3 text-[rgb(var(--theme-neutral-900) / 0.8)] text-sm">
                      {item.drawin.substring(0, 200) + "..."}
                    </p>
                    <button className=" flex mt-6 items-center">
                      <p className=" gradient-text text-base">View more</p>
                    </button>
                  </div>
                </Link>
              ))}
          </div>

          <motion.div className=" w-full font-Outfit text-[var(--theme-card-bg)]">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] relative">
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

export default DetailedBlog;
