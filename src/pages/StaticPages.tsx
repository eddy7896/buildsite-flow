import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MapPin, Phone, Send, ArrowRight, Calendar, User, Clock, BookOpen, FileText, Shield, Cookie, Globe, Users, Briefcase, Code, FileCode, Layers, MessageCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#000000] text-white">
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/[0.06]">
      <nav className="max-w-[1120px] mx-auto px-6 h-[64px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">D</span>
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Haal</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>
    </header>
    <main className="pt-24 pb-16">
      {children}
    </main>
  </div>
);

export function ContactPage() {
  const [formState, setFormState] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em]">Get in Touch</h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-xl mx-auto">
            Have questions about Haal? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                <p className="text-zinc-400">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Company</label>
                  <input
                    type="text"
                    value={formState.company}
                    onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
                    placeholder="Acme Inc"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <Button type="submit" className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-medium rounded-xl">
                  Send Message
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="font-semibold text-white mb-4">Contact Information</h3>
              <div className="space-y-4">
                <a href="mailto:hello@Haal.io" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                  hello@Haal.io
                </a>
                <div className="flex items-center gap-3 text-zinc-400">
                  <Phone className="w-5 h-5" />
                  +91 98765 43210
                </div>
                <div className="flex items-start gap-3 text-zinc-400">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>WeWork, Bandra Kurla Complex<br />Mumbai, Maharashtra 400051</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
              <h3 className="font-semibold text-white mb-2">Enterprise Sales</h3>
              <p className="text-sm text-zinc-400 mb-4">Need a custom solution for your large team? Let's talk.</p>
              <Link to="/auth" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Schedule a demo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}

