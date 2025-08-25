import logo from "../assets/logo.png";

export default function Header() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <img src={logo} className="w-[100px]" alt="Logo" />
      </div>
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold text-[#121212] mb-2">
          Create an Account
        </h1>
        <p className="text-[#676767] text-sm">
          Create an account on Unicloud Africa.
        </p>
      </div>
    </div>
  );
}
