
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, Mail, MessageSquare, Smartphone, LogIn } from "lucide-react";
import { toast } from "sonner";

const AccessRequestForm = () => {
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real implementation, this would send the request to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Access request submitted", {
        description: "Our team will review your request and contact you soon."
      });
      
      // Reset form
      setCompanyName("");
      setContactEmail("");
      setContactPhone("");
      setMessage("");
    } catch (error) {
      toast.error("Failed to submit request", {
        description: "Please try again or contact us directly."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleAccessRequest}>
      <div className="space-y-4">
        <div>
          <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="company-name"
              name="company-name"
              type="text"
              required
              className="pl-10 bg-gray-50 border border-gray-200 focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
              placeholder="Your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
            Business Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="contact-email"
              name="contact-email"
              type="email"
              autoComplete="email"
              required
              className="pl-10 bg-gray-50 border border-gray-200 focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
              placeholder="Your business email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Smartphone className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="contact-phone"
              name="contact-phone"
              type="tel"
              className="pl-10 bg-gray-50 border border-gray-200 focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
              placeholder="+1234567890"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Enter your full phone number with country code</p>
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message (Optional)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="pl-10 w-full bg

-gray-50 border border-gray-200 rounded-md focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
              placeholder="Tell us about your business and requirements"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-farmaze-orange hover:bg-farmaze-orange/90 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : (
          <span className="flex items-center">
            Request Access <LogIn className="ml-2 h-4 w-4" />
          </span>
        )}
      </Button>
      
      <div className="text-center text-sm text-gray-500">
        <p>
          Our team will review your request and get back to you within 1-2 business days.
        </p>
      </div>
    </form>
  );
};

export default AccessRequestForm;
