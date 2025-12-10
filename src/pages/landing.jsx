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
import { Helmet } from "react-helmet-async";

const Landing = () => {
  return (
    <>
      <Helmet>
        <title>UniCloud Africa: Secure & Scalable Cloud Solutions</title>
        <meta
          name="description"
          content="UniCloud Africa offers secure, scalable, and reliable cloud solutions to transform your business. Shape your digital future with us."
        />
        <meta
          name="keywords"
          content="UniCloud Africa, Cloud Solutions, Cloud Services Africa, Secure Cloud, Scalable Cloud, Business Transformation"
        />
        <link rel="canonical" href="https://www.unicloudafrica.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.unicloudafrica.com/" />
        <meta property="og:title" content="UniCloud Africa: Secure & Scalable Cloud Solutions" />
        <meta
          property="og:description"
          content="UniCloud Africa offers secure, scalable, and reliable cloud solutions to transform your business. Shape your digital future with us."
        />
      </Helmet>
      <Navbar />
      <Hero />
      <Carousel />
      <Features />
      <Acheive />
      <BlogHero />
      <Certifications />
      <Faq />
      <Ads />
      <Footer />
    </>
  );
};

export default Landing;
