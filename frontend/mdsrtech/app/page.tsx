import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedItems from './components/FeaturedItems';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <FeaturedItems />
      <Footer />
    </div>
  );
}
