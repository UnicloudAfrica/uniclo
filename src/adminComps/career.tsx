import { useState, useContext } from "react";
import load from "./assets/load.gif";
import { Editor } from "@tinymce/tinymce-react";
import { collection, addDoc, doc, deleteDoc } from "firebase/firestore";
import { getFirestoreDb } from "../shared/config/firebase";
import { CareerContext } from "../contexts/contextprovider";

interface CareerRecord {
  id?: string;
  title?: string;
  pay?: string;
  location?: string;
}

const Career = () => {
  // toggle between Create new and Overview
  const [activeButton, setActiveButton] = useState("create");
  const handleButtonClick = (buttonName: string) => {
    setActiveButton(buttonName);
  };

  const db = getFirestoreDb();
  //states
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [jobTitle, setJobTitle] = useState<any>(null);
  const [jobPay, setJobPay] = useState<any>(null);
  const [jobDuration, setJobDuration] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [desc, setDesc] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState(false);
  const [docID, setDocID] = useState("");
  const [loadValue, setLoadValue] = useState("No");
  const [careerArray] = useContext(CareerContext);

  const formatToday = (value: Date) => {
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

    const day = value.getDate();
    const month = months[value.getMonth()];
    const year = value.getFullYear();

    return `${month} ${day}, ${year}`;
  };

  const newDate = new Date();
  const date = formatToday(newDate);

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

  const handleDeleteClick = () => {
    deleteDoc(doc(db, "career", docID))
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
            <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
              Position Title
            </label>
            <input
              type="text"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setJobTitle(e.target.value);
              }}
              placeholder="i.e UX Designer"
              className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />

            <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
              Salary Range
            </label>
            <input
              type="text"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setJobPay(e.target.value);
              }}
              placeholder="i.e 80k-100k"
              className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />

            <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
              Duration
            </label>
            <select
              name=""
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setJobDuration(e.target.value);
              }}
              className="h-[45px] bg-[var(--theme-surface-alt)] mt-2 mb-4 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              id=""
            >
              <option value="">Please Select</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
              Location
            </label>
            <select
              name=""
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setLocation(e.target.value);
              }}
              className="h-[45px] bg-[var(--theme-surface-alt)] mt-2 mb-4 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              id=""
            >
              <option value="">Please Select</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="South Africa">South Africa</option>
              <option value="Liberia">Liberia</option>
            </select>

            <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
              Job Desc
            </label>
            <input
              type="text"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDesc(e.target.value);
              }}
              placeholder="Short Job description"
              className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mb-6 text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />

            <label className=" font-Outfit text-base font-medium">
              Further Information about Job
            </label>

            <Editor
              apiKey="6nal7pczsjxywqe0s030u9o3x5hz0qcmx1skn7j0zr51wiha"
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
                content_style:
                  "body { font-family: var(--font-sans, Outfit, Inter, SF Pro Display, sans-serif); font-size:14px }",
                setup: (editor) => {
                  editor.on("change", () => {
                    setJobDetails(editor.getContent());
                  });
                },
              }}
            />

            <button
              onClick={sumbmitImg}
              className=" w-full flex h-[45px] mt-6 rounded-[8px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all justify-center items-center"
            >
              {loadValue === "No" && <p className=" font-Outfit text-base text-white">Post Job</p>}
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
                    Title
                  </th>
                  <th className="p-2 border-b border-[rgb(var(--theme-neutral-900) / 0.29)]">
                    Range
                  </th>
                  <th className="p-2 border-b border-[rgb(var(--theme-neutral-900) / 0.29)]">
                    Location
                  </th>
                  <th className="p-2 border-b border-[rgb(var(--theme-neutral-900) / 0.29)]">
                    Control Center
                  </th>
                </tr>
              </thead>
              <tbody id="table" className=" overflow-auto">
                {(careerArray as CareerRecord[]).map((doc: CareerRecord, index: number) => {
                  return (
                    <tr
                      key={doc.id ?? `career-${index}`}
                      id={doc.id ?? ""}
                      className="text-[var(--theme-heading-color)] h-[4em] border-b border-[rgb(var(--theme-neutral-900) / 0.29)] overflow-hidden text-sm font-Outfit font-medium"
                    >
                      <td className="p-2 border-b  border-[rgb(var(--theme-neutral-900) / 0.29)]">
                        {doc.title}
                      </td>
                      <td className="p-2 border-b  border-[rgb(var(--theme-neutral-900) / 0.29)]">
                        {doc.pay}
                      </td>
                      <td className="p-2 border-b  border-[rgb(var(--theme-neutral-900) / 0.29)]">
                        {doc.location}
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

export default Career;
