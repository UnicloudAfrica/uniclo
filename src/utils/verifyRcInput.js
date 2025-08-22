const VerifyRCInput = () => {
  // ${
  //         errors.companyName ? "border-red-500" : "border-gray-300"
  //       }
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buisness RC Number<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value=""
          //   onChange={(e) => updateFormData("companyName", e.target.value)}
          className={`input-field 
            
          `}
          placeholder="Enter company RC number"
        />
        {/* {errors.companyName && (
          <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
        )} */}
      </div>
    </>
  );
};

export default VerifyRCInput;
