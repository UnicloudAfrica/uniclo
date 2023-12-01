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
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">Our Advisory board</p>
            <p className=" text-center font-normal mt-3 text-lg md:text-xl">Team and Leadership at UniCloud Africa: Pioneering Excellence in the Digital Frontier</p>

            <p className=" text-base font-normal mt-6 text-justify md:text-center text-[#676767]">At UniCloud Africa, our strength lies in a dynamic team led by visionary leaders with a passion for innovation. From seasoned executives with over decades of hands-on experience to experts in cloud computing, our diverse team is united by a common goal: to revolutionize the way businesses operate in Africa.
            Our leadership, comprising industry trailblazers, brings a wealth of expertise in operations, finance, telecommunications, and technology, steering UniCloud Africa towards new heights of success. With a commitment to excellence and a focus on client empowerment, our team is dedicated to providing secure, scalable, and reliable cloud solutions that drive digital transformation across the continent.
            Together, we are not just shaping the future of UniCloud Africa; we are propelling Africa's digital future forward, one innovation at a time. Join us on this transformative journey, where the strength of our team is the driving force behind your success in the digital age.</p>

            <div className="mt-16 w-full">
                <div className=" mt-6 flex flex-wrap justify-around space-y-4 md:space-y-8 space-x-0 md:space-x-[24px] ">
                    {boardArray.map((item, index) => (
                        <Link key={index} to={`/advisory-board/${item.id}`} className="flex items-center justify-center w-full md:w-[250px]">
                            <div className="w-full text-center">             
                                <div className="h-[250px] bg-[#F5F5F4] md:bg-center rounded-[20px]" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover' }}></div>
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