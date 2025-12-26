import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle2,
  BarChart3,
  Calendar,
  FileText,
  DollarSign,
  Star,
  MessageSquare,
  Target,
  Building2,
  Menu,
  ChevronDown,
  HelpCircle,
  Mail,
  LogIn
} from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("hero");
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  // Smooth scroll handler
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setMobileMenuOpen(false);
    }
  };

  // Track active section for navigation highlighting
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      if (scrollPosition < 400) {
        setActiveSection("hero");
      } else if (scrollPosition < 1000) {
        setActiveSection("features");
      } else if (scrollPosition < 1600) {
        setActiveSection("benefits");
      } else if (scrollPosition < 2200) {
        setActiveSection("testimonials");
      } else {
        setActiveSection("faq");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard navigation for features
  const handleFeatureKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpandedFeature(expandedFeature === index ? null : index);
    }
  };
  const features = [
    {
      icon: Target,
      title: "Project Management",
      description: "Streamline your projects from start to finish with powerful tracking, collaboration tools, and milestone management.",
      details: "Track progress in real-time, assign tasks, set deadlines, and collaborate seamlessly with your team. Get instant notifications and updates on project milestones."
    },
    {
      icon: Users,
      title: "Team Management", 
      description: "Efficiently manage your workforce with advanced HR tools, attendance tracking, and performance monitoring.",
      details: "Manage employee profiles, track attendance, monitor performance, and streamline HR processes. All in one centralized platform."
    },
    {
      icon: DollarSign,
      title: "Financial Control",
      description: "Take control of your finances with comprehensive invoicing, payments, and accounting management systems.",
      details: "Generate invoices, track payments, manage expenses, and get comprehensive financial reports. Keep your finances organized and transparent."
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Make data-driven decisions with powerful reporting and analytics that give you insights into every aspect of your business.",
      details: "Access real-time dashboards, custom reports, and actionable insights. Make informed decisions based on comprehensive data analysis."
    },
    {
      icon: Calendar,
      title: "Resource Planning",
      description: "Optimize resource allocation and scheduling to maximize efficiency and minimize downtime across all operations.",
      details: "Plan resources effectively, schedule tasks, avoid conflicts, and ensure optimal utilization of your team and assets."
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Centralize all your project documents, contracts, and files in one secure, easily accessible location.",
      details: "Store, organize, and share documents securely. Version control, access management, and seamless collaboration on all your files."
    }
  ];

  const benefits = [
    "Increase project delivery speed by 40%",
    "Reduce administrative overhead by 60%", 
    "Improve team productivity and collaboration",
    "Gain real-time visibility into all operations",
    "Ensure compliance with industry standards",
    "Scale your business efficiently"
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "Creative Solutions Agency",
      role: "Operations Director",
      content: "Drena transformed how we manage our projects. We've seen a 35% improvement in delivery times and our team collaboration has never been better.",
      rating: 5
    },
    {
      name: "Michael Chen", 
      company: "Digital Marketing Pro",
      role: "CEO",
      content: "The financial management features alone have saved us countless hours. The real-time reporting gives us the insights we need to make better business decisions.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      company: "Tech Innovations LLC",
      role: "Project Manager",
      content: "The resource planning tools have been a game-changer. We can now see exactly where our team's time is going and optimize accordingly.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "How quickly can I get started?",
      answer: "You can set up your agency account in minutes. Our onboarding wizard guides you through the process step-by-step, and you'll be up and running in no time."
    },
    {
      question: "Do I need a credit card to start?",
      answer: "No credit card required for the 14-day free trial. You can explore all features and decide if Drena is right for your agency."
    },
    {
      question: "Can I customize the platform for my agency?",
      answer: "Yes! Drena offers extensive customization options including branding, workflows, and integrations to match your agency's unique needs."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer 24/7 support via email and chat, comprehensive documentation, video tutorials, and dedicated account managers for enterprise clients."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade security with encryption, regular backups, and compliance with industry standards including SOC 2 and GDPR."
    },
    {
      question: "Can I integrate with other tools?",
      answer: "Yes, Drena integrates with popular tools like Slack, QuickBooks, Google Workspace, and many more. We also offer API access for custom integrations."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        tabIndex={0}
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md p-1"
              aria-label="Drena Home"
            >
              <Building2 className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold">Drena</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              <a 
                href="#features" 
                onClick={(e) => handleSmoothScroll(e, "features")}
                className={`transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1 ${
                  activeSection === "features" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="View Features"
              >
                Features
              </a>
              <a 
                href="#benefits" 
                onClick={(e) => handleSmoothScroll(e, "benefits")}
                className={`transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1 ${
                  activeSection === "benefits" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="View Benefits"
              >
                Benefits
              </a>
              <a 
                href="#testimonials" 
                onClick={(e) => handleSmoothScroll(e, "testimonials")}
                className={`transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1 ${
                  activeSection === "testimonials" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="View Testimonials"
              >
                Testimonials
              </a>
              <Link 
                to="/pricing" 
                className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1 transition-colors"
                aria-label="View Pricing"
              >
                Pricing
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth">
                <Button 
                  variant="secondary" 
                  className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Sign in to your existing Drena account"
                >
                  <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign In
                </Button>
              </Link>
              <Link to="/agency-signup">
                <Button 
                  className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Create a new agency account"
                >
                  Create Agency <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                  <a 
                    href="#features" 
                    onClick={(e) => handleSmoothScroll(e, "features")}
                    className="text-lg font-medium py-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2"
                  >
                    Features
                  </a>
                  <a 
                    href="#benefits" 
                    onClick={(e) => handleSmoothScroll(e, "benefits")}
                    className="text-lg font-medium py-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2"
                  >
                    Benefits
                  </a>
                  <a 
                    href="#testimonials" 
                    onClick={(e) => handleSmoothScroll(e, "testimonials")}
                    className="text-lg font-medium py-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2"
                  >
                    Testimonials
                  </a>
                  <Link 
                    to="/pricing" 
                    className="text-lg font-medium py-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" className="w-full justify-start">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In to Your Agency
                      </Button>
                    </Link>
                    <Link to="/agency-signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start">
                        Create New Agency <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        id="main-content" 
        ref={heroRef}
        className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
        aria-labelledby="hero-heading"
      >
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge 
              variant="secondary" 
              className="mb-6 inline-flex items-center"
              aria-label="Trusted by 500+ agencies worldwide"
            >
              <TrendingUp className="w-4 h-4 mr-2" aria-hidden="true" />
              Trusted by 500+ Agencies Worldwide
            </Badge>
            
            <h1 
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Accelerate Your Agency's 
              <span className="text-primary block">Growth & Success</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Drena is the all-in-one business management platform that streamlines operations, 
              boosts team productivity, and scales your agency faster than ever before.
            </p>
            
            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
              <Link to="/agency-signup" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Create your agency account - Free 14-day trial"
                >
                  Create Your Agency <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Schedule a demo with our team"
              >
                <MessageSquare className="mr-2 h-5 w-5" aria-hidden="true" />
                Schedule Demo
              </Button>
            </div>

            {/* Sign In for Existing Agencies - Prominent on Mobile */}
            <div className="mb-6">
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?
                </p>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="w-full sm:w-auto focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Sign in to your existing Drena account"
                  >
                    <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                    Sign In to Your Agency
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Setup in minutes</span>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <a 
                href="#features" 
                onClick={(e) => handleSmoothScroll(e, "features")}
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="Learn more about features"
              >
                Learn More <ChevronDown className="inline h-4 w-4 ml-1" aria-hidden="true" />
              </a>
              <span className="text-muted-foreground">•</span>
              <Link 
                to="/pricing" 
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="View pricing plans"
              >
                View Pricing
              </Link>
              <span className="text-muted-foreground">•</span>
              <a 
                href="#faq" 
                onClick={(e) => handleSmoothScroll(e, "faq")}
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="View frequently asked questions"
              >
                FAQ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={featuresRef}
        className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8"
        aria-labelledby="features-heading"
      >
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 
              id="features-heading"
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed for modern agencies to manage projects, 
              teams, and finances in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`border-border transition-all duration-200 hover:border-primary/50 hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                  expandedFeature === index ? "border-primary/50 shadow-md" : ""
                }`}
                tabIndex={0}
                onKeyDown={(e) => handleFeatureKeyDown(e, index)}
                role="article"
                aria-expanded={expandedFeature === index}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <feature.icon 
                      className="h-12 w-12 text-primary flex-shrink-0" 
                      aria-hidden="true"
                    />
                    <button
                      onClick={() => setExpandedFeature(expandedFeature === index ? null : index)}
                      className="ml-auto p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={expandedFeature === index ? `Hide details for ${feature.title}` : `Show details for ${feature.title}`}
                      aria-expanded={expandedFeature === index}
                    >
                      <ChevronDown 
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          expandedFeature === index ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  {expandedFeature === index && (
                    <div 
                      className="mt-4 pt-4 border-t text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-2"
                      role="region"
                      aria-live="polite"
                    >
                      {feature.details}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/agency-signup">
              <Button 
                size="lg" 
                variant="outline"
                className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Start your free trial and explore all features"
              >
                Explore All Features <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section 
        id="benefits" 
        ref={benefitsRef}
        className="py-20 px-4 sm:px-6 lg:px-8"
        aria-labelledby="benefits-heading"
      >
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 
                id="benefits-heading"
                className="text-3xl sm:text-4xl font-bold mb-6"
              >
                Drive Measurable Results for Your Agency
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of agencies that have transformed their operations 
                and accelerated growth with Drena.
              </p>
              
              <ul className="space-y-4 mb-8" role="list">
                {benefits.map((benefit, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" 
                      aria-hidden="true"
                    />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/agency-signup" className="sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Start your free trial and see these benefits"
                  >
                    Create Your Agency <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
                <a 
                  href="#testimonials" 
                  onClick={(e) => handleSmoothScroll(e, "testimonials")}
                  className="sm:w-auto"
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Read customer testimonials"
                  >
                    Read Success Stories <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Button>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <Card className="text-center p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2" aria-label="40 percent">40%</div>
                <div className="text-sm text-muted-foreground">Faster Project Delivery</div>
              </Card>
              <Card className="text-center p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2" aria-label="60 percent">60%</div>
                <div className="text-sm text-muted-foreground">Reduced Admin Time</div>
              </Card>
              <Card className="text-center p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2" aria-label="500 plus">500+</div>
                <div className="text-sm text-muted-foreground">Happy Agencies</div>
              </Card>
              <Card className="text-center p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2" aria-label="99.9 percent">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime Guarantee</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        id="testimonials" 
        ref={testimonialsRef}
        className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8"
        aria-labelledby="testimonials-heading"
      >
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 
              id="testimonials-heading"
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground">
              See how agencies are transforming their operations with Drena
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                role="article"
              >
                <CardContent className="p-6">
                  <div 
                    className="flex mb-4" 
                    role="img" 
                    aria-label={`${testimonial.rating} out of 5 stars`}
                  >
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-5 w-5 fill-primary text-primary" 
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <blockquote className="text-foreground mb-6 leading-relaxed">
                    <p>"{testimonial.content}"</p>
                  </blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section 
        id="faq" 
        ref={faqRef}
        className="py-20 px-4 sm:px-6 lg:px-8"
        aria-labelledby="faq-heading"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 
              id="faq-heading"
              className="text-3xl sm:text-4xl font-bold mb-4 flex items-center justify-center gap-3"
            >
              <HelpCircle className="h-8 w-8 text-primary" aria-hidden="true" />
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Drena
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isExpanded = expandedFeature === index + 100; // Offset to avoid conflict with features
              return (
                <Card 
                  key={index}
                  className="border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                >
                  <CardContent className="p-6">
                    <button
                      onClick={() => setExpandedFeature(isExpanded ? null : index + 100)}
                      className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-ring rounded-md -m-2 p-2"
                      aria-expanded={isExpanded}
                      aria-controls={`faq-answer-${index}`}
                    >
                      <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                      <ChevronDown 
                        className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isExpanded && (
                      <div 
                        id={`faq-answer-${index}`}
                        className="mt-4 pt-4 border-t text-muted-foreground leading-relaxed animate-in slide-in-from-top-2"
                        role="region"
                        aria-live="polite"
                      >
                        {faq.answer}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline"
                className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Contact support via email"
              >
                <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                Contact Support
              </Button>
              <Link to="/agency-signup">
                <Button 
                  className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Start your free trial"
                >
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="cta-heading">
        <div className="container mx-auto">
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-12 text-center">
              <h2 
                id="cta-heading"
                className="text-3xl sm:text-4xl font-bold mb-4"
              >
                Ready to Transform Your Agency?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join the hundreds of agencies already using Drena to scale their operations and drive growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/agency-signup" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="w-full sm:w-auto focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary"
                    aria-label="Create your agency account now - Free trial"
                  >
                    Create Your Agency <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary"
                  aria-label="Schedule a personalized demo"
                >
                  <Calendar className="mr-2 h-5 w-5" aria-hidden="true" />
                  Schedule Demo
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-6">
                No credit card required • Cancel anytime • 14-day free trial
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4 sm:px-6 lg:px-8" role="contentinfo">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
                <span className="text-lg font-semibold">Drena</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The all-in-one platform for agency management and growth.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => handleSmoothScroll(e, "features")}
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <Link 
                    to="/pricing" 
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <a 
                    href="#testimonials" 
                    onClick={(e) => handleSmoothScroll(e, "testimonials")}
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a 
                    href="#faq" 
                    onClick={(e) => handleSmoothScroll(e, "faq")}
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="#" 
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
                  >
                    Community
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  <span>Enterprise Security</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>24/7 Support</span>
                </li>
                <li>
                  <a 
                    href="mailto:support@drena.com" 
                    className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Drena. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}