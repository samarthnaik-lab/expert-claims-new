import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Shield, Users, ArrowRight, Star } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features-section");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  const leaders = [
    {
      img: "/leaders/vinaya_kumar_n.png",
      title: "Vinaya Kumar N",
      desc: "MD & CEO – Driving vision and strategy at Expert Claim Solutions.",
      bgPos: "center 20%", // lift face a bit
    },
    {
      img: "/leaders/sankaraiah_ch.png",
      title: "Sankaraiah Ch",
      desc: "Director – Bringing leadership and operational excellence.",
      bgPos: "center 50%",
    },
    {
      img: "/leaders/santosh_choubey.png",
      title: "Santosh Choubey",
      desc: "Director – Focused on growth and client success initiatives.",
      bgPos: "center 25%",
    },
    {
      img: "/leaders/prakash_pss.png",
      title: "Prakash P S S",
      desc: "Director & COO – Managing operations and ensuring efficient service delivery.",
      bgPos: "center 20%",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Modern Header */}
      <header className="bg-white backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div> */}
              <div>
                <img src="/leaders/logo.jpeg" alt="ExpertClaims" className="w-48" />
              </div>
            </div>
            <Button
              onClick={() => {
                console.log("Login button clicked");
                navigate("/login");
              }}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              Login to Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Animated Elements */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16 text-center relative">
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-emerald-400/20 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          <div className="relative z-10 animate-fade-in">

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-primary-500 to-emerald-500 bg-clip-text text-transparent">
                ExpertClaims
              </span>
            </h1>

            <h2 className="text-2xl md:text-3xl font-semibold text-primary-600 mb-8">
              Experts in Insurance Claim Recovery
            </h2>

            <p className="relative text-lg md:text-xl text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed text-center px-6">
              <span className="block text-2xl md:text-3xl font-bold text-primary-600 mb-4">
                Turning Insurance Challenges into Triumphs!
              </span>
              Our vision is to be the{" "}
              <span className="font-semibold text-primary-500">
                leading and most trusted partner{" "}
              </span>
              for our clients in their journey of claims process. With our
              unwavering commitment to
              <span className="font-semibold">
                {" "}
                customer satisfaction, innovation, and excellence
              </span>{" "}
              in the industry, we deliver{" "}
              <span className="font-semibold text-emerald-500">
                efficient, transparent, compassionate, and fair solutions{" "}
              </span>
              to ensure that our clients receive the compensation they
              rightfully deserve.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => {
                  console.log("Get Started Today button clicked");
                  navigate("/login");
                }}
                size="lg"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToFeatures}
                className="border-2 border-gray-300 hover:border-primary-500 px-8 py-4 text-lg rounded-xl transition-all duration-300 font-semibold"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Feature Cards */}
        <div
          id="features-section"
          className="grid md:grid-cols-3 gap-8 pb-20 animate-slide-up"
        >
          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 card-hover bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Expert Review
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our specialists analyze your rejected claims with deep
                  industry knowledge to identify strong recovery opportunities
                  and strategic approaches.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 card-hover bg-gradient-to-br from-white to-primary-50/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Legal Escalation
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  When standard appeals fail, we escalate to ombudsman and legal
                  levels with experienced attorneys to maximize your recovery
                  potential.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 card-hover bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Client Success
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Dedicated support team provides transparent communication and
                  regular updates throughout your entire claim recovery journey.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        {/* <div className="py-16 text-center border-t border-gray-200/50 animate-fade-in">
          <p className="text-gray-500 font-semibold mb-8">
            Trusted by leading insurance professionals
          </p> */}
        {/* <div className="flex justify-center items-center space-x-12 opacity-50"> */}
        {/* Placeholder for partner logos */}
        {/* <div className="w-24 h-12 bg-gray-200 rounded-lg"></div>
            <div className="w-24 h-12 bg-gray-200 rounded-lg"></div>
            <div className="w-24 h-12 bg-gray-200 rounded-lg"></div>
            <div className="w-24 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div> */}
        {/* Expert Claim Solutions Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white rounded-2xl shadow-lg animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            About Expert Claim Solutions
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed text-center">
            Expert Claim Solutions specializes in helping clients overturn
            denied insurance claims with services such as initial assessments,
            documentation review, insurer negotiations, and legal assistance.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {leaders.map((item, idx) => (
              <Card
                key={idx}
                className="shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-0">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-56 object-cover rounded-t-lg"
                  />
                  <div className="p-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={() =>
                window.open("https://www.expertinsuranceclaims.com/", "_blank")
              }
              className="relative overflow-hidden px-8 py-4 text-lg font-semibold rounded-xl 
               bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-lg 
               hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">
                Visit Expert Claim Solutions
              </span>
              <span className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 hover:opacity-100 transition" />
            </Button>
          </div>
        </section>

        <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-20">
            {/* About Section */}
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6 animate-fade-in">
                Who We Are
              </h2>
              <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed animate-slide-up">
                We are a team of dedicated insurance professionals combining{" "}
                <span className="font-semibold text-primary-600">legal</span>,
                <span className="font-semibold text-emerald-600">
                  {" "}
                  technical
                </span>
                , and{" "}
                <span className="font-semibold text-primary-600">
                  industry expertise
                </span>
                to simplify your claims journey. From documentation and
                negotiations to legal escalation, we ensure
                <span className="font-semibold text-emerald-600">
                  {" "}
                  fair and timely resolutions
                </span>
                .
              </p>
            </div>

            {/* Why Choose Us */}
            <div>
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
                Why Choose Us?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Personalized Approach",
                    desc: "Every claim is unique — we tailor our services precisely to your case.",
                    icon: "💡",
                  },
                  {
                    title: "Expertise You Can Trust",
                    desc: "Our team blends insurance, legal, and technical knowledge to give you the best chance of recovery.",
                    icon: "⚖️",
                  },
                  {
                    title: "Transparent & Ethical",
                    desc: "Integrity, transparency, and regular updates throughout your claims journey.",
                    icon: "✅",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div>
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
                Frequently Asked Questions
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    q: "Why do insurers deny claims?",
                    a: "Common reasons include incomplete documentation, policy errors, or non-compliance with procedures.",
                  },
                  {
                    q: "What documents do you need?",
                    a: "ID, policy papers, submitted claims, rejection letters, correspondence, and relevant reports.",
                  },
                  {
                    q: "Do you represent insurers?",
                    a: "No, we exclusively represent policyholders — never the insurance companies.",
                  },
                ].map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-md p-6 hover:shadow-xl transition"
                  >
                    <h3 className="font-semibold text-lg text-primary-600 mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-gradient-to-r from-primary-500 to-emerald-500 text-white text-center rounded-3xl shadow-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Need Help with Your Claim?
              </h2>
              <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
                Reach out for a detailed review and professional assistance.
                Call us at <span className="font-semibold">9985060600</span> or
                email{" "}
                <span className="font-semibold">
                  support@expertclaims.co.in
                </span>
                .
              </p>
              <Button
                onClick={() =>
                  window.open(
                    "https://www.expertinsuranceclaims.com/contact",
                    "_blank"
                  )
                }
                size="lg"
                className="bg-white text-primary-600 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                Contact Us Now
              </Button>
              <div className="mt-8 text-sm text-white/80 space-y-2">
                <p>
                  <strong>Hyderabad:</strong> Plot no: 12, Road no: 1,
                  Dharmareddy Colony, Kukatpally.
                </p>
                <p>
                  <strong>Delhi:</strong> MyDesk Co-Working, KG Marg, New Delhi.
                </p>
                <p>
                  <strong>Mumbai:</strong> Mumbai Coworks, Times Square, Andheri
                  East.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
