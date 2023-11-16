import Acheive from "../components/achieve";
import Ads from "../components/ad";
import BlogHero from "../components/blog";
import Carousel from "../components/carousel";
import Certifications from "../components/certifications";
import Faq from "../components/faq";
import Features from "../components/features";
import Footer from "../components/footer";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import { motion } from "framer-motion";

const Landing = () => {
    return (
        <>
        <Navbar/>
        <motion.div
        initial={{x:100, opacity:0}}
        animate={{x:0, opacity:1}}
        exit={{x:-100, opacity:0}}
        transition={{type:'spring', stiffness:80, duration:0.2}}
        >
        <Hero/>
        <Carousel/>
        <Features/>
        <Acheive/>
        <BlogHero/>
        <Certifications/>
        <Faq/>
        <Ads/>
        <Footer/>
        </motion.div>
        </>
     );
}
 
export default Landing;