import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useResendOTP } from "../hooks/authHooks";

export default function VerificationCodeInput({
  length = 6,
  code: initialCode,
  onCodeChange = () => {},
  onComplete = () => {},
  onResend = () => {},
  userEmail,
}) {
  const [code, setCode] = useState(initialCode || new Array(length).fill(""));
  const [timeLeft, setTimeLeft] = useState(0); // Start with 0, set to 50 on success
  const [isActive, setIsActive] = useState(false); // Start inactive, activate on success
  const inputRefs = useRef([]);
  const { mutate, isPending } = useResendOTP();
  const lastCompletedValueRef = useRef(null);

  // Sync code with parent state
  useEffect(() => {
    setCode(initialCode || new Array(length).fill(""));
    lastCompletedValueRef.current = null;
  }, [initialCode, length]);

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

    const newCode = [...code];
    lastCompletedValueRef.current = null;
    newCode[index] = element.value;
    setCode(newCode);
    onCodeChange(newCode); // Sync with parent

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
      onCodeChange(newCode); // Sync with parent
      lastCompletedValueRef.current = null;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const pasteCode = pasteData.slice(0, length).split("");

    if (pasteCode.every((char) => !isNaN(char))) {
      const newCode = [
        ...pasteCode,
        ...new Array(length - pasteCode.length).fill(""),
      ];
      setCode(newCode);
      lastCompletedValueRef.current = null;
      onCodeChange(newCode); // Sync with parent
      // Focus the next empty input or last input
      const nextIndex = Math.min(pasteCode.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleResend = () => {
    if (timeLeft === 0 && !isPending && userEmail) {
      mutate(
        { email: userEmail }, // Trigger resend OTP mutation with userEmail
        {
          onSuccess: () => {
            setTimeLeft(50); // Start timer on success
            setIsActive(true); // Activate timer
            onResend(); // Call onResend callback if provided
          },
        }
      );
    }
  };

  // Check if code is complete and notify parent
  useEffect(() => {
    const joined = code.join("");
    const isComplete = code.every((digit) => digit !== "");
    if (isComplete && joined !== lastCompletedValueRef.current) {
      lastCompletedValueRef.current = joined;
      onComplete(joined);
    }
    onCodeChange(code); // Sync state on every change
  }, [code, onCodeChange, onComplete]);

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
            className="w-12 h-16 sm:w-12 sm:h-16 md:w-12 md:h-16 text-center text-2xl sm:text-3xl font-semibold border border-[#D9D9D9] rounded-xl focus:border-[#288DD1] focus:outline-none focus:ring-1 focus:ring-[#288DD1] transition-all duration-200 bg-white"
          />
        ))}
      </div>

      {/* Resend Section */}
      <div className="text-center">
        <span className="text-[#676767] text-xs sm:text-sm">
          Code Sent.{" "}
          <button
            onClick={handleResend}
            disabled={timeLeft > 0 || isPending || !userEmail}
            className={`font-medium transition-colors duration-200 ${
              timeLeft > 0 || isPending || !userEmail
                ? "text-[#676767] cursor-not-allowed"
                : "text-[#288DD1] hover:text-[#6db1df] cursor-pointer underline"
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 text-[#288DD1] animate-spin inline-block" />
            ) : (
              "Resend Code"
            )}
          </button>
          {timeLeft > 0 && (
            <span className="text-[#288DD1]"> in {formatTime(timeLeft)}</span>
          )}
        </span>
      </div>
    </div>
  );
}
