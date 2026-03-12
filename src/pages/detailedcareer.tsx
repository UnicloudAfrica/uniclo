import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import arrow from "./assets/arrow-down.svg";
import { getDoc, doc } from "firebase/firestore";
import { getFirestoreDb } from "../shared/config/firebase";
import time from "./assets/time.svg";
import dollar from "./assets/dollar.svg";
import { countries } from "countries-list";
import { State } from "country-state-city";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import load from "./assets/load.gif";
import checked from "./assets/checked.png";
import warning from "./assets/warning.png";
import DOMPurify from "dompurify";
import { CareerContext } from "../contexts/contextprovider";
import logger from "../utils/logger";

interface CareerItem {
  title: string;
  pay: string;
  date: string;
  duration: string;
  desc: string;
  details: string;
  location: string;
  id: string;
}

interface CountryData {
  code: string;
  name: string;
  phone: string;
}

interface StateData {
  name: string;
  isoCode: string;
  countryCode: string;
  latitude?: string | null;
  longitude?: string | null;
}

const DetailedCareer = () => {
  const [careerArray] = useContext(CareerContext);

  const emptyCareer: CareerItem = {
    title: "",
    pay: "",
    date: "",
    duration: "",
    desc: "",
    details: "",
    location: "",
    id: "",
  };
  const [selectedCareerItem, setSelectedCareerItem] = useState<CareerItem>(emptyCareer);

  const { id } = useParams<{ id: string }>();

  const selectedFromContext = useMemo(() => {
    if (!id || !careerArray.length) return null;
    return (careerArray as unknown as CareerItem[]).find((item) => item.id === id) || null;
  }, [id, careerArray]);

  const resolvedCareer = selectedFromContext || selectedCareerItem;

  const db = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getFirestoreDb();
  }, []);

  useEffect(() => {
    if (selectedFromContext) {
      setSelectedCareerItem(selectedFromContext);
    }
  }, [selectedFromContext]);

  useEffect(() => {
    if (!id || !db || careerArray.length) return;
    const docRef = doc(db, "career", id);
    getDoc(docRef)
      .then((doc) => {
        if (doc.exists()) {
          const career = { id: doc.id, ...(doc.data() as Omit<CareerItem, "id">) };
          setSelectedCareerItem(career);
        } else {
          logger.log("Document does not exist");
        }
      })
      .catch((error) => {
        logger.error("Error getting document:", error);
      });
  }, [id, db, careerArray.length]);

  //func to copy link
  const [buttonText, setButtonText] = useState("Refer a friend");
  const handleLinkCopy = () => {
    const currentLink = globalThis.window.location.href;

    navigator.clipboard
      .writeText(currentLink)
      .then(() => {
        setButtonText("Copied!");
        setTimeout(() => {
          setButtonText("Refer a friend");
        }, 2000);
      })
      .catch((err) => {
        logger.error("Unable to copy link to clipboard", err);
      });
  };

  const [activePart, setActivePart] = useState("descri");
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);

  const handleinterest = () => {
    setActivePart("form");
  };

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [completePhoneNumber, setCompletePhoneNumber] = useState("");
  const [countryList, setCountryList] = useState<CountryData[]>([]);
  const [code, setCode] = useState("");
  const [stateList, setStateList] = useState<StateData[]>([]);
  const [loading, setLoading] = useState("No");

  //contact form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [dob, setDOB] = useState<Date | null>(null);
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
    const country = Object.entries(countries).map(([cd, details]) => ({
      code: cd,
      name: details.name,
      phone: Array.isArray(details.phone) ? details.phone.join(", ") : String(details.phone),
    }));

    setCountryList(country);
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setSelectedCountry(selectedCode);

    // Set the initial part of the phone number based on the selected country's code
    const countryData = countryList.find((c) => c.phone === selectedCode);
    setPhoneNumber(countryData ? countryData.code : "");
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract the part of the phone number after the country code
    const enteredPhoneNumber = e.target.value.replace(`+${selectedCountry} `, "");

    // Update the phone number state with the entered part
    setPhoneNumber(enteredPhoneNumber);
    setCompletePhoneNumber(`+${selectedCountry} ${enteredPhoneNumber}`);
  };

  //validate mail
  const isValidEmail = (emailStr: string) => {
    // Add your email validation logic here
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
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
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading("Yes");

    if (!validateForm()) {
      // Form validation failed
      setLoading("No");
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
        logger.log("Form submitted successfully");
        setLoading("No");
        setSuccessMessage(true);
      } else {
        // Handle form submission error
        logger.error("Form submission error");
        setLoading("No");
      }
    } catch (error) {
      logger.error("Error submitting form:", error);
      setLoading("No");
      setErrorMessage(true);
    }
  };

  useEffect(() => {
    if (code) {
      setStateList(State.getStatesOfCountry(code));
    }
  }, [code]);

  return (
    <>
      <Navbar />
      <div className=" mt-[10em] mb-[4em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[var(--theme-heading-color)]">
        <p className="font-medium text-2xl md:text-[40px] md:leading-[50px] mt-3 md:px-[12%] text-center">
          {resolvedCareer.title}
        </p>
        {resolvedCareer.details && (
          <div className=" w-full  items-center flex justify-center ">
            <div className=" flex space-x-8 mt-3 text-[var(--theme-text-color)]">
              <p className="">{resolvedCareer.location}</p>
              <p className="text-center font-medium text-base">{"Posted " + resolvedCareer.date}</p>
            </div>
          </div>
        )}
        {activePart === "descri" && (
          <div>
            {resolvedCareer.details && (
              <div className=" w-full  items-center flex justify-center ">
                <div className=" flex space-x-4 md:space-x-8 mt-6">
                  <button
                    onClick={handleLinkCopy}
                    className=" flex px-4 py-1 md:px-6 md:py-2 border border-[var(--theme-surface-alt)] rounded-[30px] justify-center items-center"
                  >
                    <p className=" text-sm md:text-base font-medium text-[var(--theme-heading-color)]">
                      {buttonText}
                    </p>
                  </button>
                  <button
                    onClick={handleinterest}
                    className=" flex px-4 py-1 md:px-6 md:py-2 bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] rounded-[30px] justify-center items-center"
                  >
                    <p className="text-sm md:text-base font-medium text-[var(--theme-card-bg)]">
                      I am interested
                    </p>
                  </button>
                </div>
              </div>
            )}
            <div className=" mt-16">
              <p className=" text-center font-medium text-xl md:text-2xl">Job Description</p>
              <p className=" mt-3 text-justify text-[var(--theme-text-color)] font-normal text-base">
                {resolvedCareer.desc}
              </p>
              {resolvedCareer.details && (
                <div className=" mt-6 flex justify-center md:items-center flex-col">
                  <p className=" text-left md:text-center font-medium text-xl md:text-2xl">
                    Job Information
                  </p>
                  <div className=" flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 mt-6 md:mt-3 text-[var(--theme-text-color)]">
                    <span className=" flex flex-row space-x-2 items-center">
                      <img src={time} className="" alt="" />
                      <p className=" font-Outfit text-[var(--theme-heading-color)] md:text-base text-sm font-medium">
                        {resolvedCareer.duration}
                      </p>
                    </span>
                    <span className=" flex flex-row space-x-2 items-center">
                      <img src={dollar} className="" alt="" />
                      <p className=" font-Outfit text-[var(--theme-heading-color)] md:text-base text-sm font-medium">
                        {resolvedCareer.pay}
                      </p>
                    </span>
                    <span className=" flex flex-row space-x-2 selectedCareer items-center">
                      <p className=" font-Outfit text-[var(--theme-text-color)]">Location:</p>
                      <p className=" font-Outfit text-[var(--theme-heading-color)] md:text-base text-sm font-medium">
                        {resolvedCareer.location}
                      </p>
                    </span>
                  </div>
                </div>
              )}
              <p
                style={{ whiteSpace: "pre-line" }}
                className=" px-4 mt-6 text-base text-[var(--theme-text-color)] text- font-normal whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resolvedCareer.details) }}
              />
            </div>
            {resolvedCareer.details && (
              <button
                onClick={handleinterest}
                className=" flex px-6 py-2 bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] rounded-[30px] justify-center items-center my-6 "
              >
                <p className=" text-base font-medium text-[var(--theme-card-bg)]">
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
                    className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                    htmlFor="phone"
                  >
                    Phone
                  </label>
                  <div className="mt-2 flex h-[45px] w-full bg-[var(--theme-surface-alt)] text-base rounded-lg font-normal shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)]">
                    <select
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setTitle(e.target.value);
                        setTitleError("");
                      }}
                      className={`text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm w-[20%] p-2.5 bg-transparent focus:border-0 focus:border-[var(--border-default)]${
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLastName(e.target.value);
                        setLastNameError("");
                      }}
                      placeholder="Last Name"
                      className={`w-[80%] p-2.5 bg-transparent text-sm text-[rgb(var(--theme-neutral-900) / 0.2)] ${
                        lastNameError ? "border border-red-500" : ""
                      }`}
                    />
                  </div>
                  {lastNameError && <p className="text-red-500 text-sm mt-1">{lastNameError}</p>}
                </span>

                <span className=" w-full md:w-[48%]">
                  <label
                    className=" font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                    htmlFor="first-name"
                  >
                    First name
                  </label>
                  <input
                    type="text"
                    id="First Name"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFirstName(e.target.value);
                      setFirstNameError("");
                    }}
                    placeholder="First Name"
                    className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                      firstNameError ? "border border-red-500" : ""
                    }`}
                  />
                  {firstNameError && <p className="text-red-500 text-sm mt-1">{firstNameError}</p>}
                </span>
              </div>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="country-of-residence"
                >
                  Country of Residence
                </label>

                <select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const selectedCountryCode =
                      countryList.find((country) => country.name === e.target.value)?.code || "";

                    setCountry(e.target.value);
                    setCode(selectedCountryCode);
                    setCountryError("");
                  }}
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-[rgb(var(--theme-neutral-900) / 0.2)] font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    countryError ? "border border-red-500" : ""
                  }`}
                >
                  <option
                    className="text-[rgb(var(--theme-neutral-900) / 0.2)] placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)]"
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

                {countryError && <p className="text-red-500 text-sm mt-1">{countryError}</p>}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="state"
                >
                  State
                </label>

                <select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setState(e.target.value);
                  }}
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    stateError ? "border border-red-500" : ""
                  }`}
                >
                  <option
                    className="text-[rgb(var(--theme-neutral-900) / 0.2)] placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)]"
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

                {stateError && <p className="text-red-500 text-sm mt-1">{stateError}</p>}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="Email"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  placeholder="Enter email address"
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    emailError ? "border border-red-500" : ""
                  }`}
                />
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
              </span>

              <span className="w-full block mt-3">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="phone"
                >
                  Phone
                </label>
                <div className="mt-2 flex h-[45px] w-full bg-[var(--theme-surface-alt)] text-base rounded-lg font-normal shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)]">
                  <select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="text-gray-900 placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm w-[20%] p-2.5 bg-transparent focus:border-0 focus:border-[var(--border-default)]"
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
                      selectedCountry !== "" ? `+${selectedCountry} ${phoneNumber}` : phoneNumber
                    }
                    onChange={(e) => handlePhoneNumberChange(e)}
                    placeholder="Enter your phone number"
                    className={`w-[80%] p-2.5 bg-transparent text-sm text-gray-900 ${
                      phoneNumberError ? "border border-red-500" : ""
                    }`}
                  />
                </div>
                {phoneNumberError && (
                  <p className="text-red-500 text-sm mt-1">{phoneNumberError}</p>
                )}
              </span>

              <span className="w-full mt-3 flex flex-col">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="date-of-birth"
                >
                  Date of Birth
                </label>
                <DatePicker
                  selected={dob}
                  onChange={(date: Date | null) => setDOB(date)}
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    dateError ? "border border-red-500" : ""
                  }`}
                  dateFormat="dd/MM/yyyy" // Customize the date format as needed
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={70}
                />
                {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="linkedin"
                >
                  Linkedin
                </label>
                <input
                  type="text"
                  id="link"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setLinkedin(e.target.value);
                  }}
                  placeholder="Enter Linkedin Link"
                  className=" h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </span>

              <div className=" w-full flex mt-3 md:mt-3 flex-col md:flex-row justify-between md:mb-3 space-y-12 md:space-y-0">
                <div className="relative w-full h-[45px] md:w-[48%]">
                  <label
                    className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                    htmlFor="highest-education"
                  >
                    Highest education
                  </label>
                  <select
                    name=""
                    className={`appearance-none text-gray-900 h-[45px] w-full text-sm px-4 py-[10px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] rounded-lg mt-2 ${
                      educationLevelError ? "border border-red-500" : ""
                    }`}
                    id="reasonForContact"
                    onClick={handleSelectClick}
                    onBlur={handleSelectBlur}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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
                    <p className="text-red-500 mb-8 md:mb-0 text-sm mt-1">{educationLevelError}</p>
                  )}
                </div>

                <span className="w-full md:w-[48%]">
                  <label
                    className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                    htmlFor="year-of-completion"
                  >
                    Year of completion of Highest education
                  </label>
                  <input
                    type="text"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setYoC(e.target.value);
                      setYocError("");
                    }}
                    placeholder="Enter Year"
                    className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                      yocError ? "border border-red-500" : ""
                    }`}
                  />
                  {yocError && <p className="text-red-500 text-sm mt-1">{yocError}</p>}
                </span>
              </div>

              <span className="w-full block mt-3 md:mt-0 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="experience-in-years"
                >
                  Experience in Years
                </label>
                <input
                  type="text"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setExperienceinYears(e.target.value);
                    setExperienceinYearsError("");
                  }}
                  placeholder=""
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    experienceinYearsError ? "border border-red-500" : ""
                  }`}
                />
                {experienceinYearsError && (
                  <p className="text-red-500 text-sm mt-1">{experienceinYearsError}</p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="area-of-specialization"
                >
                  Area of specialization
                </label>
                <input
                  type="text"
                  id=""
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAoS(e.target.value);
                    setAosError("");
                  }}
                  placeholder="Enter area of specialization"
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    aosError ? "border border-red-500" : ""
                  }`}
                />
                {aosError && <p className="text-red-500 text-sm mt-1">{aosError}</p>}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="preferred-job-location"
                >
                  Preferred job location
                </label>

                <select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setPreferredLocation(e.target.value);
                    setPreferredLocationError("");
                  }}
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    preferredLocationError ? "border border-red-500" : ""
                  }`}
                >
                  <option
                    className="text-[rgb(var(--theme-neutral-900) / 0.2)] placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)]"
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
                  <p className="text-red-500 text-sm mt-1">{preferredLocationError}</p>
                )}
              </span>

              <span className="w-full block mt-3 ">
                <label
                  className="font-Outfit text-base text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium"
                  htmlFor="resume-link"
                >
                  Link to Resume
                </label>
                <input
                  type="text"
                  id=""
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setResumeLink(e.target.value);
                    setResumeLinkError("");
                  }}
                  placeholder="Please Provide link to resume"
                  className={`h-[45px] bg-[var(--theme-surface-alt)] shadow-md shadow-[rgb(var(--theme-neutral-900) / 0.05)] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[rgb(var(--theme-neutral-900) / 0.2)] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    resumeLinkError ? "border border-red-500" : ""
                  }`}
                />
                {resumeLinkError && <p className="text-red-500 text-sm mt-1">{resumeLinkError}</p>}
              </span>

              <button
                onClick={handleSubmit}
                className=" w-full flex h-[45px] mt-6 rounded-[30px] bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] hover:bg-opacity-75 transition-all justify-center items-center"
              >
                {loading === "No" && (
                  <p className=" font-Outfit text-base text-white">Submit Application</p>
                )}
                {loading === "Yes" && <img src={load} className=" w-6 h-6" alt="" />}
              </button>
            </div>
          </div>
        )}
      </div>
      {successMessage && (
        <div className=" w-full h-[100vh] fixed top-0 left-0 bg-[rgb(var(--theme-neutral-900) / 0.34)] flex justify-center items-center z-[99999] px-5 md:px-0">
          <div className="w-full md:w-[450px] rounded-[30px] h-[250px] flex flex-col justify-center items-center bg-[var(--theme-surface-alt)] relative">
            <img src={checked} className=" w-[64px]" alt="" />
            <p className=" text-2xl font-medium font-Outfit text-[var(--theme-heading-color)] mt-3">
              Thank You
            </p>
            <p className=" text-base font-normal font-Outfit">
              Your Application has been submitted
            </p>
            <button
              onClick={() => {
                setSuccessMessage(false);
              }}
              className=" bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] mt-6 hover:bg-opacity-75 px-3 py-1 rounded-md text-white text-sm font-Outfit"
            >
              Okay!
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className=" w-full h-[100vh] fixed top-0 left-0 bg-[rgb(var(--theme-neutral-900) / 0.34)] flex justify-center items-center z-[99999] px-5 md:px-0">
          <div className="w-full md:w-[450px] rounded-[30px] h-[300px] flex text-center flex-col justify-center items-center bg-[var(--theme-surface-alt)] relative">
            <img src={warning} className=" w-[64px]" alt="" />
            <p className=" text-xl font-medium font-Outfit text-[var(--theme-heading-color)] mt-3">
              There was an error submitting your application.
            </p>
            <p className=" text-base font-normal font-Outfit">Please try again later</p>
            <button
              onClick={() => {
                setErrorMessage(false);
              }}
              className=" bg-gradient-to-r from-[rgb(var(--theme-color-rgb)/0.8)] via-[rgb(var(--secondary-color-rgb)/0.8)] to-[rgb(var(--secondary-color-rgb)/0.8)] mt-6 hover:bg-opacity-75 px-3 py-1 rounded-md text-white text-sm font-Outfit"
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
