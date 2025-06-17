import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import sideBg from "./assets/sideBg.svg";
import logo from "./assets/logo.png";
import VerificationCodeInput from "../../utils/codeInput";

export default function VerifyMail() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center  py bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <img src={logo} className=" w-[100px]" alt="" />
            </div>
          </div>

          {/* Welcome Title */}
          <div className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">
              Verify Account
            </h1>
            <p className="text-[#676767] text-sm">
              An authentication code has been sent to your{" "}
              <span className=" underline underline-offset-1">
                myemail@gmail.com
              </span>{" "}
              and{" "}
              <span className=" underline underline-offset-1">
                +2348111222345
              </span>
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-5">
            <VerificationCodeInput />

            {/* Login Button */}
            <button
              onClick={() => console.log("Login clicked")}
              className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div
        style={{
          backgroundImage: `url(${sideBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="flex-1 side-bg flex items-center justify-center relative overflow-hidden"
      ></div>
    </div>
  );
}
