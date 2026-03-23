import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import CustomCursor from "@/components/ui/CustomCursor";
import MouseSpotlight from "@/components/ui/MouseSpotlight";
import ScrollProgress from "@/components/ui/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";
import { getExperience, getProjects, getSiteData } from "@/lib/data";

export default async function Home() {
  const [siteData, projects, experience] = await Promise.all([
    getSiteData(),
    getProjects(),
    getExperience(),
  ]);

  return (
    <div className="site-shell">
      <SmoothScroll />
      <CustomCursor />
      <ScrollProgress />
      <MouseSpotlight />
      <Navbar />
      <main role="main">
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Hero data={siteData.hero} />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <About data={siteData.about} />
        </ErrorBoundary>
        <ErrorBoundary>
          <Projects projects={projects} />
        </ErrorBoundary>
        <ErrorBoundary>
          <Experience experience={experience} />
        </ErrorBoundary>
        <ErrorBoundary>
          <Contact data={siteData.contact} socials={siteData.hero.socials} />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
