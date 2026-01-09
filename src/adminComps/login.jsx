import { GeneralContext } from "../contexts/contextprovider";
import { initializeApp, getApps } from "firebase/app";
import load from "./assets/load.gif";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const Login = () => {
  const [generalitem, setGeneralItem] = useContext(GeneralContext);
  const Navigate = useNavigate();

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // Guard firebase init
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);

  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [loadValue, setLoadValue] = useState("No");

  const handleSignIn = (e) => {
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
        const mess = document.getElementById("logMessage");
        if (mess) mess.textContent = errorCode; // Use textContent for safety
        setLoadValue("No");
      });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        Navigate("/cms-admin");
      }
    });
    return () => unsubscribe();
  }, [auth, Navigate]);

  const validateMail = () => {
    const mailVal = document.getElementById("mail").value;
    const mailWarn = document.getElementById("mailWarn");

    const checkMail = (m) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(m).toLowerCase());
    };
    if (checkMail(mailVal)) {
      mailWarn.classList.replace("hidden", "block");
      mailWarn.textContent = "Valid Mail";
      mailWarn.style.color = "green";
      setMail(mailVal);
    } else {
      mailWarn.classList.replace("hidden", "block");
      mailWarn.textContent = "Invalid Mail";
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
            <label className=" font-Outfit text-sm text-left w-full font-normal" htmlFor="mail">
              Email
            </label>
            <input
              type="text"
              onInput={validateMail}
              id="mail"
              placeholder="Enter your email"
              className=" h-[45px] w-[350px] glower mt-2 border border-[#3FE0C8CC] z-50 bg-[#ffffffcc] mb-6 text-blacl font-Outfit font-normal placeholder:font-Outfit text-sm rounded-[20px] block p-2.5"
            />
            <p
              id="mailWarn"
              className=" capitalize hidden mr-auto font-Outfit text-xs mt-1 text-[rgba(0,0,0,0.9)]"
            >
              Please fill in your Email
            </p>
            <label className=" font-Outfit text-sm text-left w-full font-normal" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              onInput={handlePword}
              placeholder="Enter your Password"
              className=" h-[45px] w-[350px] mt-2 border border-[#3FE0C8CC] z-50 bg-[#ffffffcc] mb-6 text-blacl font-Outfit font-normal placeholder:font-Outfit text-sm rounded-[20px] block p-2.5"
            />
            <p
              id="logMessage"
              className="block mr-auto text-[#1e1e1e] font-Outfit -mt-5 text-sm"
            ></p>
            <button
              id="signIn"
              onClick={handleSignIn}
              className=" w-full flex h-[45px] mt-6 rounded-[20px]  bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center font-Outfit text-base text-white font-medium items-center"
            >
              {loadValue === "No" && "Sign In"}
              {loadValue === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
