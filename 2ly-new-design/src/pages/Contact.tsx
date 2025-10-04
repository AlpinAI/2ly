"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, User, MessageSquare, ArrowLeft, Terminal } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      showError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('message', message);

      const response = await fetch('https://formspree.io/f/mrbybalo', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess("Your message has been sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        showError("There was an error sending your message. Please try again.");
      }
    } catch (error) {
      showError("There was an error sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">2LY</span>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-cyan-400 hover:text-cyan-300 hover:bg-gray-800 font-mono"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="text-center">
            <div className="bg-cyan-400/10 rounded-full p-4 mx-auto mb-4 inline-block">
              <Mail className="h-12 w-12 text-cyan-400" />
            </div>
            <CardTitle className="text-4xl font-bold text-white">Contact Us</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              We'd love to hear from you! Send us a message about 2LY.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300 font-mono">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-400 font-mono"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-mono">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-400 font-mono"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300 font-mono">Message</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your AI tools needs..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-400 resize-y font-mono"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-cyan-400 text-gray-900 hover:bg-cyan-300 font-bold font-mono"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold text-white">Other Ways to Reach Us</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 font-mono" asChild>
                    <a href="https://github.com/AlpinAI/2LY/discussions" target="_blank" rel="noopener noreferrer">
                      GitHub Discussion
                    </a>
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 font-mono" asChild>
                    <a href="https://discord.gg/dvM3RtVD" target="_blank" rel="noopener noreferrer">
                      Discord Community
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;