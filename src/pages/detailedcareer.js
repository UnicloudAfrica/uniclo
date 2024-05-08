import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams, Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import arrow from "./assets/arrow-down.svg";
import {
  getFirestore,
  getDoc,
  doc,
  getDocs,
  collection,
  query,
} from "firebase/firestore";
import { motion } from "framer-motion";
import time from "./assets/time.svg";
import dollar from "./assets/dollar.svg";
import { countries } from "countries-list";
// import copy from './assets/copy.svg';
import { State } from "country-state-city";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import load from "./assets/load.gif";
import checked from "./assets/checked.png";
import warning from "./assets/warning.png";

const DetailedCareer = () => {
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
  const db = getFirestore(app);

  const [selectedCareerItem, setSelectedCareerItem] = useState([
    {
      title: "",
      pay: "",
      date: "today",
      duration: "",
      desc: "",
    },
  ]);

  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const docRef = doc(db, "career", id); // 'id' is the name of the document
      getDoc(docRef)
        .then((doc) => {
          if (doc.exists()) {
            const career = { id: doc.id, ...doc.data() };
            setSelectedCareerItem(career);
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
  }, [id, db]);

  //func to copy link
  const [buttonText, setButtonText] = useState("Refer a friend");
  const handleLinkCopy = (e) => {
    const currentLink = window.location.href;

    navigator.clipboard
      .writeText(currentLink)
      .then(() => {
        setButtonText("Copied!");
        setTimeout(() => {
          setButtonText("Refer a friend");
        }, 2000); // Change back to 'Copy link' after 3000 milliseconds (3 seconds)
      })
      .catch((err) => {
        console.error("Unable to copy link to clipboard", err);
      });
  };

  const [activePart, setActivePart] = useState("descri");
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);

  const handleinterest = (e) => {
    setActivePart("form");
  };

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [completePhoneNumber, setCompletePhoneNumber] = useState("");
  const [countryList, setCountryList] = useState([]);
  const [code, setCode] = useState("");
  const [stateList, setStateList] = useState([]);
  const [loading, setLoading] = useState("No");

  //contact form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [dob, setDOB] = useState(null);
  const [yoc, setYoC] = useState("");
  const [aos, setAoS] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [experienceinYears, setExperienceinYears] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [resumeLink, setResumeLink] = useState("");

  //error messages
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [stateError, setStateError] = useState("");
  const [dateError, setDateError] = useState("");
  const [yocError, setYocError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [educationLevelError, setEducationLevelError] = useState("");
  const [experienceinYearsError, setExperienceinYearsError] = useState("");
  const [aosError, setAosError] = useState("");
  const [preferredLocationError, setPreferredLocationError] = useState("");
  const [resumeLinkError, setResumeLinkError] = useState("");

  const handleSelectClick = () => {
    setIsSelectOpen(!isSelectOpen);
  };

  const handleSelectBlur = () => {
    setIsSelectOpen(false);
  };

  useEffect(() => {
    // Extract country data from the countries-list package
    const country = Object.entries(countries).map(([code, details]) => ({
      code,
      name: details.name,
      phone: details.phone,
    }));

    setCountryList(country);
  }, [countries]);

  const handleCountryChange = (e) => {
    const selectedCode = e.target.value;
    setSelectedCountry(selectedCode);

    // Set the initial part of the phone number based on the selected country's code
    const countryCode = countryList.find(
      (country) => country.code === selectedCode
    );
    setPhoneNumber(countryCode ? countryCode.code : "");
  };

  const handlePhoneNumberChange = (e) => {
    // Extract the part of the phone number after the country code
    const enteredPhoneNumber = e.target.value.replace(
      `+${selectedCountry} `,
      ""
    );

    // Update the phone number state with the entered part
    setPhoneNumber(enteredPhoneNumber);
    setCompletePhoneNumber(`+${selectedCountry} ${enteredPhoneNumber}`);
  };

  //validate mail
  const isValidEmail = (email) => {
    // Add your email validation logic here
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  //validate form
  const validateForm = () => {
    let isValid = true;

    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      isValid = false;
    } else {
      setFirstNameError("");
    }

    if (!title.trim()) {
      setTitleError("Please pick a title");
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      isValid = false;
    } else {
      setLastNameError("");
    }

    if (!country.trim()) {
      setCountryError("Country is required");
      isValid = false;
    } else {
      setCountryError("");
    }

    if (!state.trim()) {
      setStateError("State is required");
      isValid = false;
    } else {
      setStateError("");
    }

    if (!dob) {
      setDateError("Date of Birth is required");
      isValid = false;
    } else {
      setDateError("");
    }

    if (!yoc) {
      setYocError("Year of completion is required");
      isValid = false;
    } else {
      setYocError("");
    }

    if (!aos) {
      setAosError("Area of specialization is required");
      isValid = false;
    } else {
      setAosError("");
    }

    if (!experienceinYears) {
      setExperienceinYearsError("Level of Experience is required");
      isValid = false;
    } else {
      setExperienceinYearsError("");
    }

    if (!email.trim() || !isValidEmail(email)) {
      setEmailError("Valid email is required");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!completePhoneNumber.trim()) {
      setPhoneNumberError("Phone number is required");
      isValid = false;
    } else {
      setPhoneNumberError("");
    }

    if (!educationLevel.trim()) {
      setEducationLevelError("Highest level of Education is required");
      isValid = false;
    } else {
      setEducationLevelError("");
    }

    if (!preferredLocation) {
      setPreferredLocationError("Preferred job location is required");
      isValid = false;
    } else {
      setPreferredLocationError("");
    }

    if (!resumeLink) {
      setResumeLinkError("Resume Link is required");
      isValid = false;
    } else {
      setResumeLinkError("");
    }

    return isValid;
  };

  //function to submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading("Yes");

    if (!validateForm()) {
      // Form validation failed
      return;
    }

    // Construct the payload for Formspree
    const payload = {
      name: `${title} ${firstName} ${lastName}`,
      country_state: `${country}, ${state}`,
      number: completePhoneNumber,
      email: email,
      Date_of_Birth: dob,
      Linkedin_Link: linkedin,
      highest_education: educationLevel,
      Year_of_completion: yoc,
      Experience_in_Years: experienceinYears,
      Area_of_Specialization: aos,
      preferredLocation: preferredLocation,
      Resume_Link: resumeLink,
    };

    try {
      // Make a POST request to the Formspree endpoint
      const response = await fetch("https://formspree.io/f/mdorqkbb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Handle successful form submission, e.g., show a success message
        console.log("Form submitted successfully");
        setLoading("No");
        setSuccessMessage(true);
      } else {
        // Handle form submission error
        console.error("Form submission error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setLoading("No");
      setErrorMessage(true);
    }
  };

  useEffect(() => {
    setStateList(State.getStatesOfCountry(code));
  }, [code]);

  return (
    <>
      <Navbar />
      <div className=" mt-[10em] mb-[4em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
        <p className="font-medium text-2xl md:text-[40px] md:leading-[50px] mt-3 md:px-[12%] text-center">
          {selectedCareerItem.title}
        </p>
        {selectedCareerItem.details && (
          <div className=" w-full  items-center flex justify-center ">
            <div className=" flex space-x-8 mt-3 text-[#676767]">
              <p className="">{selectedCareerItem.location}</p>
              <p className="text-center font-medium text-base">
                {"Posted " + selectedCareerItem.date}
              </p>
            </div>
          </div>
        )}
        {activePart === "descri" && (
          <div>
            {selectedCareerItem.details && (
              <div className=" w-full  items-center flex justify-center ">
                <div className=" flex space-x-4 md:space-x-8 mt-6">
                  <button
                    onClick={handleLinkCopy}
                    className=" flex px-4 py-1 md:px-6 md:py-2 border border-[#EAEBF0] rounded-[30px] justify-center items-center"
                  >
                    <p className=" text-sm md:text-base font-medium text-[#121212]">
                      {buttonText}
                    </p>
                  </button>
                  <button
                    onClick={handleinterest}
                    className=" flex px-4 py-1 md:px-6 md:py-2 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[30px] justify-center items-center"
                  >
                    <p className="text-sm md:text-base font-medium text-[#fff]">
                      I am interested
                    </p>
                  </button>
                </div>
              </div>
            )}
            <div className=" mt-16">
              <p className=" text-center font-medium text-xl md:text-2xl">
                Job Description
              </p>
              <p className=" mt-3 text-justify text-[#676767] font-normal text-base">
                {selectedCareerItem.desc}
              </p>
              {selectedCareerItem.details && (
                <div className=" mt-6 flex justify-center md:items-center flex-col">
                  <p className=" text-left md:text-center font-medium text-xl md:text-2xl">
                    Job Information
                  </p>
                  <div className=" flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 mt-6 md:mt-3 text-[#676767]">
                    <span className=" flex flex-row space-x-2 items-center">
                      <img src={time} className="" alt="" />
                      <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">
                        {selectedCareerItem.duration}
                      </p>
                    </span>
                    <span className=" flex flex-row space-x-2 items-center">
                      <img src={dollar} className="" alt="" />
                      <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">
                        {selectedCareerItem.pay}
                      </p>
                    </span>
                    <span className=" flex flex-row space-x-2 selectedCareer items-center">
                      <p className=" font-Outfit text-[#676767]">Location:</p>
                      <p className=" font-Outfit text-[#121212] md:text-base text-sm font-medium">
                        {selectedCareerItem.location}
                      </p>
                    </span>
                  </div>
                </div>
              )}
              <p
                style={{ whiteSpace: "pre-line" }}
                className=" px-4 mt-6 text-base text-[#676767] text- font-normal whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: selectedCareerItem.details }}
              />
            </div>
            {selectedCareerItem.details && (
              <button
                onClick={handleinterest}
                className=" flex px-6 py-2 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[30px] justify-center items-center my-6 "
              >
                <p className=" text-base font-medium text-[#fff]">
                  I am interested
                </p>
              </button>
            )}
          </div>
        )}

        {activePart === "form" && (
          <div>
            <div className=" mt-16">
              <p className=" text-center font-normal text-3xl">Basic Info</p>
              <div className=" w-full flex mt-8 flex-col md:flex-row justify-between md:mb- space-y-3 md:space-y-0">
                <span className="w-full md:w-[48%]">
                  <label
                    className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                    htmlFor="phone"
                  >
                    Phone
                  </label>
                  <div className="mt-2 flex h-[45px] w-full bg-[#F5F5F4] text-base rounded-lg font-normal shadow-md shadow-[#1018280D]">
                    <select
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setTitleError("");
                      }}
                      className={`text-[#1E1E1E33] text-sm w-[20%] p-2.5 bg-transparent focus:border-0 focus:border-[#DAE0E6]${
                        titleError ? "border border-red-500" : ""
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>

                    <input
                      type="text"
                      onInput={(e) => {
                        setLastName(e.target.value);
                        setLastNameError("");
                      }}
                      placeholder="Last Name"
                      className={`w-[80%] p-2.5 bg-transparent text-sm text-[#1E1E1E33] ${
                        lastNameError ? "border border-red-500" : ""
                      }`}
                    />
                  </div>
                  {lastNameError && (
                    <p className="text-red-500 text-sm mt-1">{lastNameError}</p>
                  )}
                </span>

                <span className=" w-full md:w-[48%]">
                  <label
                    className=" font-Outfit text-base text-[#1E1E1EB2] font-medium"
                    for="first-name"
                  >
                    First name
                  </label>
                  <input
                    type="text"
                    id="First Name"
                    onInput={(e) => {
                      setFirstName(e.target.value);
                      setFirstNameError("");
                    }}
                    placeholder="First Name"
                    className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                      firstNameError ? "border border-red-500" : ""
                    }`}
                  />
                  {firstNameError && (
                    <p className="text-red-500 text-sm mt-1">
                      {firstNameError}
                    </p>
                  )}
                </span>
              </div>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  Country of Residence
                </label>

                <select
                  onChange={(e) => {
                    const selectedCountryCode =
                      countryList.find(
                        (country) => country.name === e.target.value
                      )?.code || "";

                    setCountry(e.target.value);
                    setCode(selectedCountryCode);
                    setCountryError("");
                  }}
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-[#1e1e1e33] font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    countryError ? "border border-red-500" : ""
                  }`}
                >
                  <option
                    className="text-[#1e1e1e33] placeholder:text-[#1E1E1E33]"
                    value=""
                  >
                    Select Country
                  </option>
                  {countryList.map((country, index) => (
                    <option key={index} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>

                {countryError && (
                  <p className="text-red-500 text-sm mt-1">{countryError}</p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  State
                </label>

                <select
                  onChange={(e) => {
                    setState(e.target.value);
                  }}
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    stateError ? "border border-red-500" : ""
                  }`}
                >
                  <option
                    className="text-[#1e1e1e33] placeholder:text-[#1E1E1E33]"
                    value=""
                  >
                    Select State
                  </option>
                  {stateList.map((state, index) => (
                    <option key={index} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>

                {stateError && (
                  <p className="text-red-500 text-sm mt-1">{stateError}</p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="Email"
                  onInput={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  placeholder="Enter email address"
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    emailError ? "border border-red-500" : ""
                  }`}
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </span>

              <span className="w-full block mt-3">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="phone"
                >
                  Phone
                </label>
                <div className="mt-2 flex h-[45px] w-full bg-[#F5F5F4] text-base rounded-lg font-normal shadow-md shadow-[#1018280D]">
                  <select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="text-gray-900 placeholder:text-[#1e1e1e33] text-sm w-[20%] p-2.5 bg-transparent focus:border-0 focus:border-[#DAE0E6]"
                  >
                    <option value="">Select Country</option>
                    {countryList.map((country, index) => (
                      <option key={index} value={country.phone}>
                        {country.code + "  " + "+" + country.phone}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={
                      selectedCountry !== ""
                        ? `+${selectedCountry} ${phoneNumber}`
                        : phoneNumber
                    }
                    onChange={(e) => handlePhoneNumberChange(e)}
                    placeholder="Enter your phone number"
                    className={`w-[80%] p-2.5 bg-transparent text-sm text-gray-900 ${
                      phoneNumberError ? "border border-red-500" : ""
                    }`}
                  />
                </div>
                {phoneNumberError && (
                  <p className="text-red-500 text-sm mt-1">
                    {phoneNumberError}
                  </p>
                )}
              </span>

              <span className="w-full mt-3 flex flex-col">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  Date of Birth
                </label>
                <DatePicker
                  selected={dob}
                  onChange={(date) => setDOB(date)}
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    dateError ? "border border-red-500" : ""
                  }`}
                  dateFormat="dd/MM/yyyy" // Customize the date format as needed
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={70}
                />
                {dateError && (
                  <p className="text-red-500 text-sm mt-1">{dateError}</p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="linkedin"
                >
                  Linkedin
                </label>
                <input
                  type="text"
                  id="link"
                  onInput={(e) => {
                    setLinkedin(e.target.value);
                  }}
                  placeholder="Enter Linkedin Link"
                  className=" h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </span>

              <div className=" w-full flex mt-3 md:mt-3 flex-col md:flex-row justify-between md:mb-3 space-y-12 md:space-y-0">
                <div className="relative w-full h-[45px] md:w-[48%]">
                  <label
                    className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                    htmlFor="Highest educationt"
                  >
                    Highest education
                  </label>
                  <select
                    name=""
                    className={`appearance-none text-gray-900 h-[45px] w-full text-sm px-4 py-[10px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] rounded-lg mt-2 ${
                      educationLevelError ? "border border-red-500" : ""
                    }`}
                    id="reasonForContact"
                    onClick={handleSelectClick}
                    onBlur={handleSelectBlur}
                    onChange={(e) => {
                      setEducationLevel(e.target.value);
                      setEducationLevelError("");
                    }}
                  >
                    <option value="None">None</option>
                    <option value="BSc">BSc</option>
                    <option value="BTech">BTech</option>
                    <option value="BEng">BEng</option>
                    <option value="Phd">Phd</option>
                    <option value="MSc">MSc</option>
                    <option value="MBA">MBA</option>
                    <option value="BEd">BEd</option>
                    <option value="MA">MA</option>
                    <option value="MEng">MEng</option>
                    <option value="LLM">LLM</option>
                    <option value="Other">Other</option>
                  </select>
                  <img
                    src={arrow}
                    className={`absolute right-3 md:right-6 top-[100%] transition-transform ${
                      isSelectOpen ? "rotate-180" : "rotate-0"
                    }`}
                    alt=""
                  />
                  {educationLevelError && (
                    <p className="text-red-500 mb-8 md:mb-0 text-sm mt-1">
                      {educationLevelError}
                    </p>
                  )}
                </div>

                <span className="w-full md:w-[48%]">
                  <label
                    className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                    htmlFor="Year of completion of Highest education"
                  >
                    Year of completion of Highest education
                  </label>
                  <input
                    type="text"
                    onInput={(e) => {
                      setYoC(e.target.value);
                      setYocError("");
                    }}
                    placeholder="Enter Year"
                    className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                      yocError ? "border border-red-500" : ""
                    }`}
                  />
                  {yocError && (
                    <p className="text-red-500 text-sm mt-1">{yocError}</p>
                  )}
                </span>
              </div>

              <span className="w-full block mt-3 md:mt-0 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  Experience in Years
                </label>
                <input
                  type="text"
                  onInput={(e) => {
                    setExperienceinYears(e.target.value);
                    setExperienceinYearsError("");
                  }}
                  placeholder=""
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    experienceinYearsError ? "border border-red-500" : ""
                  }`}
                />
                {experienceinYearsError && (
                  <p className="text-red-500 text-sm mt-1">
                    {experienceinYearsError}
                  </p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  Area of specialization
                </label>
                <input
                  type="text"
                  id=""
                  onInput={(e) => {
                    setAoS(e.target.value);
                    setAosError("");
                  }}
                  placeholder="Enter area of specialization"
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    aosError ? "border border-red-500" : ""
                  }`}
                />
                {aosError && (
                  <p className="text-red-500 text-sm mt-1">{aosError}</p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  Preferred job location
                </label>

                <select
                  onChange={(e) => {
                    setPreferredLocation(e.target.value);
                    setPreferredLocationError("");
                  }}
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    preferredLocationError ? "border border-red-500" : ""
                  }`}
                >
                  <option
                    className="text-[#1e1e1e33] placeholder:text-[#1E1E1E33]"
                    value=""
                  >
                    Select
                  </option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Liberia">Liberia</option>
                </select>

                {preferredLocationError && (
                  <p className="text-red-500 text-sm mt-1">
                    {preferredLocationError}
                  </p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="email"
                >
                  Link to Resume
                </label>
                <input
                  type="text"
                  id=""
                  onInput={(e) => {
                    setResumeLink(e.target.value);
                    setResumeLinkError("");
                  }}
                  placeholder="Please Provide link to resume"
                  className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    resumeLinkError ? "border border-red-500" : ""
                  }`}
                />
                {resumeLinkError && (
                  <p className="text-red-500 text-sm mt-1">{resumeLinkError}</p>
                )}
              </span>

              <button
                onClick={handleSubmit}
                className=" w-full flex h-[45px] mt-6 rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center items-center"
              >
                {loading === "No" && (
                  <p className=" font-Outfit text-base text-white">
                    Submit Application
                  </p>
                )}
                {loading === "Yes" && (
                  <img src={load} className=" w-6 h-6" alt="" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      {successMessage && (
        <div className=" w-full h-[100vh] fixed top-0 left-0 bg-[#00000057] flex justify-center items-center z-[99999] px-5 md:px-0">
          <div className="w-full md:w-[450px] rounded-[30px] h-[250px] flex flex-col justify-center items-center bg-[#f5f5f4] relative">
            <img src={checked} className=" w-[64px]" alt="" />
            <p className=" text-2xl font-medium font-Outfit text-[#121212] mt-3">
              Thank You
            </p>
            <p className=" text-base font-normal font-Outfit">
              Your Application has been submitted
            </p>
            <button
              onClick={() => {
                setSuccessMessage(false);
              }}
              className=" bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] mt-6 hover:bg-opacity-75 px-3 py-1 rounded-md text-white text-sm font-Outfit"
            >
              Okay!
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className=" w-full h-[100vh] fixed top-0 left-0 bg-[#00000057] flex justify-center items-center z-[99999] px-5 md:px-0">
          <div className="w-full md:w-[450px] rounded-[30px] h-[300px] flex text-center flex-col justify-center items-center bg-[#f5f5f4] relative">
            <img src={warning} className=" w-[64px]" alt="" />
            <p className=" text-xl font-medium font-Outfit text-[#121212] mt-3">
              There was an error submitting your application.
            </p>
            <p className=" text-base font-normal font-Outfit">
              Please try again later
            </p>
            <button
              onClick={() => {
                setErrorMessage(false);
              }}
              className=" bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] mt-6 hover:bg-opacity-75 px-3 py-1 rounded-md text-white text-sm font-Outfit"
            >
              Okay!
            </button>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default DetailedCareer;
