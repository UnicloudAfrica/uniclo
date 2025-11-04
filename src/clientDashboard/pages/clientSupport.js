import React, { useState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import { useFetchClientProfile } from "../../hooks/clientHooks/profileHooks";
import { useCreateClientSupportMessage } from "../../hooks/clientHooks/supportHooks";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";

export default function ClientSupport() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: profile } = useFetchClientProfile();
  const { mutate: createSupportMessage, isPending } =
    useCreateClientSupportMessage();

  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    body: "",
  });
  const [errors, setErrors] = useState({});

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
      ToastUtils.error("Please fill in all required fields.");
      return;
    }

    createSupportMessage(formData, {
      onSuccess: () => {
        ToastUtils.success("Support message sent successfully!");
        setFormData({
          email: profile?.email || "",
          subject: "",
          body: "",
        });
        setErrors({});
      },
      onError: (err) => {
        ToastUtils.error(
          err.message || "Failed to send message. Please try again."
        );
      },
    });
  };

  return (
    <>
      <Headbar onMenuClick={() => setIsMobileMenuOpen(true)} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <ClientActiveTab />
      <ClientPageShell
        title="Support"
        description="Get help from our support team whenever you need it."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Support" },
        ]}
      >
        <div className="bg-white rounded-lg p-6 border border-[#ECEDF0] max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Contact Support
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Have a question or need help? Fill out the form below and our team
            will get back to you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                className="w-full input-field bg-gray-100"
                disabled
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Billing question"
                className={`w-full input-field ${
                  errors.subject ? "border-red-500" : ""
                }`}
                disabled={isPending}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="body"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                value={formData.body}
                onChange={handleInputChange}
                placeholder="Please describe your issue in detail..."
                rows="6"
                className={`w-full input-field resize-y ${
                  errors.body ? "border-red-500" : ""
                }`}
                disabled={isPending}
              ></textarea>
              {errors.body && (
                <p className="text-red-500 text-xs mt-1">{errors.body}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </ClientPageShell>
    </>
  );
}
