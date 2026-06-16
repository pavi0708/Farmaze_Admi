
import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Leaf,
  Award,
  Users,
  TrendingUp,
  Truck,
  Brain,
  MessageSquare,
  BarChart3,
  Zap,
  Target,
  ShieldCheck,
  IndianRupee,
} from "lucide-react";
import FadeInSection from "@/components/ui/FadeInSection";

const stats = [
  { value: "20+", label: "B2B Clients", icon: Users },
  { value: "2+", label: "Years of Data", icon: BarChart3 },
  { value: "₹4 CR", label: "Revenue Processed", icon: IndianRupee },
  { value: "16.1%", label: "Gross Profit", icon: TrendingUp },
];

const howItWorks = [
  {
    step: "01",
    title: "Order Effortlessly",
    description:
      "Paste a text list, snap a photo, or chat on WhatsApp. Our AI matches your items to products instantly — no manual searching.",
    icon: MessageSquare,
  },
  {
    step: "02",
    title: "AI Does the Heavy Lifting",
    description:
      "Demand forecasting predicts what you need. Waste intelligence flags over-ordering. Smart suggestions learn your patterns.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Fresh Delivery, Every Morning",
    description:
      "Farm-sourced produce delivered to your kitchen before service starts. Track orders, view invoices, manage branches — all in one place.",
    icon: Truck,
  },
];

const values = [
  {
    title: "Farm-Fresh Quality",
    description:
      "Direct sourcing from farms across Tamil Nadu. No cold storage middlemen — produce reaches you within hours of harvest.",
    icon: Leaf,
    color: "bg-emerald-500",
  },
  {
    title: "AI-Powered Intelligence",
    description:
      "Per-client demand forecasting, waste detection, and smart reordering. Technology that learns your business, not generic averages.",
    icon: Zap,
    color: "bg-amber-500",
  },
  {
    title: "Built for HoReCa",
    description:
      "Purpose-built for hotels, restaurants, and catering. Multi-branch support, bulk ordering, and WhatsApp integration your team will actually use.",
    icon: Target,
    color: "bg-blue-500",
  },
  {
    title: "Transparent Pricing",
    description:
      "No hidden markups. Real-time price tracking, historical comparisons, and cost analytics so you know exactly where your money goes.",
    icon: ShieldCheck,
    color: "bg-purple-500",
  },
];

const differentiators = [
  "Multi-channel ordering: WhatsApp, Chat, Web, Image OCR",
  "Per-client AI — learns your naming conventions and patterns",
  "7-day demand forecasting with Prophet ML",
  "Waste intelligence with real-time over-ordering alerts",
  "Morning forecast push via WhatsApp",
  "POS integration roadmap (PetPooja)",
];

const About = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-farmaze-green/5 via-white to-emerald-50 py-20 md:py-32">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-farmaze-green/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <FadeInSection>
                <span className="inline-block px-4 py-1.5 bg-farmaze-green/10 text-farmaze-green text-sm font-medium rounded-full mb-6">
                  B2B Fresh Produce Platform
                </span>
              </FadeInSection>
              <FadeInSection delay={100}>
                <h1 className="text-4xl md:text-6xl font-bold font-playfair mb-6 tracking-tight text-gray-900">
                  Fresh From Farm,
                  <br />
                  <span className="text-farmaze-green">Smart For Business</span>
                </h1>
              </FadeInSection>
              <FadeInSection delay={200}>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  FarmAze is India's AI-powered B2B procurement platform for
                  HoReCa. We combine farm-direct sourcing with demand
                  intelligence to cut waste, save costs, and simplify ordering.
                </p>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-gray-900 py-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <FadeInSection key={stat.label} delay={i * 100} direction="none">
                  <div className="text-center">
                    <stat.icon className="mx-auto mb-2 text-farmaze-green" size={24} />
                    <div className="text-3xl md:text-4xl font-bold text-white font-playfair">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-farmaze-green/30" />
                  <span className="text-farmaze-green font-medium text-sm uppercase tracking-widest">
                    Our Story
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-farmaze-green/30" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-8 text-center text-gray-900">
                  From One Kitchen to 20+ Businesses
                </h2>
                <div className="grid md:grid-cols-2 gap-8 text-gray-600 leading-relaxed">
                  <div>
                    <p className="mb-4">
                      FarmAze started in 2020 in Chennai with a simple
                      frustration: restaurants were overpaying for produce that
                      wasn't even fresh. The supply chain was broken — too many
                      middlemen, zero transparency, and ordering meant phone
                      calls at 5 AM.
                    </p>
                    <p>
                      We built a direct connection between Tamil Nadu farms and
                      HoReCa kitchens. No cold storage delays. No price
                      opacity. Just fresh produce delivered before the first
                      service of the day.
                    </p>
                  </div>
                  <div>
                    <p className="mb-4">
                      But sourcing was only half the problem. Restaurants waste
                      8-12% of produce from over-ordering. They repeat the same
                      orders without thinking about demand patterns. They have
                      no data to negotiate better.
                    </p>
                    <p>
                      So we built AI on top. Two years of daily per-client
                      order data feeds our forecasting, waste detection, and
                      smart ordering engine. Every restaurant gets personalized
                      intelligence — not generic industry averages.
                    </p>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-4 text-center text-gray-900">
                How It Works
              </h2>
              <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
                From order to delivery in three simple steps
              </p>
            </FadeInSection>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {howItWorks.map((item, i) => (
                <FadeInSection key={item.step} delay={i * 150}>
                  <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-5xl font-bold font-playfair text-farmaze-green/15">
                        {item.step}
                      </span>
                      <div className="bg-farmaze-green/10 w-10 h-10 rounded-xl flex items-center justify-center">
                        <item.icon className="text-farmaze-green" size={20} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* Values / Why Farmaze */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-4 text-center text-gray-900">
                Why FarmAze
              </h2>
              <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
                Built different from the ground up
              </p>
            </FadeInSection>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {values.map((item, i) => (
                <FadeInSection key={item.title} delay={i * 100}>
                  <div className="flex gap-5 p-6 rounded-2xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
                    <div
                      className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <item.icon className="text-white" size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 leading-relaxed text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* What Sets Us Apart */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-4 text-center text-white">
                  What Sets Us Apart
                </h2>
                <p className="text-gray-400 text-center mb-12">
                  Features no other B2B produce platform in India offers
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {differentiators.map((item, i) => (
                    <FadeInSection key={i} delay={i * 80} direction="none">
                      <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="w-6 h-6 rounded-full bg-farmaze-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-farmaze-green" />
                        </div>
                        <span className="text-gray-200 text-sm leading-relaxed">
                          {item}
                        </span>
                      </div>
                    </FadeInSection>
                  ))}
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-white">
          <FadeInSection>
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-4 text-gray-900">
                Ready to Transform Your Procurement?
              </h2>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                Join 20+ restaurants and hotels in Chennai who've switched to
                smarter, fresher, AI-powered procurement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/916369724626?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20FarmAze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-farmaze-green hover:bg-farmaze-green/90 text-white px-8 py-3.5 rounded-xl font-medium transition-colors"
                >
                  <MessageSquare size={18} />
                  Chat on WhatsApp
                </a>
                <a
                  href="mailto:farmaze.official@gmail.com"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-farmaze-green/30 text-gray-700 hover:text-farmaze-green px-8 py-3.5 rounded-xl font-medium transition-colors"
                >
                  Get in Touch
                </a>
              </div>
            </div>
          </FadeInSection>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
