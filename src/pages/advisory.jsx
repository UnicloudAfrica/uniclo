import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useContext, useEffect, useState } from "react";
import { BoardContext } from "../contexts/contextprovider";
import { Link } from "react-router-dom";
import Ads from "../components/ad";

const Advisory = () => {
  const [boardArray] = useContext(BoardContext);
  const [processedArray, setProcessedArray] = useState([]);

  useEffect(() => {
    const processedBoardArray = boardArray.map((item) => ({
      ...item,
      processedName: encodeURIComponent(item.name).replaceAll("%20", "-"),
    }));
    setProcessedArray(processedBoardArray);
  }, [boardArray]);

  return (
    <>
      <Navbar />
      <div className=" mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
        <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
          Executive Leadership Team
        </p>

        <p className=" text-base font-normal mt-6 text-justify text-[#676767]">
          In the realm of management, UniCloud Africa stands as a beacon of excellence, propelled by
          a dynamic team led by visionary leaders. Our management team boasts seasoned executives
          with decades of hands-on experience, alongside experts in cloud computing, collectively
          fueled by a fervor for innovation. Guided by industry trailblazers, our leadership brings
          forth a wealth of expertise in operations, finance, telecommunications, and technology,
          steering UniCloud Africa towards unprecedented success.
          <br />
          <br />
          Committed to excellence and client empowerment, our team endeavors to deliver secure,
          scalable, and reliable cloud solutions, catalyzing digital transformation across Africa.
          Together, we are not only shaping the future of UniCloud Africa but also spearheading
          Africa's digital evolution, one innovation at a time. Embark on this transformative
          journey with us, where the resilience and ingenuity of our team serve as the cornerstone
          of your triumph in the digital era
        </p>

        <div className="mt-16 w-full">
          <div className="mt-6 flex flex-wrap justify-around space-y-4 md:space-y-0 space-x-0 md:space-x-[24px] ">
            {processedArray
              // Ensure 'order' property exists and is numeric
              .filter((item) => typeof item.order === "number")
              // Sort the array based on the 'order' property
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <Link
                  key={index}
                  to={`/management/${item.processedName}`}
                  className="flex items-start justify-start w-full md:mb-4 md:w-[250px]"
                >
                  <div className="w-full text-center mt-5">
                    <div
                      className="h-[400px] md:h-[300px] bg-[#F5F5F4] md:bg-center rounded-[20px]"
                      style={{
                        backgroundImage: `url(${item.url})`,
                        backgroundSize: "cover",
                      }}
                    ></div>
                    <span className="  lg:h-[2em]">
                      <p className="text-center mt-4 text-lg lg:text-xl font-medium">{item.name}</p>
                      <p className="text-center text-sm text-[#636363] lg:text-base font-medium">
                        {item.position}
                      </p>
                    </span>
                    <p className="gradient-text text-sm">View More</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
      <Ads />
      <Footer />
    </>
  );
};

export default Advisory;
