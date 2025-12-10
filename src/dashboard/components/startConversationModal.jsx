import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "../../utils/toastUtil.ts";
import { useFetchProfile } from "../../hooks/resource";
import { useCreateSupportMessage } from "../../hooks/supportHook";

const StartModalConversation = ({ isOpen, onClose }) => {
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
  const { mutate: createSupportMessage, isPending } = useCreateSupportMessage();

  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    body: "",
  });
  const [errors, setErrors] = useState({});

  // Populate email from profile once it's fetched
  useEffect(() => {
    if (profile?.email) {
      setFormData((prev) => ({ ...prev, email: profile.email }));
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    if (!formData.body.trim()) {
      newErrors.body = "Message body is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const payload = {
      email: formData.email,
      subject: formData.subject,
      body: formData.body,
    };

    createSupportMessage(payload, {
      onSuccess: () => {
        ToastUtils.success("Support message sent successfully!");
        onClose();
        setFormData({ email: "", subject: "", body: "" });
      },
      onError: (err) => {
        ToastUtils.error(err.message || "Failed to send message. Please try again.");
        setErrors((prev) => ({
          ...prev,
          general: err.message || "Failed to send message.",
        }));
      },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] p-4 font-Outfit">
          <div className="bg-white rounded-[30px] shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 bg-[#F2F2F2] border-b rounded-t-[30px] border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Start new conversation</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isPending}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`w-full input-field ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Enter subject"
                    className={`w-full input-field ${
                      errors.subject ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  />
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                    Message<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="body"
                    value={formData.body}
                    onChange={handleInputChange}
                    placeholder="Type your message here..."
                    rows="5"
                    className={`w-full input-field resize-y ${
                      errors.body ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  ></textarea>
                  {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body}</p>}
                </div>
                {errors.general && (
                  <p className="text-red-500 text-xs mt-1 text-center">{errors.general}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isPending}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isPending}
                >
                  Start
                  {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StartModalConversation;
