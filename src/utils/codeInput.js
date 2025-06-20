import { useState, useRef, useEffect } from "react";

export default function VerificationCodeInput({
  length = 4,
  onComplete = () => {},
  onResend = () => {},
}) {
  const [code, setCode] = useState(new Array(length).fill(""));
  const [timeLeft, setTimeLeft] = useState(50);
  const [isActive, setIsActive] = useState(true);
  const inputRefs = useRef([]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setCode([...code.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        // Focus previous input if current is empty
        inputRefs.current[index - 1].focus();
      }
      // Clear current input
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const pasteCode = pasteData.slice(0, length).split("");

    if (pasteCode.every((char) => !isNaN(char))) {
      setCode([...pasteCode, ...new Array(length - pasteCode.length).fill("")]);
      // Focus the next empty input or last input
      const nextIndex = Math.min(pasteCode.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleResend = () => {
    if (timeLeft === 0) {
      setTimeLeft(50);
      setIsActive(true);
      onResend();
    }
  };

  // Check if code is complete
  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      onComplete(code.join(""));
    }
  }, [code, onComplete]);

  return (
    <div className="flex flex-col items-center space-y-6 p-4 font-Outfit">
      {/* Code Input Fields */}
      <div className="flex space-x-3 sm:space-x-4">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            className="w-12 h-16 sm:w-12 sm:h-16 md:w-12 md:h-16 text-center text-2xl sm:text-3xl font-semibold border border-[#D9D9D9] rounded-xl focus:border-[#288DD1] focus:outline-none focus:ring-1 focus:ring-[#288DD1]  transition-all duration-200 bg-white"
          />
        ))}
      </div>

      {/* Resend Section */}
      <div className="text-center">
        <span className="text-[#676767] text-xs sm:text-sm">
          Code Sent.{" "}
          <button
            onClick={handleResend}
            disabled={timeLeft > 0}
            className={`font-medium transition-colors duration-200 ${
              timeLeft > 0
                ? "text-[#676767] cursor-not-allowed"
                : "text-[#288DD1] hover:text-[#6db1df] cursor-pointer underline"
            }`}
          >
            Resend Code
          </button>
          {timeLeft > 0 && (
            <span className="text-[#288DD1]"> in {formatTime(timeLeft)}</span>
          )}
        </span>
      </div>
    </div>
  );
}
