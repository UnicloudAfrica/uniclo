import { useState, useContext, useRef } from "react";
import load from "./assets/load.gif";
import cloud from "./assets/cloud.png";
import { GeneralContext } from "../contexts/contextprovider";
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestoreDb, getFirebaseApp } from "../shared/config/firebase";

const General = () => {
  const db = getFirestoreDb();
  const storage = getStorage(getFirebaseApp());

  const [selectedFileName, setSelectedFileName] = useState("");
  const [loading, setLoading] = useState("No");
  const [loading1, setLoading1] = useState("No");
  const [loading2, setLoading2] = useState("No");
  const [loading3, setLoading3] = useState("No");
  const [loading4, setLoading4] = useState("No");
  const [loading5, setLoading5] = useState("No");
  const [loading6, setLoading6] = useState("No");
  const [loading7, setLoading7] = useState("No");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [generalitem] = useContext(GeneralContext);
  const [address, setAddress] = useState("");
  const [mail, setMail] = useState("");
  const [fb, setFb] = useState("");
  const [ig, setIg] = useState("");
  const [twitter, setTwitter] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setSelectedFileName(selectedFile ? selectedFile.name : "");
    setFile(selectedFile);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    setSelectedFileName(droppedFile ? droppedFile.name : "");
    // Do something with the dropped file, such as uploading it to a server
    setFile(droppedFile);
  };

  const handleUpdate = () => {
    setLoading("Yes");
    if (!file || !selectedFileName) {
      alert("Please select an image to upload.");
      setLoading("No");
      return;
    }
    const storageRef = ref(storage, selectedFileName);

    uploadBytes(storageRef, file).then(() => {
      getDownloadURL(storageRef).then((url) => {
        const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
        const newData = {
          logourl: url,
        };
        updateDoc(docRef, newData)
          .then(() => {
            alert("Updated");
            setLoading("No");
          })
          .catch((error) => {
            alert(error);
            setLoading("No");
          });
      });
    });
  };

  const handleUpdateaddy = () => {
    setLoading1("Yes");
    const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
    const newData = {
      address: address,
    };
    updateDoc(docRef, newData)
      .then(() => {
        alert("Updated");
        setLoading1("No");
      })
      .catch((error) => {
        alert(error);
        setLoading1("No");
      });
  };

  const handleUpdateMail = () => {
    setLoading2("Yes");
    const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
    const newData = {
      email: mail,
    };
    updateDoc(docRef, newData)
      .then(() => {
        alert("Updated");
        setLoading2("No");
      })
      .catch((error) => {
        alert(error);
        setLoading2("No");
      });
  };

  const handleUpdatefb = () => {
    setLoading3("Yes");
    const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
    const newData = {
      fb: fb,
    };
    updateDoc(docRef, newData)
      .then(() => {
        alert("Updated");
        setLoading3("No");
      })
      .catch((error) => {
        alert(error);
        setLoading3("No");
      });
  };

  const handleUpdateig = () => {
    setLoading4("Yes");
    const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
    const newData = {
      ig: ig,
    };
    updateDoc(docRef, newData)
      .then(() => {
        alert("Updated");
        setLoading4("No");
      })
      .catch((error) => {
        alert(error);
        setLoading4("No");
      });
  };

  const handleUpdatetwitter = () => {
    setLoading7("Yes");
    const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
    const newData = {
      twitter: twitter,
    };
    updateDoc(docRef, newData)
      .then(() => {
        alert("Updated");
        setLoading7("No");
      })
      .catch((error) => {
        alert(error);
        setLoading7("No");
      });
  };

  const handleUpdatewhatsapp = () => {
    setLoading5("Yes");
    const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
    const newData = {
      whatsapp: whatsapp,
    };
    updateDoc(docRef, newData)
      .then(() => {
        alert("Updated");
        setLoading5("No");
      })
      .catch((error) => {
        alert(error);
        setLoading5("No");
      });
  };

  const handleUpdatelinkedin = () => {
    setLoading6("Yes");
    const docRef = doc(db, "general", "M8mSBHIGBl3ZcW03wANg");
    const newData = {
      linkedin: linkedin,
    };
    updateDoc(docRef, newData)
      .then(() => {
        alert("Updated");
        setLoading6("No");
      })
      .catch((error) => {
        alert(error);
        setLoading6("No");
      });
  };

  return (
    <>
      <div className=" mt-8 flex flex-col md:flex-row w-full justify-between">
        <div className=" w-full md:w-[28%]">
          <label className=" font-Outfit text-base font-medium" htmlFor="">
            Current Logo
          </label>
          <div
            className="w-full mt-2 flex flex-col justify-center items-center h-[130px] p-2.5 bg-[var(--theme-surface-alt)] rounded-[8px] text-base font-normal font-Outfit"
            id=""
          >
            <img src={generalitem.logourl} className=" w-20" alt="" />
          </div>
        </div>
        <div className=" w-full md:w-[68%]">
          <label className=" font-Outfit text-base font-medium" htmlFor="">
            Update Logo
          </label>
          <div
            className="w-full mt-2 flex flex-col justify-center items-center h-[130px] p-2.5 bg-[var(--theme-surface-alt)] rounded-[8px] text-base font-normal font-Outfit"
            onClick={handleFileInputClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            id=""
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileInputChange}
            />
            <button className=" bg-[var(--theme-card-bg)] w-[40px] h-[40px] rounded-[50%] flex justify-center items-center">
              <img src={cloud} className=" w-6" alt="" />
            </button>
            <p className=" font-Outfit font-normal text-sm">
              <span
                onClick={handleFileInputClick}
                className=" cursor-pointer text-[rgb(var(--secondary-color-rgb))] font-medium"
              >
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            {selectedFileName ? (
              <p className=" capitalize font-Outfit font-normal text-sm">
                File name: {selectedFileName}
              </p>
            ) : (
              ""
            )}
          </div>
          <button
            onClick={handleUpdate}
            className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
          >
            {loading === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
            {loading === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
          </button>
        </div>
      </div>

      <div>
        <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
          Address
        </label>
        <input
          type="text"
          defaultValue={generalitem.address}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setAddress(e.target.value);
          }}
          placeholder="Your address here"
          className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={handleUpdateaddy}
          className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
        >
          {loading1 === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
          {loading1 === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
        </button>
      </div>

      <div>
        <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
          Company Email
        </label>
        <input
          type="text"
          defaultValue={generalitem.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setMail(e.target.value);
          }}
          placeholder="Your mail here"
          className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={handleUpdateMail}
          className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
        >
          {loading2 === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
          {loading2 === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
        </button>
      </div>

      <div>
        <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
          Facebook
        </label>
        <input
          type="text"
          defaultValue={generalitem.fb}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFb(e.target.value);
          }}
          placeholder="Your Link here"
          className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={handleUpdatefb}
          className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
        >
          {loading3 === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
          {loading3 === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
        </button>
      </div>

      <div>
        <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
          Instagram
        </label>
        <input
          type="text"
          defaultValue={generalitem.ig}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setIg(e.target.value);
          }}
          placeholder="Your Link here"
          className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={handleUpdateig}
          className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
        >
          {loading4 === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
          {loading4 === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
        </button>
      </div>

      <div>
        <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
          Whatsapp
        </label>
        <input
          type="text"
          defaultValue={generalitem.whatsapp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setWhatsapp(e.target.value);
          }}
          placeholder="Your Link here"
          className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={handleUpdatewhatsapp}
          className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
        >
          {loading5 === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
          {loading5 === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
        </button>
      </div>

      <div>
        <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
          Linkedin
        </label>
        <input
          type="text"
          defaultValue={generalitem.linkedin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setLinkedin(e.target.value);
          }}
          placeholder="Your Link here"
          className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={handleUpdatelinkedin}
          className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
        >
          {loading6 === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
          {loading6 === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
        </button>
      </div>

      <div>
        <label className=" font-Outfit text-base font-medium" htmlFor="first-name">
          Twitter
        </label>
        <input
          type="text"
          defaultValue={generalitem.twitter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTwitter(e.target.value);
          }}
          placeholder="Your Link here"
          className=" h-[45px] bg-[var(--theme-surface-alt)] mt-2 shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] text-gray-900 font-Outfit font-normal placeholder:font-Outfit text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={handleUpdatetwitter}
          className=" block ml-auto px-6 py-2 mt-3 text-sm md:text-base font-Outfit text-white rounded-xl bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all"
        >
          {loading7 === "No" && <p className=" font-Outfit text-base text-white">Update</p>}
          {loading7 === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
        </button>
      </div>
    </>
  );
};

export default General;
