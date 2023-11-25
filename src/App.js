import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import About from "./pages/about";
import Contact from "./pages/contact";
import FaqPage from "./pages/faqPage";
import Landing from "./pages/landing";
import Partnership from "./pages/partnership";
import Resources from "./pages/resources";
import Services from "./pages/services";
import Terms from "./pages/terms";
import Solutions from "./pages/solutions";
import DetailedSolution from "./pages/detailedSolu";
import Events from "./pages/events";
import Blog from "./pages/blog";
import Cms from "./pages/cms";
import Advisory from "./pages/advisory";
import DetailedBlog from "./pages/detailedblog";
import DetailedResources from "./pages/detailedresouces";
import DetailedCases from "./pages/detailedcase";

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/advisory-board" element={<Advisory/>} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/partnership" element={<Partnership />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/services" element={<Services />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/events" element={<Events />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/solutions/:id" element={ <DetailedSolution />} />
          <Route path="/resources/:id" element={ <DetailedResources/> } />
          <Route path="/use-cases/:id" element={ <DetailedCases/> } />
          <Route path="/blogs/:id" element={<DetailedBlog/> } />
          <Route path="/cms-admin" element={<Cms/>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
