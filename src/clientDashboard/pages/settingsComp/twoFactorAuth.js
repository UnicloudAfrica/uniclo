import React, { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchClientProfile,
  useEnableTwoFactorAuth,
  useDisableTwoFactorAuth,
} from "../../../hooks/clientHooks/profileHooks";
import { useResendOTP } from "../../../hooks/authHooks";

const TwoFactorAuth = () => {
  const { data: profile, isFetching: isProfileFetching } =
    useFetchClientProfile();

  const [setupInfo, setSetupInfo] = useState(null); // { qr_code_url, secret }
  const [verificationCode, setVerificationCode] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [otpStep, setOtpStep] = useState(null); // 'enable' or 'disable'
  const [otpCode, setOtpCode] = useState("");

  const { mutate: enable2fa, isPending: isEnabling } = useEnableTwoFactorAuth({
    onSuccess: (data) => {
      if (data.qr_code_url) {
        setOtpStep(null); // Clear OTP step
        setOtpCode(""); // Clear OTP code
        // Initial step: QR code and secret are returned
        setSetupInfo(data);
        ToastUtils.info(
          "Scan the QR code with your authenticator app to continue."
        );
      } else {
        // Final step: 2FA is successfully enabled
        // ToastUtils.success("Two-Factor Authentication enabled successfully!");
        setSetupInfo(null);
        setVerificationCode("");
      }
    },
    onError: (error) => {
      //   ToastUtils.error(error.message || "Failed to enable 2FA.");
    },
  });

  const { mutate: resendOtp, isPending: isSendingOtp } = useResendOTP({
    onSuccess: () => {
      ToastUtils.success(`An OTP has been sent to ${profile?.email}.`);
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to send OTP.");
    },
  });

  const { mutate: disable2fa, isPending: isDisabling } =
    useDisableTwoFactorAuth({
      onSuccess: () => {
        // ToastUtils.success("Two-Factor Authentication disabled successfully!");
        setShowDisableModal(false);
        setOtpCode("");
        setOtpStep(null);
      },
      onError: (error) => {
        // ToastUtils.error(error.message || "Failed to disable 2FA.");
      },
    });

  const handleRequestOtp = (type) => {
    if (!profile?.email) {
      ToastUtils.error("No email address found on your profile.");
      return;
    }
    setOtpStep(type);
    resendOtp({ email: profile.email });
    if (type === "disable") {
      setShowDisableModal(true);
    }
  };

  const handleEnableWithOtp = () => {
    if (!otpCode || otpCode.length !== 6) {
      ToastUtils.error("Please enter a valid 6-digit OTP.");
      return;
    }
    // First, verify OTP to get QR code
    enable2fa({ otp: otpCode });
  };

  const handleVerifyClick = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      ToastUtils.error("Please enter a valid 6-digit verification code.");
      return;
    }
    // Final call to verify authenticator app code and enable 2FA
    enable2fa({ code: verificationCode });
  };

  const handleDisableConfirm = () => {
    if (!otpCode || otpCode.length !== 6) {
      ToastUtils.error("A valid 6-digit OTP is required to disable 2FA.");
      return;
    }
    disable2fa({ code: otpCode });
  };

  if (isProfileFetching) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
      </div>
    );
  }

  const is2faEnabled = !!profile?.google2fa_secret;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#ECEDF0]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Two-Factor Authentication (2FA)
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Add an extra layer of security to your account.
      </p>

      {is2faEnabled ? (
        // 2FA is Enabled View
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <ShieldCheck className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h4 className="font-semibold text-green-800">2FA is Active</h4>
              <p className="text-sm text-green-700">
                Your account is protected with an additional layer of security.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRequestOtp("disable")}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            Disable 2FA
          </button>
        </div>
      ) : setupInfo ? (
        // 2FA Setup View (QR Code)
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-800">
              Step 1: Scan QR Code
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Use an authenticator app (like Google Authenticator) to scan this
              QR code.
            </p>
            <div className="mt-4 p-4 bg-gray-100 inline-block rounded-lg">
              <img
                src={setupInfo.qr_code_url}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Or manually enter this secret key:
            </p>
            <code className="block bg-gray-200 text-gray-800 p-2 rounded-md mt-1 text-center font-mono">
              {setupInfo.secret}
            </code>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Step 2: Verify Code</h4>
            <p className="text-sm text-gray-600 mt-1">
              Enter the 6-digit code from your authenticator app.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="w-full md:w-1/2 mt-2 input-field"
              placeholder="123456"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleVerifyClick}
              disabled={isEnabling}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isEnabling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              Verify & Enable
            </button>
            <button
              onClick={() => setSetupInfo(null)}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : otpStep === "enable" ? (
        // OTP Verification for Enable
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Verify Your Identity</h4>
          <p className="text-sm text-gray-600">
            An OTP has been sent to your email address ({profile?.email}).
            Please enter it below to proceed.
          </p>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              className="w-full md:w-1/2 input-field pl-10"
              placeholder="Enter OTP"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleEnableWithOtp}
              disabled={isEnabling || isSendingOtp}
              className="px-6 py-2 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 flex items-center"
            >
              {isEnabling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Continue
            </button>
            <button
              onClick={() => setOtpStep(null)}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // 2FA is Disabled View
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <ShieldOff className="w-6 h-6 text-gray-600 mr-3" />
            <div>
              <h4 className="font-semibold text-gray-800">2FA is Inactive</h4>
              <p className="text-sm text-gray-700">
                Enable two-factor authentication to secure your account.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRequestOtp("enable")}
            disabled={isSendingOtp}
            className="mt-4 px-6 py-2 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 flex items-center"
          >
            {isSendingOtp ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Enable 2FA
          </button>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && otpStep === "disable" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h4 className="text-lg font-semibold mb-2">Disable 2FA</h4>
            <p className="text-sm text-gray-600 mb-4">
              For your security, please enter the OTP sent to your email to
              confirm.
            </p>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="w-full input-field pl-10 tracking-widest text-center"
                placeholder="Enter OTP"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDisableModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableConfirm}
                disabled={isDisabling || isSendingOtp}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {isDisabling && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Confirm & Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;
