import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Building2, 
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
  Zap,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const features = [
    {
      icon: Target,
      title: "Project Management",
      description: "Streamline your projects from start to finish with powerful tracking, collaboration tools, and milestone management."
    },
    {
      icon: Users,
      title: "Team Management", 
      description: "Efficiently manage your workforce with advanced HR tools, attendance tracking, and performance monitoring."
    },
    {
      icon: DollarSign,
      title: "Financial Control",
      description: "Take control of your finances with comprehensive invoicing, payments, and accounting management systems."
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Make data-driven decisions with powerful reporting and analytics that give you insights into every aspect of your business."
    },
    {
      icon: Calendar,
      title: "Resource Planning",
      description: "Optimize resource allocation and scheduling to maximize efficiency and minimize downtime across all operations."
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Centralize all your project documents, contracts, and files in one secure, easily accessible location."
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
      content: "BuildFlow transformed how we manage our projects. We've seen a 35% improvement in delivery times and our team collaboration has never been better.",
      rating: 5
    },
    {
      name: "Michael Chen", 
      company: "Digital Marketing Pro",
      role: "CEO",
      content: "The financial management features alone have saved us countless hours. The real-time reporting gives us the insights we need to make better business decisions.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BuildFlow</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trusted by 500+ Agencies Worldwide
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Accelerate Your Agency's 
              <span className="text-primary block">Growth & Success</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              BuildFlow is the all-in-one business management platform that streamlines operations, 
              boosts team productivity, and scales your agency faster than ever before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <MessageSquare className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Free 14-day trial • No credit card required • Setup in minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Scale</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed for modern agencies to manage projects, 
              teams, and finances in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Drive Measurable Results for Your Agency
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of agencies that have transformed their operations 
                and accelerated growth with BuildFlow.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link to="/auth">
                  <Button size="lg">
                    Start Your Growth Journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">40%</div>
                <div className="text-sm text-muted-foreground">Faster Project Delivery</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">60%</div>
                <div className="text-sm text-muted-foreground">Reduced Admin Time</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Happy Agencies</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime Guarantee</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-muted-foreground">
              See how agencies are transforming their operations with BuildFlow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Transform Your Agency?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join the hundreds of agencies already using BuildFlow to scale their operations and drive growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-primary">
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">BuildFlow</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>© 2024 BuildFlow. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <Shield className="h-4 w-4" />
                <span>Enterprise Security</span>
                <Clock className="h-4 w-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}