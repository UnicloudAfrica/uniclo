import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import {getFirestore, getDoc, doc } from 'firebase/firestore';
import { motion } from "framer-motion";

const DetailedSolution = ({ scrollTarget, setScrollTarget, handleSolutionItemClick }) => {

    const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app)
    
    const[selectedSolutionItem, setSelectedSolutionItem] = useState([
        {
            topic: "",
            desc: "",
            date: "",
            url: "",
            content: "",
          }
    ]);

    const cases = [
        { topic: "Transforming [Client Name] with Cloud Migration", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
        { topic: "Transforming [Client Name] with Cloud Migration", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
    ];

    const { id } = useParams();

    useEffect(() => {
        if (id) {
          const docRef = doc(db, 'solutions', id); // 'id' is the name of the document
          getDoc(docRef)
            .then((doc) => {
              if (doc.exists()) {
                const solu = { id: doc.id, ...doc.data() };
                console.log('Document data:', solu);
                setSelectedSolutionItem(solu);
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
    }, [id, db]);

    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <div className="mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-[40px] leading-[50px] text-center">Solutions</p>
            <p className=" text-center font-normal mt-3 text-xl ">Tailored Cloud Solutions for Every Industry</p>
            <div className=" w-full h-[350px] my-16 bg-[#F5F5F4] rounded-[20px]">

            </div>
            <p className=" font-medium text-[30px] leading-[40px] text-center">{selectedSolutionItem.topic}</p>
            <p className=" mt-3 text-sm font-normal">{selectedSolutionItem.content}</p>

            <p className=" font-medium text-[40px] leading-[50px] text-center mt-16">Use Cases</p>
            <p className=" text-center font-normal mt-3 text-xl ">Explore our case studies to see how our solutions have made a real impact.</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]">
                {cases.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto block mt-6 text-base">
                            <p className=" gradient-text">App development</p>
                        </button>
                        <p className="text-left mt-6 text-3xl font-medium">{item.topic}</p>
                        <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">{item.content}</p>
                    </div>
                ))}
            </div>

        </div>

        <Footer/>
        </motion.div>
        </>
     );
}
 
export default DetailedSolution;