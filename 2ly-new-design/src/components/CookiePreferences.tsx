"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, BarChart3, Target, Zap } from "lucide-react";

interface CookiePreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (preferences: CookiePreferences) => void;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const CookiePreferencesModal = ({ open, onOpenChange, onSave }: CookiePreferencesProps) => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  const handleSave = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    localStorage.setItem('cookieConsent', 'customized');
    onSave(preferences);
    onOpenChange(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsent', 'accepted');
    onSave(allAccepted);
    onOpenChange(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(onlyNecessary);
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
    localStorage.setItem('cookieConsent', 'declined');
    onSave(onlyNecessary);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Cookie Preferences</DialogTitle>
          <DialogDescription className="text-gray-300">
            Manage your cookie preferences. You can enable or disable different types of cookies below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Necessary Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-400/10 p-2 rounded">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <Label className="text-lg font-semibold text-white">Necessary Cookies</Label>
                  <p className="text-sm text-gray-400">Required for basic site functionality</p>
                </div>
              </div>
              <Switch
                checked={preferences.necessary}
                disabled={true}
                className="data-[state=checked]:bg-green-400"
              />
            </div>
            <p className="text-sm text-gray-300 ml-12">
              These cookies are essential for the website to function properly. They enable core functionality 
              such as security, network management, and accessibility.
            </p>
          </div>

          <Separator className="bg-gray-600" />

          {/* Analytics Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-400/10 p-2 rounded">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <Label className="text-lg font-semibold text-white">Analytics Cookies</Label>
                  <p className="text-sm text-gray-400">Help us understand how visitors use our site</p>
                </div>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, analytics: checked }))
                }
                className="data-[state=checked]:bg-blue-400"
              />
            </div>
            <p className="text-sm text-gray-300 ml-12">
              These cookies collect information about how you use our website, such as which pages you visit 
              and if you experience any errors. This data helps us improve our website performance.
            </p>
          </div>

          <Separator className="bg-gray-600" />

          {/* Marketing Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-400/10 p-2 rounded">
                  <Target className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <Label className="text-lg font-semibold text-white">Marketing Cookies</Label>
                  <p className="text-sm text-gray-400">Used to deliver relevant advertisements</p>
                </div>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, marketing: checked }))
                }
                className="data-[state=checked]:bg-purple-400"
              />
            </div>
            <p className="text-sm text-gray-300 ml-12">
              These cookies track your online activity to help advertisers deliver more relevant advertising 
              or to limit how many times you see an ad.
            </p>
          </div>

          <Separator className="bg-gray-600" />

          {/* Functional Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-cyan-400/10 p-2 rounded">
                  <Zap className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <Label className="text-lg font-semibold text-white">Functional Cookies</Label>
                  <p className="text-sm text-gray-400">Enable enhanced functionality and personalization</p>
                </div>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, functional: checked }))
                }
                className="data-[state=checked]:bg-cyan-400"
              />
            </div>
            <p className="text-sm text-gray-300 ml-12">
              These cookies enable the website to provide enhanced functionality and personalization, 
              such as remembering your preferences and settings.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={handleAcceptAll}
            className="bg-cyan-400 text-gray-900 hover:bg-cyan-300 font-medium"
          >
            Accept All
          </Button>
          <Button 
            onClick={handleSave}
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Save Preferences
          </Button>
          <Button 
            onClick={handleRejectAll}
            variant="ghost" 
            className="text-gray-400 hover:text-gray-300"
          >
            Reject All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;