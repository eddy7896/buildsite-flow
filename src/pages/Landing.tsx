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
  Zap,
  Crown,
  Rocket
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";
import dashboardImage from "@/assets/dashboard-mockup.jpg";
import teamImage from "@/assets/team-collaboration.jpg";
import analyticsImage from "@/assets/growth-analytics.jpg";

export default function Landing() {
  const features = [
    {
      icon: Building2,
      title: "Project Management",
      description: "Streamline your construction projects from start to finish with powerful project tracking and collaboration tools."
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
      description: "Optimize resource allocation and scheduling to maximize efficiency and minimize downtime across all projects."
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

  const pricingPlans = [
    {
      name: "Starter",
      price: 29,
      description: "Perfect for small construction teams",
      icon: Building2,
      features: [
        "Up to 5 team members",
        "3 active projects", 
        "Basic project management",
        "Time tracking",
        "Email support",
        "Mobile app access"
      ],
      popular: false
    },
    {
      name: "Professional", 
      price: 79,
      description: "Ideal for growing construction agencies",
      icon: Rocket,
      features: [
        "Up to 25 team members",
        "Unlimited projects",
        "Advanced project management",
        "Financial management",
        "Custom reports",
        "Priority support",
        "API access",
        "Advanced integrations"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: 149,
      description: "For large construction organizations",
      icon: Crown,
      features: [
        "Unlimited team members",
        "Unlimited projects",
        "Full ERP capabilities",
        "Advanced analytics",
        "Custom workflows",
        "Dedicated support",
        "On-premise deployment",
        "Custom integrations",
        "White-label options"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "Metropolitan Construction",
      role: "Project Manager",
      content: "BuildFlow transformed how we manage our projects. We've seen a 35% improvement in delivery times and our team collaboration has never been better.",
      rating: 5
    },
    {
      name: "Michael Chen", 
      company: "Urban Development Corp",
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
          <div className="flex h-16 items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-xl font-bold">BuildFlow</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors hover-scale">Features</a>
              <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors hover-scale">Benefits</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors hover-scale">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors hover-scale">Testimonials</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex hover-scale">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="hover-scale">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <Badge variant="secondary" className="mb-6 hover-scale">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trusted by 500+ Construction Agencies
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Accelerate Your Agency's 
                <span className="text-primary block animate-pulse">Growth & Success</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                BuildFlow is the all-in-one construction ERP platform that streamlines operations, 
                boosts team productivity, and scales your business faster than ever before.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-start items-start">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto hover-scale">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto hover-scale">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Schedule Demo
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Free 14-day trial • No credit card required • Setup in minutes
              </p>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <img 
                src={heroImage} 
                alt="Construction team using BuildFlow"
                className="relative z-10 rounded-2xl shadow-2xl w-full hover-scale transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Scale</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for construction agencies to manage projects, 
              teams, and finances in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-primary/50 transition-all duration-300 hover-scale group animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
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
            <div className="animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Drive Measurable Results for Your Agency
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of construction agencies that have transformed their operations 
                and accelerated growth with BuildFlow.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link to="/auth">
                  <Button size="lg" className="hover-scale">
                    Start Your Growth Journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 animate-scale-in">
              <div className="space-y-6">
                <Card className="text-center p-6 hover-scale transition-transform duration-300">
                  <div className="text-3xl font-bold text-primary mb-2">40%</div>
                  <div className="text-sm text-muted-foreground">Faster Project Delivery</div>
                </Card>
                <Card className="text-center p-6 hover-scale transition-transform duration-300">
                  <div className="text-3xl font-bold text-primary mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Agencies</div>
                </Card>
                <img 
                  src={teamImage} 
                  alt="Team collaboration" 
                  className="rounded-lg shadow-lg hover-scale transition-transform duration-500"
                />
              </div>
              <div className="space-y-6 pt-12">
                <img 
                  src={analyticsImage} 
                  alt="Growth analytics" 
                  className="rounded-lg shadow-lg hover-scale transition-transform duration-500"
                />
                <Card className="text-center p-6 hover-scale transition-transform duration-300">
                  <div className="text-3xl font-bold text-primary mb-2">60%</div>
                  <div className="text-sm text-muted-foreground">Reduced Admin Time</div>
                </Card>
                <Card className="text-center p-6 hover-scale transition-transform duration-300">
                  <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime Guarantee</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your construction agency. Start free and scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-border hover:border-primary/50 transition-all duration-300 hover-scale animate-fade-in ${
                  plan.popular 
                    ? 'ring-2 ring-primary shadow-lg scale-105' 
                    : ''
                }`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <plan.icon className={`h-12 w-12 mx-auto mb-4 ${plan.popular ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/auth" className="w-full">
                    <Button 
                      className={`w-full hover-scale ${
                        plan.popular 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.popular ? 'Start Free Trial' : 'Get Started'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 animate-fade-in">
            <p className="text-muted-foreground mb-4">All plans include 14-day free trial • No setup fees • Cancel anytime</p>
            <Button variant="outline" className="hover-scale">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Sales for Custom Enterprise Solutions
            </Button>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">See BuildFlow in Action</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get a glimpse of our powerful dashboard that puts all your construction management tools in one place.
            </p>
          </div>
          
          <div className="relative max-w-5xl mx-auto animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <img 
              src={dashboardImage} 
              alt="BuildFlow Dashboard Preview"
              className="relative z-10 rounded-2xl shadow-2xl w-full hover-scale transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-muted-foreground">
              See how construction agencies are transforming their operations with BuildFlow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border hover:border-primary/50 transition-all duration-300 hover-scale animate-fade-in" style={{animationDelay: `${index * 0.2}s`}}>
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
          <Card className="bg-primary text-primary-foreground border-0 animate-scale-in">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Transform Your Agency?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join the hundreds of construction agencies already using BuildFlow to scale their operations and drive growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto hover-scale">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-primary hover-scale">
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
          <div className="flex flex-col md:flex-row justify-between items-center animate-fade-in">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-primary animate-pulse" />
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