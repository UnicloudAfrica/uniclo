import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useContext } from "react";
import { BoardContext } from "../contexts/contextprovider";
import { Link } from "react-router-dom";
import Ads from "../components/ad";

const Advisory = () => {

    const [boardArray] = useContext(BoardContext);

    return ( 
        <>
        <Navbar/>
        <div className=" mt-[8em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Mangement</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl">Team and Leadership at UniCloud Africa: Pioneering Excellence in the Digital Frontier</p>

            <p className=" text-base font-normal mt-6 text-justify md:text-center text-[#676767]">In the realm of management, UniCloud Africa stands as a beacon of excellence, propelled by a dynamic team led by visionary leaders.
             Our management team boasts seasoned executives with decades of hands-on experience, alongside experts in cloud computing, collectively fueled by a fervor for innovation. Guided by industry trailblazers, our leadership brings forth a wealth of expertise in operations, finance, telecommunications, and technology, steering UniCloud Africa towards unprecedented success.
              Committed to excellence and client empowerment, our team endeavors to deliver secure, scalable, and reliable cloud solutions, catalyzing digital transformation across Africa. Together, we are not only shaping the future of UniCloud Africa but also spearheading Africa's digital evolution, one innovation at a time. Embark on this transformative journey with us, where the resilience and ingenuity of our team serve as the cornerstone of your triumph in the digital era</p>

            <div className="mt-16 w-full">
                <div className=" mt-6 flex flex-wrap justify-around space-y-4 md:space-y-0  space-x-0 md:space-x-[24px] ">
                    {boardArray.map((item, index) => (
                        <Link key={index} to={`/management/${encodeURIComponent(item.name)}`} className="flex items-center justify-center w-full md:mb-4 md:w-[250px]">
                            <div className="w-full text-center">             
                                <div className="h-[280px] bg-[#F5F5F4] md:bg-center rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover' }}></div>
                                <p className="text-center mt-4 text-lg lg:text-xl font-medium lg:h-[1.5em]">{item.name}</p>
                                <p className=" gradient-text text-sm">View More</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>



        </div>
        <Ads/>
        <Footer/>
        </>
     );
}
 
export default Advisory;