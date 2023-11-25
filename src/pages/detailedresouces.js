import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import {getFirestore, getDoc, doc, getDocs, collection, query } from 'firebase/firestore';
import { motion } from "framer-motion";


const DetailedResources = () => {

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
    
    const[selectedResourceItem, setSelectedResourceItem] = useState([
        {
            title: "",
            tagline: "",
            date: "",
            url: "",
            content: "",
          }
    ]);

    const [otherResources, setOtherResources] = useState([]);

    const { id } = useParams();

    useEffect(() => {
        if (id) {
          const docRef = doc(db, 'resources', id); // 'id' is the name of the document
          getDoc(docRef)
            .then((doc) => {
              if (doc.exists()) {
                const reso = { id: doc.id, ...doc.data() };
                // console.log('Document data:', reso);
                setSelectedResourceItem(reso);
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
        const resourcesCollectionRef = collection(db, 'resources');
        const q = query(resourcesCollectionRef);
        getDocs(q)
        .then((querySnapshot) => {
            const otherResourcesData = [];
            querySnapshot.forEach((doc) => {
            const resourceData = { id: doc.id, ...doc.data() };
            if (id !== doc.id) {
                otherResourcesData.push(resourceData);
            }
            });
            setOtherResources(otherResourcesData);
        })
        .catch((error) => {
            console.error("Error getting documents:", error);
        });
        
    }, [id, db]);

    return ( 
        <>
        <Navbar/>
        <motion.div
         
        >
        <div className="mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-[40px] leading-[50px] text-center">Resources</p>
            <div className=" w-full h-[350px] my-16 bg-[#F5F5F4] rounded-[20px]" style={{ backgroundImage: `url(${selectedResourceItem.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

            </div>
            <p className=" font-medium text-[30px] leading-[40px] text-center">{selectedResourceItem.title}</p>
            <p style={{ whiteSpace: 'pre-line' }} className=" mt-3 text-sm font-normal whitespace-pre-line">{selectedResourceItem.content}</p>

            <p className=" font-medium text-[40px] leading-[50px] text-center mt-16">Other Resources</p>
    
            <div className={`grid grid-cols-1 md:grid-cols-${otherResources.length > 1 ? 2 : 1} gap-[32px] lg:gap-[4%] w-full mt-8 mb-[6em]`}>
                {otherResources.map((item, index) => (
                    <Link to={`/resources/${item.id}`} key={index}>
                    <div className="w-full text-center">
                        <div className="w-full h-[290px] bg-[#F5F5F4] rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <p className="text-left mt-6 text-xl md:text-3xl font-medium">{item.title}</p>
                        <p className="text-left mt-3 text-[#1E1E1ECC] text-sm">{item.tagline.substring(0, 200) + '...'}</p>
                    </div>
                    </Link>
                ))}
            </div>

        </div>

        <Footer/>
        </motion.div>
        </>
     );
}
 
export default DetailedResources;