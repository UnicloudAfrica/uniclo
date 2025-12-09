import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc, getDocs, collection, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import copy from "./assets/copy.svg";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";

const DetailedBoard = () => {
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [selectedBoardItem, setSelectedBoardItem] = useState([
    {
      name: "",
      about: "",
      position: "",
      url: "",
    },
  ]);

  // const [otherBoards, setOtherBoards] = useState([]);

  const { name } = useParams();

  useEffect(() => {
    const decodedName = decodeURIComponent(name).replaceAll("-", " ");

    if (name) {
      const blogsCollectionRef = collection(db, "board");
      const q = query(blogsCollectionRef, where("name", "==", decodedName));

      getDocs(q)
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            // Assuming there is only one document with the given name
            const doc = querySnapshot.docs[0];
            const boards = { id: doc.id, ...doc.data() };
            // console.log('Document data:', manages);
            setSelectedBoardItem(boards);
          } else {
            console.log("Document does not exist for decoded title:", decodedName);
          }
        })
        .catch((error) => {
          console.error("Error getting documents:", error);
        });
    }

    // Fetch all documents in the 'cases' collection
    // const boardCollectionRef = collection(db, 'board');
    // const q = query(boardCollectionRef);
    // getDocs(q)
    // .then((querySnapshot) => {
    //     const otherBoardData = [];
    //     querySnapshot.forEach((doc) => {
    //     const boardData = { id: doc.id, ...doc.data() };
    //     if (id !== doc.id) {
    //         otherBoardData.push(boardData);
    //     }
    //     });
    //     setOtherBoards(otherBoardData);
    // })
    // .catch((error) => {
    //     console.error("Error getting documents:", error);
    // });
  }, [name, db]);

  return (
    <>
      <Navbar />
      <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full flex flex-col justify-center items-center font-Outfit text-[#121212]">
        <p className=" md:text-5xl text-center font-medium">{selectedBoardItem.name}</p>
        <div
          className=" mt-8 w-full md:w-[250px] h-[400px] md:h-[300px] bg-[#f5f5f4] rounded-[20px]"
          style={{
            backgroundImage: `url(${selectedBoardItem.url})`,
            backgroundSize: "cover",
          }}
        ></div>
        <p className=" mt-8 text-base text-[#000] md:px-[15%] font-normal text-left w-full whitespace-pre-line ">
          {selectedBoardItem.name}, {selectedBoardItem.position}.
        </p>
        <p
          style={{ whiteSpace: "pre-line" }}
          className=" mt-3 text-base text-[#676767] md:px-[15%] font-normal text-justify whitespace-pre-line mb-5"
          dangerouslySetInnerHTML={{ __html: selectedBoardItem.about }}
        />
      </div>

      <motion.div className="  my-16 px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#fff]">
        <div className=" w-full h-[380px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative">
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
          <p className=" font-semibold text-3xl md:text-4xl">Partner with us today</p>
          <p className=" font-normal px-4 md:px-0 text-xl">
            Partner with us to deliver unmatched cloud solutions.
          </p>
          <Link to="/contact" target="_blank" rel="noopener noreferrer">
            <button className=" px-9 py-4 bg-[#fff] rounded-[30px] text-base text-[#000] mt-4">
              Contact Us
            </button>
          </Link>
        </div>
      </motion.div>

      <Footer />
    </>
  );
};

export default DetailedBoard;
