
import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeInSection from "@/components/ui/FadeInSection";
import { toast } from "sonner";


const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission - in production, this would connect to a backend service
      console.log('Contact form submitted:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Message sent successfully!', {
        description: 'We will get back to you soon.'
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to send message', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-amber-50/50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
              <p className="text-lg text-gray-700 mb-8">
                Have questions or feedback? We'd love to hear from you. Our team is here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="bg-farmaze-orange/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="text-farmaze-orange" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Email Us</h3>
                  <p className="text-gray-600 mb-2">For general inquiries:</p>
                  <a href="mailto:info@farmaze.com" className="text-farmaze-green font-medium">
                  farmaze.official@gmail.com
                  </a>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="bg-farmaze-orange/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="text-farmaze-orange" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Call Us</h3>
                  <p className="text-gray-600 mb-2">Customer support:</p>
                  <a href="tel:+1234567890" className="text-farmaze-green font-medium">
                  +91 63697 24626
                  </a>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="bg-farmaze-orange/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="text-farmaze-orange" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
                  <p className="text-gray-600 mb-2">Headquarters:</p>
                  <address className="text-farmaze-green font-medium not-italic">
                  38, Palla Street, north, Padmavathy Nagar, Agraharam, Korattur, Chennai, Tamil Nadu 600076
                  </address>
                </div>
              </div>
            </FadeInSection>

            {/* Contact Form */}
            <FadeInSection delay={100}>
              <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farmaze-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farmaze-green focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farmaze-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farmaze-green focus:border-transparent"
                    />
                  </div>
                  <Button 
                    variant="farmaze" 
                    className="w-full"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    <Send size={16} className="ml-2" />
                  </Button>
                </form>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
