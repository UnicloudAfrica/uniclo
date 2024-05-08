import { GeneralContext } from "../contexts/contextprovider";
import { initializeApp } from "firebase/app";
import load from "./assets/load.gif";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";

const Login = () => {
  const [generalitem, setGeneralItem] = useContext(GeneralContext);
  const Navigate = useNavigate();

  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth();

  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [loadValue, setLoadValue] = useState("No");

  const signInBtn = () => {
    const signIn = document.getElementById("signIn");
    signIn.addEventListener("click", (e) => {
      e.preventDefault();
      setLoadValue("Yes");

      signInWithEmailAndPassword(auth, mail, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          setLoadValue("No");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          const mess = document.getElementById("logMessage");
          mess.innerHTML = errorCode;
          setLoadValue("No");
        });
    });
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        // direct to dashboard
        Navigate("/cms-admin");
      } else {
      }
    });
  });

  const validateMail = () => {
    const mail = document.getElementById("mail").value;
    const mailWarn = document.getElementById("mailWarn");

    const checkMail = (mail) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(mail).toLowerCase());
    };
    if (checkMail(mail)) {
      mailWarn.classList.replace("hidden", "block");
      mailWarn.innerHTML = "Valid Mail";
      mailWarn.style.color = "green";
      setMail(mail);
    } else {
      mailWarn.classList.replace("hidden", "block");
      mailWarn.innerHTML = "Invalid Mail";
      mailWarn.style.color = "red";
    }
  };

  const handlePword = (e) => {
    const pword = e.target.value;
    setPassword(pword);
  };

  return (
    <>
      <div className=" px-4">
        <div className=" px-3 md:px-3 flex flex-col mb-[4em] justify-center items-center relative w-full h-full">
          <img src={generalitem.logourl} className=" w-20 mt-16" alt="" />
          <p className=" mt-8 font-Outfit font-medium text-xl md:text-[32px]">
            Log into your Admin
          </p>
          <div className=" flex justify-center items-center flex-col mt-8">
            <label
              className=" font-Outfit text-sm text-left w-full font-normal"
              for="first-name"
            >
              Email
            </label>
            <input
              type="text"
              onInput={validateMail}
              id="mail"
              placeholder="Enter your email"
              class=" h-[45px] w-[350px] glower mt-2 border border-[#3FE0C8CC] z-50 bg-[#ffffffcc] mb-6 text-blacl font-Outfit font-normal placeholder:font-Outfit text-sm rounded-[20px] block p-2.5"
            />
            <p
              id="mailWarn"
              className=" capitalize hidden mr-auto font-Outfit text-xs mt-1 text-[rgba(0,0,0,0.9)]"
            >
              Please fill in your Email
            </p>
            <label
              className=" font-Outfit text-sm text-left w-full font-normal"
              for="first-name"
            >
              Password
            </label>
            <input
              type="password"
              onInput={handlePword}
              placeholder="Enter your Password"
              class=" h-[45px] w-[350px] mt-2 border border-[#3FE0C8CC] z-50 bg-[#ffffffcc] mb-6 text-blacl font-Outfit font-normal placeholder:font-Outfit text-sm rounded-[20px] block p-2.5"
            />
            <p
              id="logMessage"
              className="block mr-auto text-[#1e1e1e] font-Outfit -mt-5 text-sm"
            ></p>
            <button
              id="signIn"
              onClick={signInBtn}
              className=" w-full flex h-[45px] mt-6 rounded-[20px]  bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center font-Outfit text-base text-white font-medium items-center"
            >
              {loadValue === "No" && "Sign In"}
              {loadValue === "Yes" && (
                <img src={load} className=" w-6 h-6" alt="" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
