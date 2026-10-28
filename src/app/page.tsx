import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Toolkit from "@/components/sections/Toolkit";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

// Single-page portfolio. Section order here is the scroll order; nav links
// target the ids: #top, #about, #work, #skills, #contact.
export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Toolkit />
      <Contact />
      <Footer />
    </main>
  );
}
