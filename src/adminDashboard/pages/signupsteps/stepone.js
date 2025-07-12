import { Eye, EyeOff } from "lucide-react";

export const CreateAccountStep = ({
  formData,
  updateFormData,
  showPassword,
  setShowPassword,
  errors,
}) => (
  <div className="space-y-4">
    <div>
      <label
        htmlFor="email"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Email
      </label>
      <input
        id="email"
        type="email"
        value={formData.email}
        onChange={(e) => updateFormData("email", e.target.value)}
        placeholder="Enter email address"
        className={`w-full input-field ${
          errors.email ? "border-red-500" : "border-gray-300"
        }`}
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
        Password
      </label>
      <div className="relative">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) => updateFormData("password", e.target.value)}
          placeholder="Enter password"
          className={`w-full input-field transition-all ${
            errors.password ? "border-red-500" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
      {errors.password && (
        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="confirmPassword"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Confirm Password
      </label>
      <div className="relative">
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
          placeholder="Confirm password"
          className={`w-full input-field ${
            errors.confirmPassword ? "border-red-500" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
      {errors.confirmPassword && (
        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
      )}
    </div>
  </div>
);
