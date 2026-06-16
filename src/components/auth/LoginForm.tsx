import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, LockKeyhole, ArrowRight, Building2, User, Phone, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation, Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoginFormProps {
  onGoogleLogin: () => Promise<void>;
  signupMode?: boolean;
}

type LoginMethod = "email" | "phone";

const OTP_RESEND_SECONDS = 120;

const LoginForm = ({ onGoogleLogin, signupMode = false }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [method, setMethod] = useState<LoginMethod>("email");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Business inquiry fields
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  const { login, requestOtp, verifyOtp } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone) {
      toast.error("Please enter your phone number");
      return;
    }
    setIsLoading(true);
    try {
      await requestOtp(otpPhone);
      setOtpSent(true);
      setResendIn(OTP_RESEND_SECONDS);
    } catch {
      // Error toast handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Please enter the verification code");
      return;
    }
    setIsLoading(true);
    try {
      await verifyOtp(otpPhone, otpCode);
    } catch {
      // Error toast handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhone = () => {
    setOtpSent(false);
    setOtpCode("");
    setResendIn(0);
  };
  
  // Get the redirect URL from the location state
  const from = location.state?.from || "/orders";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      // Error handling is in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log({
        companyName,
        contactName,
        email,
        phoneNumber,
        businessDescription
      });
      
      toast.success("Business inquiry submitted", {
        description: "Our team will review your information and contact you soon."
      });
      
      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhoneNumber("");
      setBusinessDescription("");
    } catch (error) {
      toast.error("Failed to submit inquiry", {
        description: "Please try again or contact us directly."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "pl-10 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all";
  const labelClasses = "block text-sm font-medium text-foreground mb-1";
  const iconClasses = "h-5 w-5 text-muted-foreground";

  if (signupMode) {
    return (
      <form className="space-y-5" onSubmit={handleBusinessInquiry}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName" className={labelClasses}>
              Company Name
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className={iconClasses} />
              </div>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                required
                className={inputClasses}
                placeholder="Your business name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="contactName" className={labelClasses}>
              Contact Person
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className={iconClasses} />
              </div>
              <Input
                id="contactName"
                name="contactName"
                type="text"
                required
                className={inputClasses}
                placeholder="Your full name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email" className={labelClasses}>
              Email address
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={iconClasses} />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClasses}
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="phoneNumber" className={labelClasses}>
              Phone Number
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className={iconClasses} />
              </div>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className={inputClasses}
                placeholder="Your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="businessDescription" className={labelClasses}>
              Business Description
            </Label>
            <textarea
              id="businessDescription"
              name="businessDescription"
              rows={4}
              required
              className="w-full p-3 bg-background border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              placeholder="Tell us about your business and how we can help"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-sm hover:shadow-md rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                Submit Business Inquiry <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>
    );
  }

  // Regular login — tabbed: Email/Password or Phone OTP
  const tabBtnBase = "flex-1 py-2 text-sm font-medium rounded-md transition-colors";
  const activeTab = "bg-background text-foreground shadow-sm";
  const inactiveTab = "text-muted-foreground hover:text-foreground";

  return (
    <div className="space-y-5">
      <div className="flex p-1 bg-muted rounded-lg">
        <button
          type="button"
          className={`${tabBtnBase} ${method === "email" ? activeTab : inactiveTab}`}
          onClick={() => setMethod("email")}
        >
          Email
        </button>
        <button
          type="button"
          className={`${tabBtnBase} ${method === "phone" ? activeTab : inactiveTab}`}
          onClick={() => setMethod("phone")}
        >
          Phone OTP
        </button>
      </div>

      {method === "phone" ? (
        <form className="space-y-5" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otpPhone" className={labelClasses}>
                Phone Number
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className={iconClasses} />
                </div>
                <Input
                  id="otpPhone"
                  name="otpPhone"
                  type="tel"
                  autoComplete="tel"
                  required
                  disabled={otpSent}
                  className={inputClasses}
                  placeholder="+91 9876543210"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <Label htmlFor="otpCode" className={labelClasses}>
                  Verification Code
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className={iconClasses} />
                  </div>
                  <Input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    className={inputClasses}
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendIn > 0 || isLoading}
                    className="font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-sm hover:shadow-md rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                {otpSent ? "Verify & Sign in" : "Send OTP"} <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      ) : (
    <form className="space-y-5" onSubmit={handleLogin}>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClasses}>
            Username or Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className={iconClasses} />
            </div>
            <Input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              className={inputClasses}
              placeholder="Enter your username or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className={labelClasses}>
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockKeyhole className={iconClasses} />
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClasses}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary/30 border-border rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-sm hover:shadow-md rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center">
              Sign in <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          )}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full border-border hover:bg-muted/50 transition-all rounded-lg text-foreground"
          onClick={onGoogleLogin}
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Sign in with Google
        </Button>
      </div>
    </form>
      )}
    </div>
  );
};

export default LoginForm;
