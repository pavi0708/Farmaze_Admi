
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const OtpLoginForm = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { requestOtp, verifyOtp } = useAuth();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestOtp(phone);
      setIsOtpSent(true);
    } catch (error) {
      // Error handling is in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      await verifyOtp(phone, otp);
    } catch (error) {
      // Error handling is in the auth context
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      {!isOtpSent ? (
        <form onSubmit={handleRequestOtp}>
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="pl-10 bg-gray-50 border border-gray-200 focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter your full phone number with country code (e.g., +12345678900)</p>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              className="w-full bg-farmaze-orange hover:bg-farmaze-orange/90 flex items-center justify-center transition-all shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                <span className="flex items-center">
                  Send Verification Code
                </span>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="pl-10 bg-gray-50 border border-gray-200 focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
                  placeholder="Enter verification code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter the 6-digit code sent to your phone</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              type="submit"
              className="w-full bg-farmaze-orange hover:bg-farmaze-orange/90 flex items-center justify-center transition-all shadow-md hover:shadow-lg"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center">
                  Verify and Sign In
                </span>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full text-sm"
              onClick={() => setIsOtpSent(false)}
            >
              Change Phone Number
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OtpLoginForm;
