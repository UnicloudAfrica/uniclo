import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, getDocs, collection, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import DOMPurify from "dompurify";
import { BoardContext } from "../contexts/contextprovider";

interface BoardItem {
  id: string;
  name: string;
  about: string;
  position: string;
  url: string;
  [key: string]: any;
}

const DetailedBoard = () => {
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
  const [boardArray] = useContext(BoardContext) as [BoardItem[]];

  const emptyBoard = {
    name: "",
    about: "",
    position: "",
    url: "",
    id: "",
  };
  const [selectedBoardItem, setSelectedBoardItem] = useState<BoardItem>(emptyBoard);

  // const [otherBoards, setOtherBoards] = useState<any[]>([]);

  const { name } = useParams();
  const decodedName = useMemo(
    () => (name ? decodeURIComponent(name).replace(/-/g, " ") : ""),
    [name]
  );

  const selectedFromContext = useMemo(() => {
    if (!decodedName || !boardArray.length) return null;
    return boardArray.find((item) => item.name === decodedName) || null;
  }, [boardArray, decodedName]);

  const resolvedSelected = selectedFromContext || selectedBoardItem;

  const db = useMemo(() => {
    if (typeof window === "undefined") return null;
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    return getFirestore(app);
  }, []);

  useEffect(() => {
    if (selectedFromContext) {
      setSelectedBoardItem(selectedFromContext);
    }
  }, [selectedFromContext]);

  useEffect(() => {
    if (!decodedName || !db || boardArray.length) return;
    const blogsCollectionRef = collection(db, "board");
    const q = query(blogsCollectionRef, where("name", "==", decodedName));

    getDocs(q)
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const boards = { id: doc.id, ...doc.data() } as BoardItem;
          setSelectedBoardItem(boards);
        } else {
          console.log("Document does not exist for decoded title:", decodedName);
        }
      })
      .catch((error) => {
        console.error("Error getting documents:", error);
      });

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
  }, [decodedName, db, boardArray.length]);

  return (
    <>
      <Navbar />
      <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full flex flex-col justify-center items-center font-Outfit text-[var(--theme-heading-color)]">
        <p className=" md:text-5xl text-center font-medium">{resolvedSelected.name}</p>
        <div
          className=" mt-8 w-full md:w-[250px] h-[400px] md:h-[300px] bg-[var(--theme-surface-alt)] rounded-[20px]"
          style={{
            backgroundImage: `url(${resolvedSelected.url})`,
            backgroundSize: "cover",
          }}
        ></div>
        <p className=" mt-8 text-base text-[var(--theme-heading-color)] md:px-[15%] font-normal text-left w-full whitespace-pre-line ">
          {resolvedSelected.name}, {resolvedSelected.position}.
        </p>
        <p
          style={{ whiteSpace: "pre-line" }}
          className=" mt-3 text-base text-[var(--theme-text-color)] md:px-[15%] font-normal text-justify whitespace-pre-line mb-5"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resolvedSelected.about) }}
        />
      </div>

      <motion.div className="  my-16 px-4 md:px-8 lg:px-16 w-full font-Outfit text-[var(--theme-card-bg)]">
        <div className=" w-full h-[380px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] relative">
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
            <button className=" px-9 py-4 bg-[var(--theme-card-bg)] rounded-[30px] text-base text-[var(--theme-heading-color)] mt-4">
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
