import { useState, useContext } from "react";
import load from "./assets/load.gif";
import { Editor } from "@tinymce/tinymce-react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { SolutionsContext } from "../contexts/contextprovider";

interface SolutionRecord {
  id?: string;
  topic?: string;
  url?: string;
}

const SolutionsAdmin = () => {
  // toggle between Create new and Overview
  const [activeButton, setActiveButton] = useState("create");

  const handleButtonClick = (buttonName: string) => {
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

  const [solutionTitle, setSolutionTitle] = useState<any>(null);
  const [solutionDesc, setSolutionDesc] = useState<any>(null);
  const [fileName, setFileName] = useState<any>(null);
  const [solutionContent, setSolutionContent] = useState<any>(null);
  const [file, setFile] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState(false);
  const [docID, setDocID] = useState("");
  const [loadValue, setLoadValue] = useState("No");
  const [solutionArray] = useContext(SolutionsContext);

  //date and time
  const formatToday = (value: Date) =>
    `${value.getDate() < 10 ? "0" : ""}${value.getDate()}/${value.getMonth() + 1 < 10 ? "0" : ""}${value.getMonth() + 1}/${value.getFullYear()}`;

  const formatTimeNow = (value: Date) =>
    `${value.getHours() < 10 ? "0" : ""}${value.getHours()}:${value.getMinutes() < 10 ? "0" : ""}${value.getMinutes()}:${value.getSeconds() < 10 ? "0" : ""}${value.getSeconds()}`;

  const newDate = new Date();
  const date = formatToday(newDate);
  const time = formatTimeNow(newDate);

  const sumbmitImg = () => {
    if (file && solutionTitle && solutionDesc && solutionContent) {
      setLoadValue("Yes");
      const storageRef = ref(storage, fileName);

      uploadBytes(storageRef, file).then(() => {
        getDownloadURL(storageRef).then((url) => {
          const transactionDoc = collection(db, "solutions");
          const docData = {
            date: date,
            url: url,
            time: time,
            topic: solutionTitle,
            desc: solutionDesc,
            content: solutionContent,
          };
          addDoc(transactionDoc, docData).then(() => {
            setLoadValue("No");
            alert("Created");
          });
        });
      });
    } else {
      alert("Please Complete all the fields");
    }
  };

  const handleDeleteClick = () => {
    deleteDoc(doc(db, "solutions", docID))
      .then(() => {
        alert("Deleted");
        setDeleteUser(false);
      })
      .catch((error) => {
        alert(error);
      });
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    setDeleteUser(true);
    const row = e.currentTarget.closest("tr");
    setDocID(row?.id ?? "");
  };

  return (
    <>
      <div className=" flex justify-center items-center mt-3">
        <div className=" bg-[var(--theme-surface-alt)] rounded-[20px]">
          <button
            className={`font-medium font-Outfit text-sm py-2 px-5 rounded-[20px] transition-all ${
              activeButton === "create"
                ? " bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] text-[var(--theme-heading-color)]"
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
                ? " bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] text-[var(--theme-heading-color)]"
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
          <div className=" w-full p-3 md:p-8 md:border rounded-[8px] border-[var(--border-default)]">
            <div className=" w-full flex flex-col ">
              <span className=" w-full mb-6">
                <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
                  Title
                </label>
                <input
                  type="text"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSolutionTitle(e.target.value);
                  }}
                  placeholder="Your solutions title here i.e (Enterprise)"
                  className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </span>
              <span className=" w-full mb-6">
                <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
                  Image
                </label>
                <input
                  type="file"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedFile = e.target.files?.[0] ?? null;
                    setFile(selectedFile);
                    setFileName(e.target.value);
                  }}
                  className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </span>
              <span className=" w-full mb-6">
                <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
                  Description
                </label>
                <input
                  type="text"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSolutionDesc(e.target.value);
                  }}
                  placeholder="i.e Scale your business seamlessly with our enterprise-grade cloud solutions, ensuring agility and competitiveness."
                  className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </span>
            </div>

            <label className=" font-Outfit text-base font-medium" htmlFor="Message">
              Content
            </label>
            <Editor
              apiKey="6nal7pczsjxywqe0s030u9o3x5hz0qcmx1skn7j0zr51wiha"
              initialValue="<p>This is the initial content of the editor.</p>"
              init={{
                height: 300,
                menubar: false,
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
                content_style:
                  "body { font-family: var(--font-sans, Outfit, Inter, SF Pro Display, sans-serif); font-size:14px }",
                setup: (editor) => {
                  editor.on("change", () => {
                    setSolutionContent(editor.getContent());
                  });
                },
              }}
            />

            <button
              onClick={sumbmitImg}
              className=" w-full flex h-[45px] mt-6 rounded-[8px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all justify-center items-center"
            >
              {loadValue === "No" && (
                <p className=" font-Outfit text-base text-white">Create solution</p>
              )}
              {loadValue === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
            </button>
          </div>
        </div>
      )}

      {activeButton === "overview" && (
        <div className=" my-8 w-full overflow-auto">
          <div className="bg-[rgb(var(--theme-neutral-300) / 0.2)] backdrop-blur-[15px] p-3 rounded-md shadow w-full overflow-auto">
            <table className=" text-center overflow-auto border-b w-full border-[rgb(var(--theme-neutral-900) / 0.29)] mt-3">
              <thead>
                <tr className=" text-[var(--theme-heading-color)] text-sm font-Outfit font-medium">
                  <th className="p-2 border-b border-[rgb(var(--theme-neutral-900) / 0.29)]">
                    Topic
                  </th>
                  <th className="p-2 border-b border-[rgb(var(--theme-neutral-900) / 0.29)]">
                    Image
                  </th>
                  <th className="p-2 border-b border-[rgb(var(--theme-neutral-900) / 0.29)]">
                    Control Center
                  </th>
                </tr>
              </thead>
              <tbody id="table" className=" overflow-auto">
                {(solutionArray as SolutionRecord[]).map((doc: SolutionRecord, index: number) => {
                  return (
                    <tr
                      key={doc.id ?? `solution-${index}`}
                      id={doc.id ?? ""}
                      className="text-[var(--theme-heading-color)] h-[4em] border-b border-[rgb(var(--theme-neutral-900) / 0.29)] overflow-hidden text-sm font-Outfit font-medium"
                    >
                      <td className="p-2 border-b  capitalize border-[rgb(var(--theme-neutral-900) / 0.29)]">
                        {doc.topic}
                      </td>
                      <td className=" border-b  border-[rgb(var(--theme-neutral-900) / 0.29)]">
                        <a
                          className=" px-2 py-1 bg-[var(--theme-text-color)] text-xs rounded-md"
                          target="blank"
                          href={doc.url}
                        >
                          View
                        </a>
                      </td>
                      <td className=" text-white my-auto capitalize border-[rgb(var(--theme-neutral-900) / 0.29)] ">
                        <button
                          onClick={handleDelete}
                          className=" px-2 py-1 text-xs rounded-md bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)]"
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
        <div className=" w-full h-[100vh] fixed z-[10000] px-5 top-0 left-0 bg-[rgb(var(--theme-neutral-900) / 0.7)] flex justify-center items-center">
          <div className="w-full md:w-[400px] rounded-md shadow p-5 bg-[var(--theme-card-bg)] relative flex justify-center flex-col text-sm font-Outfit font-medium items-center">
            <p className=" text-base font-normal text-center text-[var(--theme-heading-color)]">
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

export default SolutionsAdmin;
