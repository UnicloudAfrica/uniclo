import { useEffect, useState, useRef } from "react";
import { Link } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, query, orderBy, onSnapshot} from 'firebase/firestore';
import arrowdown from './assets/Arrow_Down_Right_LG.svg';
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import DetailedSolution from "./detailedSolu";
import { motion } from "framer-motion";


const Solutions = () => {

    const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const db = getFirestore(app)

    const[solutionsArray, setSolutionsArray] = useState([
        {
          topic: "",
          desc: "",
          date: "",
          url: "",
          content: "",
        }
    ]);

    useEffect(() => {
        const colRef = collection(db, 'solutions');
        const q = query(colRef);
        onSnapshot(q, (snapshot) => {
          const solu = [];
          snapshot.docs.forEach((doc) => {
            solu.push({ id: doc.id, ...doc.data() });
          });
          setSolutionsArray(solu);
        });
    }, [db]);


    const [scrollTarget, setScrollTarget] = useState(null);
    const [selectedSolutionItem, setSelectedSolutionItem] = useState(false);
    const containerRef = useRef(null);

    const handleSolutionItemClick = (SolutionItem) => {
        setScrollTarget('detailed-Solution-item'); // Set the scroll target
        setSelectedSolutionItem(true);
    };

    const handleCloseDetailedView = () => {
        setSelectedSolutionItem(false);
    };


    const cases = [
        { topic: "Transforming [Client Name] with Cloud Migration", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
        { topic: "Transforming [Client Name] with Cloud Migration", content: "Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing Unlocking the Power of Cloud Computing......." },
    ];

    return ( 
        <>
        { selectedSolutionItem ? (<DetailedSolution selectedSolutionItem={selectedSolutionItem} scrollTarget={scrollTarget} setScrollTarget={setScrollTarget} handleSolutionItemClick={handleSolutionItemClick}/>
        ) : (
        <div>
        <Navbar/>
        <motion.div
         
        >
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">

            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Solutions</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Tailored Cloud Solutions for Every Industry</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em] md:mb-[10em]">
                {solutionsArray.map((item, index) => (
                    <div key={item.id} id={item.id} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <p className="text-left mt-3 text-xl font-medium">{item.topic}</p>
                        <p className="text-left mt-1 text-[#1e1e1e] text-sm">{item.content.substring(0,190) + '....'}</p>
                        <Link onClick={() => handleSolutionItemClick(item)} to={`/solutions/${item.id}`}><button className=' flex space-x-8 mt-6 items-center'>
                            <p className=' gradient-text text-base'>View more</p>
                            <img src={ arrowdown } className=' w-4 h-4' alt="" />
                        </button></Link>
                    </div>
                ))}
            </div>
            
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] mt-[8em] text-center">Use Cases</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl ">Explore our case studies to see how our solutions have made a real impact.</p>
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]">
                {cases.map((item, index) => (
                    <div key={index} className="w-full text-center">             
                        <div className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"></div>
                        <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto block mt-6 rounded-[30px] text-base">
                            <p className=" gradient-text">App development</p>
                        </button>
                        <p className="text-left mt-6 text-xl md:text-3xl font-medium">{item.topic}</p>
                        <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">{item.content}</p>
                    </div>
                ))}
            </div>
        </div>
        <Footer/>
        </motion.div>
        </div>
        )}
        </>
     );
}
 
export default Solutions;