import certiOne from "./assets/newcert1.png";
import certiTwo from "./assets/newcert2.png";
import certiThree from "./assets/newcert3.png";
import certiFour from "./assets/newcert4.png";
import certiFive from "./assets/newcert5.png";
import certiSix from "./assets/newcert6.png";
import certiSeven from "./assets/newcert7.png";
import certiEight from "./assets/newcert8.png";

const Certifications = () => {
  return (
    <section
      aria-labelledby="certifications-heading"
      className=" px-4 md:px-8 lg:px-16 my-[5em] font-Outfit w-full flex flex-col justify-center items-center"
    >
      <h2
        id="certifications-heading"
        className=" font-medium text-2xl md:text-[40px] md:leading-[50px] text-center"
      >
        Key Certifications
      </h2>
      <p className=" text-center font-normal text-base md:text-xl text-[#676767] mt-3 md:px-[10%]">
        UniCloud Africa is a certified cloud service provider, Our
        certifications demonstrate our commitment to providing our customers
        with the highest quality of service and support.
      </p>
      <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-12">
        <img
          src={certiThree}
          className="w-full max-w-[150px] object-contain"
          alt="ISO 27001 Certification"
        />
        <img
          src={certiFour}
          className="w-full max-w-[150px] object-contain"
          alt="ISO 27017 Certification"
        />
        <img
          src={certiTwo}
          className="w-full max-w-[150px] object-contain"
          alt="ISO 20000-1 Certification"
        />
        <img
          src={certiFive}
          className="w-full max-w-[150px] object-contain"
          alt="PCIDSS Certification"
        />
        <img
          src={certiOne}
          className="w-full max-w-[150px] object-contain"
          alt="NDPR Compliant"
        />
        <img
          src={certiSix}
          className="w-full max-w-[150px] object-contain"
          alt="SOC 2 Type II Certification"
        />
        <img
          src={certiSeven}
          className="w-full max-w-[150px] object-contain"
          alt="ISO 9001 Certification"
        />
        <img
          src={certiEight}
          className="w-full max-w-[150px] object-contain"
          alt="HIPAA Compliant"
        />
      </div>
    </section>
  );
};

export default Certifications;
