import logo from "../assets/logo.png";

export default function Header({ logoSrc, logoAlt = "Logo", companyName = "Unicloud Africa" }) {
  const resolvedLogo = logoSrc || logo;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <img src={resolvedLogo} className="w-[100px]" alt={logoAlt} />
      </div>
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold text-[#121212] mb-2">Create an Account</h1>
        <p className="text-[#676767] text-sm">
          Join {companyName} and launch your cloud in minutes.
        </p>
      </div>
    </div>
  );
}
