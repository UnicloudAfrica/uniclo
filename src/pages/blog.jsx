import Footer from "../components/footer";
import Navbar from "../components/navbar";
import search from "./assets/search-normal.svg";
import adbg from "./assets/adBG.svg";
import admob from "./assets/adMob.svg";
import { motion } from "framer-motion";
import { useContext, useState, useEffect } from "react";
import { BlogContext } from "../contexts/contextprovider";
import { Link } from "react-router-dom";
import data24 from "./assets/data24.jpg";
import dsc from "./assets/DSC_2041.jpg";

const Blog = () => {
  const [blogArray] = useContext(BlogContext);
  const [selectedTag, setSelectedTag] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processedArray, setProcessedArray] = useState([]);
  const [visibleBlogs, setVisibleBlogs] = useState(2);

  useEffect(() => {
    const processedBlogArray = blogArray.map((item) => ({
      ...item,
      processedName: encodeURIComponent(item.title).replaceAll("%20", "-"),
    }));
    setProcessedArray(processedBlogArray);
  }, [blogArray]);

  const filteredBlogs = processedArray.filter((blog) => {
    const titleMatches = blog.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTag === "all") {
      return titleMatches; // Show all blogs when 'all' is selected
    } else {
      return titleMatches && blog.tag.includes(selectedTag);
    }
  });

  return (
    <>
      <Navbar />
      <motion.div>
        <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full font-Outfit text-[#121212]">
          <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
            Unicloud in the Press
          </p>
          <p className=" text-center font-normal mt-3 md:px-[15%] text-[#676767] text-lg md:text-xl ">
            Explore Our Blog for insightful articles on cloud trends, best pratices and success
            stories.
          </p>
          <div className=" w-full flex justify-between items-center relative mt-8">
            <select
              name=""
              id=""
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="  px-3 md:px-6 py-3 border text-xs md:text-base border-[#EAEBF0] flex justify-center rounded-[10px] custom-dropdown w-[140px]  md:w-[250px]"
            >
              <option value="all">All Categories</option>
              <option value="Cloud Computing">Cloud Computing</option>
              <option value="Cloud Storage">Cloud Storage</option>
              <option value="Web Hosting">Web Hosting</option>
            </select>

            <input
              placeholder="Search blog posts"
              className="px-3 md:px-6 py-3 border text-xs md:text-base placeholder:text-[#1e1e1e] border-[#EAEBF0] flex justify-center rounded-[10px] w-[140px] md:w-[250px] relative"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <img
              src={search}
              className=" right-3 top-[35%] md:right-6 md:top-[30%] absolute w-3 h-3 md:w-auto md:h-auto"
              alt=""
            />
          </div>

          <div className=" grid grid-cols-1 md:grid-cols-2 gap-[32px] lg:gap-[4%] w-full mt-6">
            {filteredBlogs.slice(0, visibleBlogs).map((item, index) => (
              <Link to={`/blogs/${item.processedName}`}>
                <div key={index} className="w-full text-center">
                  <div
                    className=" w-full h-[290px] bg-[#F5F5F4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${item.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto rounded-[30px] block mt-6 text-sm md:text-base">
                    <p className=" gradient-text">{item.tag}</p>
                  </button>
                  <p className="text-left mt-6 text-xl lg:text-2xl font-medium lg:h-[2.5em]">
                    {item.title}
                  </p>
                  <p className="text-left mt-3 text-[#1E1E1E99] text-sm">
                    {item.drawin.substring(0, 190) + "..."}
                  </p>
                  <p className="text-left mt-3 text-[#121212] font-medium text-base">{item.date}</p>
                </div>
              </Link>
            ))}
          </div>
          {filteredBlogs.length > visibleBlogs && (
            <div className="w-full flex justify-center mt-8">
              <button
                onClick={() => setVisibleBlogs(filteredBlogs.length)}
                className=" bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] text-sm md:text-xl font-normal text-white py-3 px-9 rounded-[30px] text-center"
              >
                View more
              </button>
            </div>
          )}

          <div className=" py-[3em] w-full font-Outfit text-[#fff] mt-16">
            <p className=" font-medium text-3xl md:text-[40px] md:leading-[50px] text-center text-black">
              External Links
            </p>
            <p className=" text-center font-normal mt-3 md:px-[15%] text-[#676767] text-lg md:text-xl ">
              Explore insightful articles and resources about Unicloud Africa
            </p>

            <div className=" grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center w-full mt-8">
              <Link to="/Africa-Data-Centres-and-Onix-Data-Centre-announce-partnership">
                <div className=" w-full  text-center">
                  <div
                    className=" w-full h-[400px] bg-[#F5F5F4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${data24})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>

                  <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto rounded-[30px] block mt-6 text-sm md:text-base relative">
                    <p className=" gradient-text">Technology</p>
                  </button>

                  <p className="text-left mt-6 text-xl lg:text-2xl font-medium text-black">
                    Africa Data Centres and Onix Data Centre announce partnership
                  </p>
                  <p className="text-left mt-3 text-[#1E1E1E99] text-sm">
                    Ghana is set to become a key player in the continent's data storage revolution
                    as Africa Data Centres joins forces with Onix Data Centre in a strategic
                    partnership.{" "}
                  </p>

                  <p className="text-left mt-3 text-[#121212] font-medium text-base">
                    June 08, 2024
                  </p>
                </div>
              </Link>

              {/* link 2 */}
              <Link to="/Benue-State-to-build-modern-data-center-and-cloud-system-with-UniCloud-Africa">
                <div className=" w-full  text-center">
                  <div
                    className=" w-full h-[400px] bg-[#F5F5F4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${dsc})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>

                  <button className=" bg-[#3DC8F91A] px-3 py-2 mr-auto rounded-[30px] block mt-6 text-sm md:text-base relative">
                    <p className=" gradient-text">Technology</p>
                  </button>

                  <p className="text-left mt-6 text-xl lg:text-2xl font-medium text-black">
                    Benue State to build modern data center and cloud system with UniCloud Africa
                  </p>
                  <p className="text-left mt-3 text-[#1E1E1E99] text-sm">
                    This project is a significant step forward for Benue’s digital transformation.
                    The in-country cloud solution offered by UniCloud Africa ensures that the
                    state’s data remains within Nigeria’s borders.
                  </p>

                  <p className="text-left mt-3 text-[#121212] font-medium text-base">
                    July 10, 2024
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <motion.div className="  py-[3em] w-full font-Outfit text-[#fff] mt-16">
            <div className=" w-full h-[400px] md:h-[300px] flex justify-center items-center text-center flex-col rounded-[30px] bg-gradient-to-r from-[#288DD1CC] via-[#3fd0e0CC] to-[#3FE0C8CC] relative">
              <img
                src={adbg}
                className="hidden md:block absolute left-0 w-full h-full object-cover rounded-[30px]"
                alt=""
              />
              <img
                src={admob}
                className="z-10 absolute top-0 h-full w-full object-cover block md:hidden"
                alt=""
              />
              <p className=" font-semibold text-xl md:text-3xl">Want product news and updates</p>
              <p className=" font-normal px-4 md:px-0 text-lg md:text-xl">
                Subscribe to UniCloud Africa blog to get update right in your inbox
              </p>
              <div className=" flex flex-col md:flex-row items-center justify-center z-20  mt-4 md:space-x-6 space-y-4 md:space-y-0">
                <input
                  placeholder="Enter Email"
                  className=" w-full md:w-auto h-[52px] bg-[#133D4C80] py-2.5 px-4 md:px-7 text-base placeholder:text-white placeholder:font-Outfit font-Outfit placeholder:text-sm  rounded-[30px]"
                  type="text"
                />
                <Link to="/contact" target="_blank" rel="noopener noreferrer">
                  <button className="md:w-auto px-6 md:px-9 py-3 md:py-4 bg-[#fff] rounded-[30px] text-base text-[#000]">
                    Subscribe
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        <Footer />
      </motion.div>
    </>
  );
};

export default Blog;
