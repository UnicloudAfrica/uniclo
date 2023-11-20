import { useState } from 'react';
import load from './assets/load.gif';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Cases = () => {

    // toggle between Create new and Overview
    const [activeButton, setActiveButton] = useState('create');

    const handleButtonClick = (buttonName) => {
        setActiveButton(buttonName);
    };

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
    const db = getFirestore(app);
    const storage = getStorage(app);

    //states
    
    const [caseTitle, setCaseTitle] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [caseTag, setCaseTag] = useState(null);
    const [caseContent, setCaseContent] = useState(null);
    const [file, setFile] = useState(null);
    const [loadValue, setLoadValue] = useState('No');

    //date and time
    // For todays date;
    Date.prototype.today = function () { 
        return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
    }

    // For the time now
    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }
    
    const newDate = new Date();
    const date =  newDate.today();
    const time = newDate.timeNow();

    const sumbmitImg = ()=>{
        if(file && caseTitle && caseTag && caseContent){
            setLoadValue('Yes')
            const metadata = {
                contentType: 'image/jpeg, image/png',
                name: fileName,
            };
            const storageRef = ref(storage, fileName, metadata);

            uploadBytes(storageRef, file).then((snapshot) => {
                getDownloadURL(storageRef)
                .then((url)=>{
                    const transactionDoc = collection(db, 'cases');
                    const docData = {
                        date:date,
                        url:url,
                        time:time,
                        title:caseTitle,
                        tagline:caseTag,
                        content:caseContent,
                    }
                    addDoc(transactionDoc, docData)
                    .then(()=>{
                        setLoadValue('No');
                        alert('Created')
                    });
                });
            });
        }
        else{
            alert('Please Complete all the fields')
        }
    };

    return ( 
        <>
        <div className=" flex justify-center items-center mt-3">
            <div className=" bg-[#EAEBF0] rounded-[20px]">
                <button
                    className={`font-medium font-Outfit text-sm py-2 px-5 rounded-[20px] transition-all ${
                        activeButton === 'create'
                            ? ' bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] text-[#121212]'
                            : ''
                    }`}
                    onClick={() => {handleButtonClick('create')}}
                >
                Create
                </button>
                <button
                className={`font-medium font-Outfit text-sm py-2 px-5 rounded-[20px] transition-all ${
                    activeButton === 'overview'
                        ? ' bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] text-[#121212]'
                        : ''
                }`}
                onClick={() => {handleButtonClick('overview')}}
                >
                Overview
                </button>
            </div>
        </div>

        <div className=" my-8 w-full ">
            <div className=" w-full p-3 md:p-8 md:border rounded-[8px] border-[#DAE0E6]">
                <div className=" w-full flex flex-col ">
                    <span className=" w-full mb-6">
                        <label className=" font-Outfit text-base font-medium" for="first-name">Title</label>
                        <input type="text" onInput={(e)=>{setCaseTitle(e.target.value)}}  placeholder="Your case title here" class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
                    </span>
                    <span className=" w-full mb-6">
                        <label className=" font-Outfit text-base font-medium" for="first-name">Image</label>
                        <input type="file" onChange={(e)=>{setFile(e.target.files[0]); setFileName(e.target.value)}} on class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
                    </span>
                </div>
                <label className=" font-Outfit text-base font-medium" for="first-name">Tagline</label>
                <input type="text" onInput={(e)=>{setCaseTag(e.target.value)}} placeholder="Your case tag Here" class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>

                <label className=" font-Outfit text-base font-medium" for="Message">Content</label>
                <textarea id="message" onInput={(e)=>{setCaseContent(e.target.value)}} rows={6} placeholder="Your case content here..." class="shadow-md shadow-[#1018280D] mb-4 bg-[#F5F5F4] font-Outfit font-normal placeholder:font-Outfit text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>

                <button onClick={sumbmitImg} className=" w-full flex h-[45px] mt-6 rounded-[8px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center items-center">
                    { loadValue === 'No' && <p className=" font-Outfit text-base text-white">Create Case</p> }
                    { loadValue === 'Yes' && <img src={ load } className=' w-6 h-6' alt="" />}
                </button>
            </div>
        </div>
        </>
     );
}
 
export default Cases;