import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, HelpCircle, FileText, Clock, DollarSign, Phone, Mail, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const CustomerFAQ = () => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqData: FAQItem[] = [
    // General Questions
    {
      id: 1,
      question: "What is ExpertClaims and how can it help me?",
      answer: "ExpertClaims is a professional insurance claim recovery service that helps policyholders maximize their insurance settlements. We have experienced professionals who understand insurance policies, documentation requirements, and negotiation tactics to ensure you receive the full compensation you're entitled to.",
      category: "general"
    },
    {
      id: 2,
      question: "How much does your service cost?",
      answer: "We work on a success-based fee structure. We only charge a percentage of the additional amount we recover for you above what the insurance company initially offered. If we don't get you more money, you don't pay us anything.",
      category: "general"
    },
    {
      id: 3,
      question: "What types of insurance claims do you handle?",
      answer: "We handle all types of insurance claims including health insurance, vehicle insurance, property insurance, life insurance, travel insurance, and more. Our team has expertise across various insurance sectors.",
      category: "general"
    },

    // Process Questions
    {
      id: 4,
      question: "How long does the claim recovery process take?",
      answer: "The timeline varies depending on the complexity of your case and the insurance company's response time. Simple cases may be resolved in 2-4 weeks, while complex cases can take 2-6 months. We'll keep you updated throughout the process.",
      category: "process"
    },
    {
      id: 5,
      question: "What documents do I need to provide?",
      answer: "You'll need to provide your insurance policy documents, claim forms, medical records (for health claims), police reports (for vehicle claims), damage assessments, and any correspondence with the insurance company. Our team will guide you on specific requirements.",
      category: "process"
    },
    {
      id: 6,
      question: "Can I track the progress of my claim?",
      answer: "Yes! You can track your claim progress through our customer portal. You'll receive regular updates on case status, document requirements, and any developments in your claim recovery process.",
      category: "process"
    },

    // Communication Questions
    {
      id: 7,
      question: "How can I contact my assigned agent?",
      answer: "You can contact your assigned agent through multiple channels: phone, email, or through the messaging system in your customer portal. Your agent's contact details are provided in your claim details page.",
      category: "communication"
    },
    {
      id: 8,
      question: "How often will I receive updates?",
      answer: "We provide regular updates at key milestones in your case. You'll receive notifications when documents are received, when we submit your case, when the insurance company responds, and when there are any significant developments.",
      category: "communication"
    },
    {
      id: 9,
      question: "Can I upload additional documents online?",
      answer: "Yes! You can upload additional documents through your customer portal. Simply go to the 'Upload Documents' section and follow the instructions. This helps us process your claim faster.",
      category: "communication"
    },

    // Payment Questions
    {
      id: 10,
      question: "When do I pay for your services?",
      answer: "You only pay us after we successfully recover additional compensation for you. Our fee is calculated as a percentage of the additional amount recovered, and payment is due only after you receive your settlement.",
      category: "payment"
    },
    {
      id: 11,
      question: "What if the insurance company doesn't increase their offer?",
      answer: "If we cannot secure additional compensation for you, you owe us nothing. Our success-based fee structure ensures you only pay when we deliver results.",
      category: "payment"
    },
    {
      id: 12,
      question: "Are there any hidden fees or charges?",
      answer: "No, there are no hidden fees. Our fee structure is transparent and clearly explained upfront. We only charge a percentage of the additional amount we recover for you.",
      category: "payment"
    },

    // Technical Questions
    {
      id: 13,
      question: "How do I access my customer portal?",
      answer: "You can access your customer portal by logging in with your registered email and password. If you've forgotten your password, you can reset it using the 'Forgot Password' option on the login page.",
      category: "technical"
    },
    {
      id: 14,
      question: "What if I can't upload documents?",
      answer: "If you're having trouble uploading documents, please contact our technical support team. You can also email the documents directly to your assigned agent or call our support line for assistance.",
      category: "technical"
    },
    {
      id: 15,
      question: "Is my information secure?",
      answer: "Yes, we take data security very seriously. All your personal and claim information is encrypted and stored securely. We comply with all relevant data protection regulations and never share your information with unauthorized parties.",
      category: "technical"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle },
    { id: 'general', name: 'General', icon: Shield },
    { id: 'process', name: 'Process', icon: Clock },
    { id: 'communication', name: 'Communication', icon: MessageCircle },
    { id: 'payment', name: 'Payment', icon: DollarSign },
    { id: 'technical', name: 'Technical', icon: FileText }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleItem = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/customer-portal')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-white/80" />
              </Button>
              {/* <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div> */}
              <div>
                <img src="/leaders/logo.jpeg" alt="ExpertClaims" className="w-48" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  FAQ & Support
                </h1>
                <p className="text-xs text-white/80 font-medium">Find answers to common questions</p>
              </div>
            </div>
            {/* <Button 
              variant="outline" 
              onClick={() => navigate('/customer-portal')}
              className="border-2 border-blue-200 hover:border-blue-300 text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 rounded-xl transition-all duration-300"
            >
              Back to Portal
            </Button> */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 rounded-xl transition-all duration-300 ${
                    selectedCategory === category.id 
                      ? 'bg-primary-500 hover:bg-primary-600 text-white' 
                      : 'border-2 border-gray-300 hover:border-primary-500'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{category.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.map(faq => (
            <Card key={faq.id} className="border-none shadow-xl bg-white hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <HelpCircle className="h-5 w-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                      <Badge className="text-xs">
                        {categories.find(cat => cat.id === faq.category)?.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {expandedItems.includes(faq.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {expandedItems.includes(faq.id) && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <p className="text-gray-700 leading-relaxed mt-4">{faq.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="mt-8 border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Still Need Help?</CardTitle>
            <CardDescription className="text-gray-600">
              Can't find what you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mb-3 shadow-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600 text-sm mb-3">Speak with our support team</p>
                <Button variant="outline" className="w-full">
                  +91 98765 43210
                </Button>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl mb-3 shadow-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600 text-sm mb-3">Send us a detailed message</p>
                <Button variant="outline" className="w-full">
                  support@expertclaims.com
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerFAQ;
