import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { getFirestore, getDoc, doc, getDocs, collection, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import copy from "./assets/copy.svg";
import { useContext } from "react";
import { BlogContext } from "../contexts/contextprovider";
import DOMPurify from "dompurify";

const DetailedBlog = () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app);

  const [blogArray] = useContext(BlogContext);
  const [processedArray, setProcessedArray] = useState([]);

  useEffect(() => {
    const processedBlogArray = blogArray.map((item) => ({
      ...item,
      processedName: encodeURIComponent(item.title).replaceAll("%20", "-"),
    }));
    setProcessedArray(processedBlogArray);
  }, [blogArray]);

  const [selectedBlogItem, setSelectedBlogItem] = useState([
    {
      topic: "",
      desc: "",
      date: "today",
      url: "",
      content: "",
    },
  ]);
  const [otherBlogs, setOtherBlogs] = useState([]);

  const { title } = useParams();

  useEffect(() => {
    const decodedTitle = decodeURIComponent(title).replaceAll("-", " ");
    if (title) {
      const blogsCollectionRef = collection(db, "blog");
      const q = query(blogsCollectionRef, where("title", "==", decodedTitle));

      getDocs(q)
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            // Assuming there is only one document with the given title
            const doc = querySnapshot.docs[0];
            const blogs = { id: doc.id, ...doc.data() };
            // console.log('Document data:', blogs);
            setSelectedBlogItem(blogs);
          } else {
            console.log("Document does not exist for decoded title:", decodedTitle);
          }
        })
        .catch((error) => {
          console.error("Error getting documents:", error);
        });
    }

    // Fetch all documents in the 'blog' collection excluding the current title
    const blogsCollectionRef = collection(db, "blog");
    const q = query(blogsCollectionRef);
    getDocs(q)
      .then((querySnapshot) => {
        const otherBlogsData = [];
        querySnapshot.forEach((doc) => {
          const blogData = { id: doc.id, ...doc.data() };
          // Exclude the current title from the list
          if (decodedTitle !== doc.data().title) {
            otherBlogsData.push(blogData);
          }
        });
        setOtherBlogs(otherBlogsData);
      })
      .catch((error) => {
        console.error("Error getting documents:", error);
      });
  }, [title, db]);

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
          {selectedBlogItem && selectedBlogItem.date ? (
            <div>
              <p className="gradient-txt text-center font-medium text-base">
                {"Published " + selectedBlogItem.date}
              </p>
              <p className="font-medium text-2xl md:text-[40px] md:leading-[50px] mt-3 md:px-[12%] text-center">
                {selectedBlogItem.title}
              </p>
              <p className="font-medium text-lg md:text-xl mt-3 md:px-[12%] text-center text-[#676767]">
                {selectedBlogItem.drawin}
              </p>
            </div>
          ) : null}
          <button className=" bg-[#3DC8F91A] px-4 py-2 mx-auto rounded-[30px] block mt-6 text-sm md:text-base">
            <p className=" gradient-text">{selectedBlogItem.tag}</p>
          </button>
          <div
            className=" w-full h-[350px] my-12 bg-[#F5F5F4] rounded-[20px]"
            style={{
              backgroundImage: `url(${selectedBlogItem.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <p
            style={{ whiteSpace: "pre-line" }}
            className=" mt-3 text-base text-[#676767] text-justify font-normal md:px-[15%] whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedBlogItem.content) }}
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

          <p className=" font-medium text-3xl  text-center mt-16">View our latest blogs</p>
          <div
            className={`grid grid-cols-1 md:grid-cols-${
              otherBlogs.length > 1 ? 2 : 1
            } gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]`}
          >
            {processedArray
              .filter((item) => item.title !== selectedBlogItem.title)
              .slice(0, 2)
              .map((item, index) => (
                <Link to={`/blogs/${item.processedName}`} key={index}>
                  <div className="w-full text-center">
                    <div
                      className="w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"
                      style={{
                        backgroundImage: `url(${item.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                    <p className="text-left mt-6 text-xl lg:text-2xl font-medium md:h-[2.5em]">
                      {item.title}
                    </p>
                    <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">
                      {item.drawin.substring(0, 200) + "..."}
                    </p>
                    <button className=" flex mt-6 items-center">
                      <p className=" gradient-text text-base">View more</p>
                    </button>
                  </div>
                </Link>
              ))}
          </div>

          <motion.div className=" w-full font-Outfit text-[#fff]">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative">
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

export default DetailedBlog;
