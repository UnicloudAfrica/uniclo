import logo from "./assets/logo.png";

const Topbar = () => {
  return (
    <>
      <div className=" fixed top-0 left-0 h-[80px] w-full border-b z-20 bg-[#fff] border-[#00000029] justify-between text-blkac flex items-center px-8">
        <span className=" hidden md:flex flex-row items-center space-x-1">
          <img src={logo} className="" alt="" />
        </span>
        <div>
          <span className=" absolute right-6 top-8 md:static ml-6 flex flex-row space-x-1 items-center">
            <p className=" font-Outfit  font-light text-sm md:text-xl">
              Welcome,
            </p>
            <p className=" font-Outfit font-normal text-sm md:text-xl">Admin</p>
          </span>
        </div>
      </div>
    </>
  );
};

export default Topbar;