export function AboutPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-8">About Haal</h1>
          
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-xl text-zinc-400 leading-relaxed mb-8">
              Haal is the operating system for modern agencies. We help creative teams manage projects, track finances, automate workflows, and scale their businesses with one powerful, integrated platform.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 my-12">
              {[
                { number: '500+', label: 'Agencies' },
                { number: '10K+', label: 'Projects Managed' },
                { number: '₹50Cr+', label: 'Revenue Tracked' },
              ].map((stat) => (
                <div key={stat.label} className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-3xl font-semibold text-white">{stat.number}</div>
                  <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Our Mission</h2>
            <p className="text-zinc-400">
              To empower agencies worldwide with tools that simplify operations, enhance collaboration, and drive growth. We believe that great software should get out of the way and let creative teams focus on what they do best.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Our Story</h2>
            <p className="text-zinc-400">
              Founded in 2024, Haal was born from the frustration of managing an agency with disconnected tools. Our founders experienced firsthand the chaos of juggling spreadsheets, multiple apps, and manual processes. They set out to build something better—a unified platform designed specifically for how modern agencies work.
            </p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function BlogPage() {
  const posts = [
    { title: 'The Future of Agency Management', date: 'Dec 15, 2024', category: 'Industry', readTime: '5 min' },
    { title: 'How to Scale Your Agency Without Burning Out', date: 'Dec 10, 2024', category: 'Growth', readTime: '8 min' },
    { title: 'Financial Management Best Practices', date: 'Dec 5, 2024', category: 'Finance', readTime: '6 min' },
    { title: 'Project Management Tips for Remote Teams', date: 'Nov 28, 2024', category: 'Remote Work', readTime: '7 min' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Blog</h1>
          <p className="text-lg text-zinc-400 mb-12">Insights, tips, and stories from the Haal team.</p>

          <div className="space-y-6">
            {posts.map((post, i) => (
              <motion.article
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                  <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{post.category}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                </div>
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">{post.title}</h2>
              </motion.article>
            ))}
          </div>

          <p className="text-center text-zinc-500 mt-12">More posts coming soon...</p>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function CareersPage() {
  const positions = [
    { title: 'Senior Full-Stack Engineer', location: 'Remote / Mumbai', type: 'Full-time' },
    { title: 'Product Designer', location: 'Remote', type: 'Full-time' },
    { title: 'Customer Success Manager', location: 'Mumbai', type: 'Full-time' },
    { title: 'Technical Writer', location: 'Remote', type: 'Part-time' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">We're Hiring</span>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mt-4 mb-4">Join Our Team</h1>
          <p className="text-lg text-zinc-400 mb-12">Help us build the future of agency management.</p>

          <div className="space-y-4">
            {positions.map((job, i) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors group flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.type}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <h3 className="font-semibold text-white mb-2">Don't see a fit?</h3>
            <p className="text-sm text-zinc-400 mb-4">We're always looking for talented people. Send your resume to careers@Haal.io</p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function HelpCenterPage() {
  const categories = [
    { icon: BookOpen, title: 'Getting Started', description: 'Learn the basics of Haal', articles: 12 },
    { icon: Users, title: 'Team Management', description: 'Managing your team effectively', articles: 8 },
    { icon: FileText, title: 'Billing & Invoicing', description: 'Financial features guide', articles: 15 },
    { icon: Code, title: 'API & Integrations', description: 'Developer documentation', articles: 10 },
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Help Center</h1>
          <p className="text-lg text-zinc-400">Find answers to common questions and learn how to use Haal.</p>
          
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors cursor-pointer group"
            >
              <cat.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{cat.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">{cat.description}</p>
              <p className="text-xs text-zinc-600 mt-3">{cat.articles} articles</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
          <MessageCircle className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">Still need help?</h3>
          <p className="text-sm text-zinc-400 mb-4">Our support team is here to help you.</p>
          <Link to="/contact">
            <Button className="bg-white text-black hover:bg-zinc-200 font-medium rounded-xl">Contact Support</Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}

export function DocsPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Documentation</h1>
          <p className="text-lg text-zinc-400 mb-12">Everything you need to know about using Haal.</p>

          <div className="space-y-8">
            {[
              { title: 'Quick Start Guide', items: ['Creating your agency', 'Inviting team members', 'Setting up projects'] },
              { title: 'Project Management', items: ['Creating projects', 'Task management', 'Time tracking', 'Milestones'] },
              { title: 'Financial Management', items: ['Invoicing', 'Expense tracking', 'GST compliance', 'Reports'] },
            ].map((section) => (
              <div key={section.title} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <h2 className="text-xl font-semibold text-white mb-4">{section.title}</h2>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                      <FileText className="w-4 h-4" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function APIReferencePage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">API Reference</h1>
          <p className="text-lg text-zinc-400 mb-8">Build integrations with the Haal API.</p>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-8">
            <p className="text-sm text-blue-400">Base URL: <code className="bg-black/30 px-2 py-1 rounded">https://api.Haal.io/v1</code></p>
          </div>

          <div className="space-y-4">
            {[
              { method: 'GET', endpoint: '/projects', description: 'List all projects' },
              { method: 'POST', endpoint: '/projects', description: 'Create a new project' },
              { method: 'GET', endpoint: '/clients', description: 'List all clients' },
              { method: 'GET', endpoint: '/invoices', description: 'List all invoices' },
            ].map((api) => (
              <div key={api.endpoint} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs font-mono ${api.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {api.method}
                </span>
                <code className="text-sm text-white font-mono">{api.endpoint}</code>
                <span className="text-sm text-zinc-500 ml-auto">{api.description}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-semibold tracking-[-0.02em]">Privacy Policy</h1>
          </div>
          <p className="text-sm text-zinc-500 mb-8">Last updated: December 1, 2024</p>

          <div className="prose prose-invert prose-zinc max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
              <p className="text-zinc-400">We collect information you provide directly to us, including name, email, company information, and usage data to improve our services.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <p className="text-zinc-400">We use collected information to provide, maintain, and improve our services, communicate with you, and ensure security.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
              <p className="text-zinc-400">We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular audits.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Your Rights</h2>
              <p className="text-zinc-400">You have the right to access, correct, or delete your personal data. Contact us at privacy@Haal.io for any requests.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function TermsPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-semibold tracking-[-0.02em]">Terms of Service</h1>
          </div>
          <p className="text-sm text-zinc-500 mb-8">Last updated: December 1, 2024</p>

          <div className="prose prose-invert prose-zinc max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-zinc-400">By accessing or using Haal, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Use of Service</h2>
              <p className="text-zinc-400">You agree to use the service only for lawful purposes and in accordance with these terms. You are responsible for maintaining the security of your account.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Subscription and Payment</h2>
              <p className="text-zinc-400">Paid features require a subscription. Payments are non-refundable except as required by law. We may change pricing with 30 days notice.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Termination</h2>
              <p className="text-zinc-400">We may terminate or suspend your account for violations of these terms. You may cancel your subscription at any time.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function CookiePolicyPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <Cookie className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-semibold tracking-[-0.02em]">Cookie Policy</h1>
          </div>
          <p className="text-sm text-zinc-500 mb-8">Last updated: December 1, 2024</p>

          <div className="prose prose-invert prose-zinc max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">What Are Cookies</h2>
              <p className="text-zinc-400">Cookies are small text files stored on your device that help us improve your experience and understand how our service is used.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Types of Cookies We Use</h2>
              <ul className="list-disc list-inside text-zinc-400 space-y-2">
                <li><strong className="text-white">Essential:</strong> Required for the service to function</li>
                <li><strong className="text-white">Analytics:</strong> Help us understand usage patterns</li>
                <li><strong className="text-white">Preferences:</strong> Remember your settings</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Managing Cookies</h2>
              <p className="text-zinc-400">You can control cookies through your browser settings. Disabling certain cookies may affect functionality.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function GDPRPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-semibold tracking-[-0.02em]">GDPR Compliance</h1>
          </div>
          <p className="text-sm text-zinc-500 mb-8">Last updated: December 1, 2024</p>

          <div className="prose prose-invert prose-zinc max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Our Commitment</h2>
              <p className="text-zinc-400">Haal is committed to GDPR compliance and protecting the privacy rights of EU citizens.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Your Rights Under GDPR</h2>
              <ul className="list-disc list-inside text-zinc-400 space-y-2">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Data Protection Officer</h2>
              <p className="text-zinc-400">Contact our DPO at dpo@Haal.io for any GDPR-related inquiries.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function ChangelogPage() {
  const releases = [
    { version: '2.1.0', date: 'Dec 10, 2024', changes: ['New dashboard widgets', 'Improved project templates', 'Bug fixes'] },
    { version: '2.0.0', date: 'Nov 15, 2024', changes: ['Complete UI redesign', 'New reporting engine', 'API v2 launch'] },
    { version: '1.9.0', date: 'Oct 20, 2024', changes: ['GST compliance features', 'Multi-currency support', 'Performance improvements'] },
  ];

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Changelog</h1>
          <p className="text-lg text-zinc-400 mb-12">See what's new in Haal.</p>

          <div className="space-y-8">
            {releases.map((release, i) => (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-8 border-l border-white/[0.06]"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500" />
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-lg font-semibold text-white">v{release.version}</span>
                  <span className="text-sm text-zinc-500">{release.date}</span>
                </div>
                <ul className="space-y-2">
                  {release.changes.map((change) => (
                    <li key={change} className="text-zinc-400">• {change}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function RoadmapPage() {
  const items = [
    { status: 'done', title: 'Multi-currency Support', description: 'Handle invoices in multiple currencies' },
    { status: 'progress', title: 'Mobile App', description: 'Native iOS and Android apps' },
    { status: 'planned', title: 'AI-Powered Insights', description: 'Smart recommendations for your agency' },
    { status: 'planned', title: 'White-label Solution', description: 'Custom branding for your clients' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Roadmap</h1>
          <p className="text-lg text-zinc-400 mb-12">See what we're building next.</p>

          <div className="space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="flex items-start gap-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.status === 'progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {item.status === 'done' ? 'Shipped' : item.status === 'progress' ? 'In Progress' : 'Planned'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function IntegrationsPage() {
  const integrations = [
    { name: 'Slack', category: 'Communication', status: 'Available' },
    { name: 'Google Calendar', category: 'Productivity', status: 'Available' },
    { name: 'Stripe', category: 'Payments', status: 'Available' },
    { name: 'QuickBooks', category: 'Accounting', status: 'Coming Soon' },
    { name: 'Zapier', category: 'Automation', status: 'Available' },
    { name: 'Figma', category: 'Design', status: 'Coming Soon' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Integrations</h1>
          <p className="text-lg text-zinc-400 mb-12">Connect Haal with your favorite tools.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((int, i) => (
              <motion.div
                key={int.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 mb-4" />
                <h3 className="font-semibold text-white">{int.name}</h3>
                <p className="text-xs text-zinc-500 mt-1">{int.category}</p>
                <span className={`inline-block mt-3 text-xs px-2 py-1 rounded ${
                  int.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {int.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function TemplatesPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Templates</h1>
          <p className="text-lg text-zinc-400 mb-12">Get started quickly with pre-built templates.</p>

          <div className="grid sm:grid-cols-2 gap-6">
            {['Project Plan', 'Invoice Template', 'Client Brief', 'Meeting Notes'].map((template, i) => (
              <motion.div
                key={template}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors cursor-pointer group"
              >
                <Layers className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{template}</h3>
                <p className="text-sm text-zinc-500 mt-2">Ready-to-use template to get you started.</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function CommunityPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Community</h1>
          <p className="text-lg text-zinc-400 mb-12 max-w-xl mx-auto">Join thousands of agency professionals sharing tips, tricks, and best practices.</p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a href="https://discord.gg/Haal" target="_blank" rel="noopener noreferrer" className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors group">
              <h3 className="font-semibold text-white mb-2 flex items-center justify-center gap-2">Discord <ExternalLink className="w-4 h-4" /></h3>
              <p className="text-sm text-zinc-400">Chat with the community in real-time</p>
            </a>
            <a href="https://github.com/Haal" target="_blank" rel="noopener noreferrer" className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors group">
              <h3 className="font-semibold text-white mb-2 flex items-center justify-center gap-2">GitHub <ExternalLink className="w-4 h-4" /></h3>
              <p className="text-sm text-zinc-400">Contribute to our open-source projects</p>
            </a>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export function PressPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">Press</h1>
          <p className="text-lg text-zinc-400 mb-12">Media resources and company news.</p>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-8">
            <h3 className="font-semibold text-white mb-4">Press Contact</h3>
            <p className="text-zinc-400 mb-2">For media inquiries, please contact:</p>
            <a href="mailto:press@Haal.io" className="text-blue-400 hover:text-blue-300">press@Haal.io</a>
          </div>

          <h2 className="text-xl font-semibold text-white mb-4">Brand Assets</h2>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-zinc-400 mb-4">Download our logo, screenshots, and brand guidelines.</p>
            <Button className="bg-white text-black hover:bg-zinc-200">Download Press Kit</Button>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
