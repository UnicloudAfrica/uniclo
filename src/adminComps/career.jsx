import { useState, useContext, useRef } from "react";
import load from "./assets/load.gif";
import { initializeApp } from "firebase/app";
import { Editor } from "@tinymce/tinymce-react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { PageContext, CareerContext } from "../contexts/contextprovider";

const Career = () => {
  // toggle between Create new and Overview
  const [activeButton, setActiveButton] = useState("create");
  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);

  //states
  const [page, setPage] = useContext(PageContext);
  const [jobDetails, setJobDetails] = useState(null);
  const [jobTitle, setJobTitle] = useState(null);
  const [jobPay, setJobPay] = useState(null);
  const [jobDuration, setJobDuration] = useState(null);
  const [location, setLocation] = useState(null);
  const [desc, setDesc] = useState(null);
  const [deleteUser, setDeleteUser] = useState(false);
  const [docID, setDocID] = useState("");
  const [loadValue, setLoadValue] = useState("No");
  const [careerArray] = useContext(CareerContext);

  // For todays date;
  Date.prototype.today = function () {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const day = this.getDate();
    const month = months[this.getMonth()];
    const year = this.getFullYear();

    return `${month} ${day}, ${year}`;
  };

  const newDate = new Date();
  const date = newDate.today();

  const sumbmitImg = () => {
    if (jobDetails && jobTitle && jobPay && jobDuration && location && desc) {
      setLoadValue("Yes");
      const transactionDoc = collection(db, "career");
      const docData = {
        details: jobDetails,
        title: jobTitle,
        pay: jobPay,
        date: date,
        duration: jobDuration,
        location: location,
        desc: desc,
      };
      addDoc(transactionDoc, docData).then(() => {
        setLoadValue("No");
        alert("Created");
      });
    } else {
      alert("Please Complete all the fields");
    }
  };

  const handleDeleteClick = (e) => {
    deleteDoc(doc(db, "career", docID))
      .then(() => {
        alert("Deleted");
        setDeleteUser(false);
      })
      .catch((error) => {
        alert(error);
      });
  };

  const handleDelete = (e) => {
    setDeleteUser(true);
    const parent = e.target.parentElement;
    const parentParent = parent.parentElement;
    const parentParentParent = parentParent.parentElement;
    setDocID(parentParent.id);
  };

  const editorRef = useRef(null);
  const log = () => {
    if (editorRef.current) {
      setJobDetails(editorRef.current.getContent());
    }
  };

  return (
    <>
      <div className=" flex justify-center items-center mt-3">
        <div className=" bg-[#EAEBF0] rounded-[20px]">
          <button
            className={`font-medium font-Outfit text-sm py-2 px-5 rounded-[20px] transition-all ${
              activeButton === "create"
                ? " bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] text-[#121212]"
                : ""
            }`}
            onClick={() => {
              handleButtonClick("create");
            }}
          >
            Create
          </button>
          <button
            className={`font-medium font-Outfit text-sm py-2 px-5 rounded-[20px] transition-all ${
              activeButton === "overview"
                ? " bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] text-[#121212]"
                : ""
            }`}
            onClick={() => {
              handleButtonClick("overview");
            }}
          >
            Overview
          </button>
        </div>
      </div>

      {activeButton === "create" && (
        <div className=" my-8 w-full ">
          <div className=" w-full p-3 md:p-8 md:border rounded-[8px] border-[#DAE0E6]">
            <label className=" font-Outfit text-base font-medium" for="first-name">
              Position Title
            </label>
            <input
              type="text"
              onInput={(e) => {
                setJobTitle(e.target.value);
              }}
              placeholder="i.e UX Designer"
              class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />

            <label className=" font-Outfit text-base font-medium" for="first-name">
              Salary Range
            </label>
            <input
              type="text"
              onInput={(e) => {
                setJobPay(e.target.value);
              }}
              placeholder="i.e 80k-100k"
              class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />

            <label className=" font-Outfit text-base font-medium" for="first-name">
              Duration
            </label>
            <select
              name=""
              onInput={(e) => {
                setJobDuration(e.target.value);
              }}
              className="h-[45px] bg-[#F5F5F4] mt-2 mb-4 shadow-md shadow-[#1018280D] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              id=""
            >
              <option value="">Please Select</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            <label className=" font-Outfit text-base font-medium" for="first-name">
              Location
            </label>
            <select
              name=""
              onInput={(e) => {
                setLocation(e.target.value);
              }}
              className="h-[45px] bg-[#F5F5F4] mt-2 mb-4 shadow-md shadow-[#1018280D] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              id=""
            >
              <option value="">Please Select</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="South Africa">South Africa</option>
              <option value="Liberia">Liberia</option>
            </select>

            <label className=" font-Outfit text-base font-medium" for="first-name">
              Job Desc
            </label>
            <input
              type="text"
              onInput={(e) => {
                setDesc(e.target.value);
              }}
              placeholder="Short Job description"
              class=" h-[45px] bg-[#F5F5F4] mt-2 shadow-md shadow-[#1018280D] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />

            <label className=" font-Outfit text-base font-medium">
              Further Information about Job
            </label>

            <Editor
              apiKey="6nal7pczsjxywqe0s030u9o3x5hz0qcmx1skn7j0zr51wiha"
              onInit={(evt, editor) => {
                editorRef.current = editor;
              }}
              initialValue="<p>This is the initial content of the editor.</p>"
              init={{
                height: 300,
                menubar: true,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "code",
                  "help",
                  "wordcount",
                ],
                toolbar:
                  "undo redo | blocks | " +
                  "bold italic forecolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | help",
                content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                setup: (editor) => {
                  editor.on("change", () => {
                    log(editor.getContent());
                  });
                },
              }}
            />

            <button
              onClick={sumbmitImg}
              className=" w-full flex h-[45px] mt-6 rounded-[8px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center items-center"
            >
              {loadValue === "No" && <p className=" font-Outfit text-base text-white">Post Job</p>}
              {loadValue === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
            </button>
          </div>
        </div>
      )}

      {activeButton === "overview" && (
        <div className=" my-8 w-full overflow-auto">
          <div className="bg-[rgba(150,150,152,0.2)] backdrop-blur-[15px] p-3 rounded-md shadow w-full overflow-auto">
            <table className=" text-center overflow-auto border-b w-full border-[#00000049] mt-3">
              <thead>
                <tr className=" text-[#000] text-sm font-Outfit font-medium">
                  <th className="p-2 border-b border-[#00000049]">Title</th>
                  <th className="p-2 border-b border-[#00000049]">Range</th>
                  <th className="p-2 border-b border-[#00000049]">Location</th>
                  <th className="p-2 border-b border-[#00000049]">Control Center</th>
                </tr>
              </thead>
              <tbody id="table" className=" overflow-auto">
                {careerArray.map((doc) => {
                  return (
                    <tr
                      key={doc.id}
                      id={doc.id}
                      className="text-[#000] h-[4em] border-b border-[#00000049] overflow-hidden text-sm font-Outfit font-medium"
                    >
                      <td className="p-2 border-b  border-[#00000049]">{doc.title}</td>
                      <td className="p-2 border-b  border-[#00000049]">{doc.pay}</td>
                      <td className="p-2 border-b  border-[#00000049]">{doc.location}</td>
                      <td className=" text-white my-auto capitalize border-[#00000049] ">
                        <button
                          onClick={handleDelete}
                          className=" px-2 py-1 text-xs rounded-md bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className=" w-full h-[100vh] fixed z-[10000] px-5 top-0 left-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
          <div className="w-full md:w-[400px] rounded-md shadow p-5 bg-[#ffffff] relative flex justify-center flex-col text-sm font-Outfit font-medium items-center">
            <p className=" text-base font-normal text-center text-[#000]">
              Are you Sure you Want to delete this Data?
            </p>
            <span className=" flex flex-row space-x-3 mt-6 text-white">
              <button
                onClick={() => {
                  setDeleteUser(false);
                }}
                className="w-16 py-1 rounded-md bg-gray-500"
              >
                Cancel
              </button>
              <button onClick={handleDeleteClick} className="w-16 py-1 rounded-md bg-red-700">
                Delete
              </button>
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default Career;
