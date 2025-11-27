import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useLoginAccount } from "../../hooks/authHooks";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import useAuthRedirect from "../../utils/authRedirect";

const TenantLogin = ({ tenant = "Tenant" }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { mutate, isPending } = useLoginAccount();
  const navigate = useNavigate();
  const { userEmail, setUserEmail } = useTenantAuthStore.getState();
  const { isLoading } = useAuthRedirect();
  const [tenantData, setTenantData] = useState({
    name: tenant,
    logo: logo, // Placeholder logo
    color: "#288DD1", // Placeholder color
  });

  // Simulate API request to fetch tenant data
  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const mockResponse = {
          name: tenant === "Tenant" ? "Default Tenant" : `${tenant} Corp`,
          logo: logo, // Placeholder, could be a URL like "https://example.com/${tenant}-logo.png"
          color: tenant === "Tenant" ? "#FF5722" : "#FF5722", // Different example color
        };
        setTenantData(mockResponse);
      } catch (error) {
        console.error("Failed to fetch tenant data:", error);
        setTenantData({
          name: tenant,
          logo: logo,
          color: "#288DD1",
        });
      }
    };

    fetchTenantData();
  }, [tenant]);

  // Validation function
  const validateForm = () => {
    let newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for login
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      email,
      password,
      role: "Client", // Fixed to Client for tenant login
    };

    mutate(userData, {
      onSuccess: () => {
        setUserEmail(email);
        navigate("/verify-mail"); // Redirect on success
      },
      onError: (err) => {
        setErrors({ general: err.message || "Failed to login" });
        console.log(err);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 font-Outfit"
      style={{ backgroundColor: tenantData.color + "20" }} // Light background tint
    >
      <div className="max-w-md mx-auto w-full bg-white p-6 rounded-xl shadow-md">
        <div className="mb-6 text-center">
          <img
            src={tenantData.logo}
            className="w-[100px] mx-auto mb-4 rounded"
            alt={`${tenantData.name} Logo`}
          />
          <h1 className="text-2xl font-semibold text-[#121212] mb-2">
            Welcome Back
          </h1>
          <p className="text-[#676767] text-sm">
            Sign in to {tenantData.name}'s portal.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full input-field ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full input-field pr-10 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-[tenantData.color] hover:opacity-80 font-medium"
              style={{ color: tenantData.color, transition: "opacity 0.3s" }}
            >
              Forgot Password?
            </Link>
          </div>
          {errors.general && (
            <p className="text-red-500 text-xs mt-1">{errors.general}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[tenantData.color] hover:opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-opacity focus:outline-none focus:ring-1 focus:ring-[tenantData.color] focus:ring-offset-2 flex items-center justify-center"
            style={{
              backgroundColor: tenantData.color,
              transition: "opacity 0.3s",
            }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              "Login"
            )}
          </button>
          <div className="text-center mt-4">
            <span className="text-sm text-[#1E1E1E99]">
              Don't have an account?{" "}
            </span>
            <Link
              to="/register"
              type="button"
              className="text-sm text-[tenantData.color] hover:opacity-80 font-medium"
              style={{ color: tenantData.color, transition: "opacity 0.3s" }}
            >
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantLogin;
