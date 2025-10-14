import Ads from "../components/ad";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { motion } from "framer-motion";
import office from "./assets/office.svg";
import chat from "./assets/chat.svg";
import text from "./assets/message.svg";
import x from "./assets/twitter.png";
import linked from "./assets/linkedin.svg";
import instagram from "./assets/instagram.png";
import arrow from "./assets/arrow-down.svg";
import { useState, useEffect, useContext } from "react";
import { countries } from "countries-list";
import load from "./assets/load.gif";
import checked from "./assets/checked.png";
import warning from "./assets/warning.png";
import { GeneralContext } from "../contexts/contextprovider";

const Contact = () => {
  const [generalitem, setGeneralItem] = useContext(GeneralContext);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [completePhoneNumber, setCompletePhoneNumber] = useState("");
  const [countryList, setCountryList] = useState([]);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  const [loading, setLoading] = useState("No");

  //contact form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [agreeToPrivacyPolicy, setAgreeToPrivacyPolicy] = useState(false);
  const [reasonForContact, setReasonForContact] = useState("");

  //error messages
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [reasonForContactError, setReasonForContactError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [privacyPolicyError, setPrivacyPolicyError] = useState("");

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

  // privacy policy
  const handleCheckboxChange = (event) => {
    setAgreeToPrivacyPolicy(event.target.checked);
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

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      isValid = false;
    } else {
      setLastNameError("");
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

    if (!reasonForContact.trim()) {
      setReasonForContactError("Reason for contact is required");
      isValid = false;
    } else {
      setReasonForContactError("");
    }

    if (!message.trim()) {
      setMessageError("Message is required");
      isValid = false;
    } else {
      setMessageError("");
    }

    // Validate the privacy policy checkbox
    if (!agreeToPrivacyPolicy) {
      setPrivacyPolicyError("You must agree to the privacy policy");
      isValid = false;
    } else {
      setPrivacyPolicyError("");
    }

    return isValid;
  };

  //function to submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Form validation failed
      return;
    }

    // Construct the payload for Formspree
    const payload = {
      Topic: reasonForContact,
      name: `${firstName} ${lastName}`,
      number: completePhoneNumber,
      email,
      message,
    };

    try {
      // Make a POST request to the Formspree endpoint
      const response = await fetch("https://formspree.io/f/xeqbbwqy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Handle successful form submission, e.g., show a success message
        console.log("Form submitted successfully");
        setSuccessMessage(true);
      } else {
        // Handle form submission error
        console.error("Form submission error");
        setErrorMessage(true);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <>
      <Navbar />
      <motion.div>
        <div className=" mt-[10em] px-4 md:px-8 lg:px-16 font-Outfit w-full text-[#121212]">
          <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
            Contact us
          </p>
          <p className=" text-center font-normal mt-3 text-[#000000CC] md:px-[10%] text-lg md:text-xl ">
            Ready to transform your business in the cloud? Contact UniCloud
            Africa now for secure, scalable, and reliable solutions. Let's shape
            your digital future together!
          </p>

          <motion.div className=" my-8 w-full">
            <div className=" w-full p-3 mt-16 md:p-8 border rounded-[30px] border-[#DAE0E6]">
              <p className=" font-medium text-xl md:text-3xl">
                Have a question, need support, or want to chat?
              </p>
              <p className=" font-normal mt-3 text-base md:text-lg text-[#1E1E1ECC] ">
                Our team would love to hear from you.
              </p>

              <div className=" w-full flex mt-8 flex-col md:flex-row justify-between md:mb- space-y-3 md:space-y-0">
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

                <span className="w-full md:w-[48%]">
                  <label
                    className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                    htmlFor="last-name"
                  >
                    Last name
                  </label>
                  <input
                    type="text"
                    id="Last Name"
                    onInput={(e) => {
                      setLastName(e.target.value);
                      setLastNameError("");
                    }}
                    placeholder="Last Name"
                    className={`h-[45px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] mt-2 text-gray-900 font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                      lastNameError ? "border border-red-500" : ""
                    }`}
                  />
                  {lastNameError && (
                    <p className="text-red-500 text-sm mt-1">{lastNameError}</p>
                  )}
                </span>
              </div>

              <div className=" w-full flex mt-3 md:mt-3 flex-col md:flex-row justify-between md:mb-3 space-y-12 md:space-y-0">
                <div className="relative w-full h-[45px] md:w-[48%]">
                  <label
                    className="font-Outfit text-base text-[#1E1E1EB2] font-medium"
                    htmlFor="reason-for-contact"
                  >
                    Reason of contact
                  </label>
                  <select
                    name=""
                    className={`appearance-none text-[#1E1E1E33] h-[45px] w-full text-sm px-4 py-[10px] bg-[#F5F5F4] shadow-md shadow-[#1018280D] rounded-lg mt-2 ${
                      reasonForContactError ? "border border-red-500" : ""
                    }`}
                    id="reasonForContact"
                    onClick={handleSelectClick}
                    onBlur={handleSelectBlur}
                    onChange={(e) => {
                      setReasonForContact(e.target.value);
                      setReasonForContactError("");
                    }}
                  >
                    <option value="">Please select a reason</option>
                    <option value="Inquiry">Inquiry</option>
                    <option value="Business">Business</option>
                    <option value="Partnerships">Partnerships</option>
                    <option value="Employment">Employment</option>
                    <option value="Infrastructure Deployment">
                      Infrastructure Deployment
                    </option>
                  </select>
                  <img
                    src={arrow}
                    className={`absolute right-3 md:right-6 top-[100%] transition-transform ${
                      isSelectOpen ? "rotate-180" : "rotate-0"
                    }`}
                    alt=""
                  />
                  {reasonForContactError && (
                    <p className="text-red-500 mb-8 md:mb-0 text-sm mt-1">
                      {reasonForContactError}
                    </p>
                  )}
                </div>

                <span className="w-full md:w-[48%]">
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
                      className="text-[#1E1E1E33] text-sm w-[20%] p-2.5 bg-transparent focus:border-0 focus:border-[#DAE0E6]"
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
                      className={`w-[80%] p-2.5 bg-transparent text-sm text-[#1E1E1E33] ${
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
              </div>

              <span className="w-full block mt-3 md:mt-0 ">
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

              <div className=" block mt-3">
                <label
                  className="font-Outfit md:mt-3 text-base text-[#1E1E1EB2] font-medium"
                  htmlFor="Message"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  onInput={(e) => {
                    setMessage(e.target.value);
                    setMessageError("");
                  }}
                  placeholder=""
                  className={`mb-4 bg-[#F5F5F4] shadow-md mt-2 shadow-[#1018280D] font-Outfit font-normal placeholder:font-Outfit placeholder:text-[#1E1E1E33] text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${
                    messageError ? "border-red-500 border" : ""
                  }`}
                ></textarea>
                {messageError && (
                  <p className="text-red-500 text-sm ">{messageError}</p>
                )}
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className={`form-checkbox h-5 w-5 text-blue-600 ${
                    privacyPolicyError ? "border border-red-500" : ""
                  }`}
                  onChange={handleCheckboxChange}
                  checked={agreeToPrivacyPolicy}
                />
                <span className="ml-2 text-base text-[#1E1E1E99] font-Outfit font-medium">
                  Click here to accept our{" "}
                  <a href="/terms" className=" underline underline-offset-2">
                    privacy policy
                  </a>
                </span>
              </label>
              {privacyPolicyError && (
                <p className="text-red-500 text-sm mt-1">
                  {privacyPolicyError}
                </p>
              )}

              <button
                onClick={handleSubmit}
                className=" w-full flex h-[45px] mt-6 rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] hover:bg-opacity-75 transition-all justify-center items-center"
              >
                {loading === "No" && (
                  <p className=" font-Outfit text-base text-white">
                    Send Message
                  </p>
                )}
                {loading === "Yes" && (
                  <img src={load} className=" w-6 h-6" alt="" />
                )}
              </button>
            </div>
          </motion.div>

          <div className=" w-full p-5 mt-16 md:p-8 border rounded-[30px] border-[#DAE0E6] flex flex-col lg:flex-row justify-center md:justify-between items-start space-y-6 lg:space-y-0">
            <div className=" space-y-2 w-full lg:w-1/3">
              <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                <img src={office} alt="" />
              </button>
              <div className=" space-y-2">
                <p className=" font-medium text-xl">Nigeria Office</p>
                <p className=" text-sm lg:pr-10 text-[#676767]">
                  {generalitem.address}
                </p>
              </div>

              <div className=" space-y-2">
                <p className=" font-medium text-xl">South Africa Office</p>
                <p className=" text-sm lg:pr-10 text-[#676767]">
                  78, Corltte Drive, Melrose Arch North, Johannesburg 2196,
                  South Africa.
                </p>
              </div>

              <div className=" space-y-2">
                <p className=" font-medium text-xl">Kenyan Office</p>
                <p className=" text-sm lg:pr-10 text-[#676767]">
                  P.O.Box 39562-00623, Parklands, Nairobi, Kenya
                </p>
              </div>
            </div>

            <div className=" space-y-2 w-full lg:w-1/3">
              <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                <img src={chat} alt="" />
              </button>
              <p className=" font-medium text-xl"> Contact us on</p>
              <p className=" text-sm">
                {" "}
                <span className=" block gradient-text">
                  {generalitem.email}
                </span>
              </p>
              <p className=" text-sm">
                {" "}
                <span className=" block gradient-text underline">
                  +2348028431253
                </span>
              </p>
              <p className=" text-sm">
                {" "}
                <span className=" block gradient-text underline">
                  +2348060040620
                </span>
              </p>
            </div>

            <div className=" space-y-2 w-full lg:w-1/3">
              <button className=" w-12 h-12 bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] rounded-[50%] flex justify-center items-center">
                <img src={text} alt="" />
              </button>
              {/* <p className=" font-medium text-xl">
                Connect with us on social media
              </p> */}
              <span className=" flex space-x-6 mt-2">
                <a href={generalitem.fb}>
                  <img src={x} className=" w-6" alt="" />
                </a>
                <a href={generalitem.linkedin}>
                  <img src={linked} className=" w-6" alt="" />
                </a>
                <a href={generalitem.twitter}>
                  <img src={instagram} className=" w-6" alt="" />
                </a>
              </span>
            </div>
          </div>
        </div>
        <Ads />
        {successMessage && (
          <div className=" w-full h-[100vh] fixed top-0 left-0 bg-[#00000057] flex justify-center items-center z-[99999] px-5 md:px-0">
            <div className="w-full md:w-[450px] rounded-[30px] h-[250px] flex flex-col justify-center items-center bg-[#f5f5f4] relative">
              <img src={checked} className=" w-[64px]" alt="" />
              <p className=" text-2xl font-medium font-Outfit text-[#121212] mt-3">
                Thank You
              </p>
              <p className=" text-base font-normal font-Outfit">
                Your Message has been submitted
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
                There was an error submitting your Message.
              </p>
              <p className=" text-base font-normal font-Outfit">
                Please try again
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
      </motion.div>
    </>
  );
};

export default Contact;
