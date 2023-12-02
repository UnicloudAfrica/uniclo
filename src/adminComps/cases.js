import { useState, useContext, useRef} from 'react';
import load from './assets/load.gif';
import { Editor } from '@tinymce/tinymce-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { PageContext, CasesContext } from '../contexts/contextprovider';


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
    const [deleteUser, setDeleteUser] = useState(false);
    const [docID, setDocID] =useState('');
    const [loadValue, setLoadValue] = useState('No');
    const [caseArray] = useContext(CasesContext);

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

    const handleDeleteClick =(e)=>{
        deleteDoc(doc(db, "cases", docID))
        .then(()=>{
            alert('Deleted');
            setDeleteUser(false)
        })
        .catch((error)=>{
            alert(error)
        })
    };


    const handleDelete = (e) =>{
        setDeleteUser(true);
        const parent = e.target.parentElement;
        const parentParent = parent.parentElement;
        const parentParentParent = parentParent.parentElement;
        setDocID(parentParent.id);
    };

    const editorRef = useRef(null);

    const log = () => {
        if (editorRef.current) {
            setCaseContent(editorRef.current.getContent());
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

        { activeButton === 'create' && <div className=" my-8 w-full ">
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
                <input type="text" maxLength={200} onInput={(e)=>{setCaseTag(e.target.value)}} placeholder="i.e About 160 Characters is advised (Max length: 200)" class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>

                <label className=" font-Outfit text-base font-medium" for="Message">Content</label>
                <Editor
                    apiKey='6nal7pczsjxywqe0s030u9o3x5hz0qcmx1skn7j0zr51wiha'
                    onInit={(evt, editor) => {
                        editorRef.current = editor
                        // const contentArea = editor.getBody();

                        // // Attach input event listener to the content area
                        // contentArea.addEventListener('input', () => {
                        //     log(editor.getContent());
                        // });
                    }}
                    initialValue="<p>This is the initial content of the editor.</p>"
                    init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    setup: editor => {
                        editor.on('change', () => {
                          log(editor.getContent());
                        });
                      },
                    }}
                />

                <button onClick={sumbmitImg} className=" w-full flex h-[45px] mt-6 rounded-[8px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center items-center">
                    { loadValue === 'No' && <p className=" font-Outfit text-base text-white">Create Case</p> }
                    { loadValue === 'Yes' && <img src={ load } className=' w-6 h-6' alt="" />}
                </button>
            </div>
        </div>}

        { activeButton === 'overview' && <div className=" my-8 w-full overflow-auto">
            <div className="bg-[rgba(150,150,152,0.2)] backdrop-blur-[15px] p-3 rounded-md shadow w-full overflow-auto">
            <table className=" text-center overflow-auto border-b w-full border-[#00000049] mt-3">
                <thead>
                    <tr className=" text-[#000] text-sm font-Outfit font-medium">
                        <th className="p-2 border-b border-[#00000049]">Date</th>
                        <th className="p-2 border-b border-[#00000049]">Title</th>
                        <th className="p-2 border-b border-[#00000049]">Image</th>
                        <th className="p-2 border-b border-[#00000049]">Control Center</th>
                    </tr>
                </thead>
                <tbody id="table" className=" overflow-auto">
                    {caseArray.map((doc) => {
                        return (
                            <tr key={doc.id} id={doc.id} className="text-[#000] h-[4em] border-b border-[#00000049] overflow-hidden text-sm font-Outfit font-medium">
                            <td className="p-2 border-b  capitalize border-[#00000049]">{ doc.date}</td>
                            <td className="p-2 border-b  capitalize border-[#00000049]">{doc.title ? `${doc.title.substring(0, 30)}...` : 'No title'}</td>
                            <td className=" border-b  border-[#00000049]"><a className=" px-2 py-1 bg-[#939292] text-xs rounded-md" target="blank" href={doc.url}>View</a></td>
                            <td className=" text-white my-auto capitalize border-[#00000049] ">
                                <button 
                                onClick={handleDelete}
                                className=" px-2 py-1 text-xs rounded-md bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC]">Delete</button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>
        </div>}

        { deleteUser && <div className=" w-full h-[100vh] fixed z-[10000] px-5 top-0 left-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
            <div className="w-full md:w-[400px] rounded-md shadow p-5 bg-[#ffffff] relative flex justify-center flex-col text-sm font-Outfit font-medium items-center">
                <p className=" text-base font-normal text-center text-[#000]">Are you Sure you Want to delete this Data?</p>
                <span className=" flex flex-row space-x-3 mt-6 text-white">
                    <button onClick={()=>{setDeleteUser(false)}} className="w-16 py-1 rounded-md bg-gray-500">Cancel</button>
                    <button onClick={handleDeleteClick} className="w-16 py-1 rounded-md bg-red-700">Delete</button>
                </span>
            </div>
        </div>}
        </>
     );
}
 
export default Cases;