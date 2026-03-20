import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "NYAGATARE SECONDARY SCHOOL",
      subtitle: "Excellence in STEM Education",
      description: "We Are A Public School That Welcomes Any Student Interested In Exploring The Fields Of Science, Technology, Engineering And Math.",
      gradient: "from-blue-600 via-purple-600 to-orange-500",
      textColor: "text-white"
    },
    {
      id: 2,
      title: "ADVANCED LABORATORIES",
      subtitle: "State-of-the-Art Facilities",
      description: "Experience hands-on learning in our modern science laboratories equipped with cutting-edge technology and equipment.",
      gradient: "from-green-500 via-teal-500 to-blue-600",
      textColor: "text-white"
    },
    {
      id: 3,
      title: "FUTURE INNOVATORS",
      subtitle: "Preparing Tomorrow's Leaders",
      description: "Join a community of ambitious students and dedicated educators committed to excellence in science and technology.",
      gradient: "from-orange-500 via-red-500 to-pink-600",
      textColor: "text-white"
    },
    {
      id: 4,
      title: "COLLEGE PREPARATION",
      subtitle: "Ready for Higher Education",
      description: "Our rigorous curriculum and support system ensure students are well-prepared for university studies and future careers.",
      gradient: "from-indigo-600 via-blue-600 to-cyan-500",
      textColor: "text-white"
    }
  ];

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].gradient} transition-all duration-1000 ease-in-out`}>
        <div className="absolute inset-0 bg-black/20"></div>
        {/* Animated particles/shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-white/5 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
      >
        <ChevronLeft size={32} className="text-white" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
      >
        <ChevronRight size={32} className="text-white" />
      </button>

      {/* Slide Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700" key={currentSlide}>
          <h1 className={`text-5xl md:text-7xl font-bold ${slides[currentSlide].textColor} mb-4 leading-tight`}>
            {slides[currentSlide].title}
          </h1>
          
          <h2 className={`text-2xl md:text-3xl font-semibold ${slides[currentSlide].textColor} mb-8 opacity-90`}>
            {slides[currentSlide].subtitle}
          </h2>
          
          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl max-w-3xl mx-auto mb-12">
            <p className="text-white text-lg md:text-xl leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              APPLY NOW
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-green  hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              LEARN MORE
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </section>
  );
};

export default Hero;