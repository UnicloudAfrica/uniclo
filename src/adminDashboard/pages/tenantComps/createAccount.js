const CreateAccount = ({ formData, setFormData, errors }) => {
  const validate = () => {
    const newErrors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.status) newErrors.status = "Status is required";
    if (!formData.domain) newErrors.domain = "Domain is required";
    else if (!/^[a-zA-Z0-9-]+$/.test(formData.domain))
      newErrors.domain = "Domain must be alphanumeric with hyphens only";
    return newErrors;
  };

  return (
    <div className="space-y-4 font-Outfit">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
          className={`w-full input-field ${
            errors.email ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Temporary Password *
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="Enter Password"
          className={`w-full input-field ${
            errors.password ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Confirm Password *
        </label>
        <input
          id="confirm-password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          placeholder="Repeat Password"
          className={`w-full input-field ${
            errors.confirmPassword ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="domain"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Domain *
        </label>
        <div className="flex items-center">
          <input
            id="domain"
            type="text"
            value={formData.domain}
            onChange={(e) =>
              setFormData({ ...formData, domain: e.target.value })
            }
            placeholder="e.g., xyz"
            className={`w-full input-field ${
              errors.domain ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          <span className="ml-2 text-gray-500">.unicloudafrica.com</span>
        </div>
        {errors.domain && (
          <p className="text-red-500 text-xs mt-1">{errors.domain}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Status *
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.status ? "border-red-500 border" : "border-gray-300 border"
          } rounded px-3 py-2`}
        >
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full bg-transparent outline-none"
          >
            <option value="" disabled>
              Select status
            </option>
            <option value="verified">Verified</option>
            <option value="inactive">Inactive</option>
            {/* <option value="suspended">Suspended</option>
            <option value="pending">Pending</option> */}
          </select>
        </span>
        {errors.status && (
          <p className="text-red-500 text-xs mt-1">{errors.status}</p>
        )}
      </div>
      {/* Role is hardcoded as "tenant" in AddPartner formData */}
    </div>
  );
};

CreateAccount.validate = (formData) => {
  const newErrors = {};
  if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
    newErrors.email = "Invalid email";
  if (!formData.password || formData.password.length < 6)
    newErrors.password = "Password must be at least 6 characters";
  if (formData.password !== formData.confirmPassword)
    newErrors.confirmPassword = "Passwords do not match";
  if (!formData.status) newErrors.status = "Status is required";
  if (!formData.domain) newErrors.domain = "Domain is required";
  else if (!/^[a-zA-Z0-9-]+$/.test(formData.domain))
    newErrors.domain = "Domain must be alphanumeric with hyphens only";
  return newErrors;
};

export default CreateAccount;
