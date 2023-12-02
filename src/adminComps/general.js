import { useState, useContext, useEffect, useRef } from "react";
import load from './assets/load.gif';
import cloud from './assets/cloud.png';
import { GeneralContext } from "../contexts/contextprovider";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from 'firebase/auth';


const General = () => {

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
    const auth = getAuth();
    const db = getFirestore(app);
    const storage = getStorage(app);

    const [selectedFileName, setSelectedFileName] = useState('');
    const [loading, setLoading] = useState('No');
    const [file, setFile] = useState(null);
    const [file1url, setFile1url] = useState('');
    const fileInputRef = useRef(null);
    const [generalitem, setGeneralItem] = useContext(GeneralContext);
    const [address, setAddress] = useState('');



    const handleFileInputChange = (e) => {
        const selectedFile = e.target.files[0];
        setSelectedFileName(selectedFile ? selectedFile.name : '');
        setFile(selectedFile);
    };
   
    const handleFileInputClick = () => {
        fileInputRef.current.click();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();

        const droppedFile = e.dataTransfer.files[0];
        setSelectedFileName(droppedFile ? droppedFile.name : '');
        // Do something with the dropped file, such as uploading it to a server
        setFile(droppedFile);
    };

    const handleUpdate = ()=>{
        setLoading('Yes')
        const metadata = {
            contentType: 'image/jpeg, image/png',
            name: selectedFileName,
        };
        const storageRef = ref(storage, selectedFileName, metadata);

        uploadBytes(storageRef, file).then((snapshot) => {
            getDownloadURL(storageRef)
            .then((url)=>{
                const docRef = doc(db, 'general', 'M8mSBHIGBl3ZcW03wANg');
                const newData = {
                    logourl:url
                };
                updateDoc(docRef, newData)
                .then(()=>{
                    alert('Updated');
                    setLoading('No');
                })
                .catch((error)=>{
                    alert(error)
                })
            })
        })
    };
    const handleUpdateaddy = ()=>{
        const docRef = doc(db, 'general', 'M8mSBHIGBl3ZcW03wANg');
        const newData = {
            address:address
        };
        updateDoc(docRef, newData)
        .then(()=>{
            alert('Updated');
            setLoading('No');
        })
        .catch((error)=>{
            alert(error)
                })
    };

    return ( 
        <>
        <div className=" mt-8 flex flex-col md:flex-row w-full justify-between">
            <div className=" w-full md:w-[28%]">
                <label className=" font-Outfit text-base font-medium" for="">Current Logo</label>
                <div name="" className="w-full mt-2 flex flex-col justify-center items-center h-[130px] p-2.5 bg-[#f5f5f5] rounded-[8px] text-base font-normal font-Outfit" id="">
                    <img src={ generalitem.logourl } alt="" />
                </div>
            </div>
            <div className=" w-full md:w-[68%]">
                <label className=" font-Outfit text-base font-medium" for="">Update Logo</label>
                <div name="" className="w-full mt-2 flex flex-col justify-center items-center h-[130px] p-2.5 bg-[#f5f5f5] rounded-[8px] text-base font-normal font-Outfit" onClick={handleFileInputClick} onDragOver={handleDragOver} onDrop={handleDrop} id="">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileInputChange} />
                    <button className=" bg-[#fff] w-[40px] h-[40px] rounded-[50%] flex justify-center items-center"><img src={ cloud } className=" w-6" alt="" /></button>
                    <p className=" font-Outfit font-normal text-sm"><span onClick={ handleFileInputClick} className=" cursor-pointer text-[#5CC7FF] font-medium">Click to upload</span> or drag and drop</p>
                    {selectedFileName ? (
                        <p className=" capitalize font-Outfit font-normal text-sm">File name: {selectedFileName}</p>
                    ) : ''}
                </div>
                <button onClick={ handleUpdate } className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all">
                    { loading === 'No' && <p className=" font-Outfit text-base text-white">Update</p> }
                    { loading === 'Yes' && <img src={ load } className=' w-6 h-6' alt="" />}
                </button>
            </div>
        </div>
        <div>
            <label className=" font-Outfit text-base font-medium" for="first-name">Address</label>
            <input type="text" defaultValue={ generalitem.address } onInput={(e)=>{setAddress(e.target.value)}}  placeholder="Your case title here" class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
            <button onClick={ handleUpdate } className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all">
                { loading === 'No' && <p className=" font-Outfit text-base text-white">Update</p> }
                { loading === 'Yes' && <img src={ load } className=' w-6 h-6' alt="" />}
            </button>
        </div>
        </>
     );
}
 
export default General;