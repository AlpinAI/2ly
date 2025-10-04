"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import CookiePreferencesModal, { CookiePreferences } from "./CookiePreferences";

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const declineCookies = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
    setShowBanner(false);
  };

  const openPreferences = () => {
    setShowPreferences(true);
  };

  const handlePreferencesSave = (preferences: CookiePreferences) => {
    setShowBanner(false);
  };

  const closeBanner = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <Card className="bg-gray-800 border-gray-700 shadow-2xl">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-cyan-400/10 p-2 rounded-full flex-shrink-0">
                <Cookie className="h-5 w-5 text-cyan-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">We use cookies</h3>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  We use cookies to enhance your browsing experience, analyze site traffic, and provide personalized content. 
                  By clicking "Accept All", you consent to our use of cookies. You can manage your preferences or learn more in our{" "}
                  <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</a>.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={acceptCookies}
                    className="bg-cyan-400 text-gray-900 hover:bg-cyan-300 font-medium"
                  >
                    Accept All
                  </Button>
                  <Button 
                    onClick={declineCookies}
                    variant="outline" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Decline
                  </Button>
                  <Button 
                    onClick={openPreferences}
                    variant="ghost" 
                    className="text-gray-400 hover:text-gray-300"
                  >
                    Manage Preferences
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={closeBanner}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-300 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <CookiePreferencesModal
        open={showPreferences}
        onOpenChange={setShowPreferences}
        onSave={handlePreferencesSave}
      />
    </>
  );
};

export default CookieBanner;