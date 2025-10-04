"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, Mountain, Code, Zap, Target, Users, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

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

      <div className="container mx-auto max-w-4xl px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-cyan-400/10 rounded-full p-6 mx-auto mb-6 inline-block">
            <Mountain className="h-16 w-16 text-cyan-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">About AlpinAI</h1>
          <p className="text-xl text-gray-400">For the Builders, By the Builders</p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <p className="text-lg text-gray-300 leading-relaxed">
                We're developers who understand the frustration of watching brilliant AI concepts stall at integration complexity. 
                We built AlpinAI to bridge the gap between AI potential and production reality.
              </p>
            </CardContent>
          </Card>

          {/* Mission */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-cyan-400/10 p-2 rounded">
                  <Target className="h-6 w-6 text-cyan-400" />
                </div>
                <CardTitle className="text-2xl text-white">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-300 leading-relaxed">
                The future of AI lies not in bigger models, but in smarter connections. We're eliminating integration barriers 
                so developers can create AI that doesn't just think—but acts.
              </p>
            </CardContent>
          </Card>

          {/* The Problem We Solve */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-400/10 p-2 rounded">
                  <Code className="h-6 w-6 text-red-400" />
                </div>
                <CardTitle className="text-2xl text-white">The Problem We Solve</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                The massive augmentation of agentic systems being deployed today is creating scattered agent deployments 
                across organizations. Each agent requires custom integrations to databases, APIs, and workflows, resulting 
                in exponential complexity and maintenance overhead.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Your breakthrough concept gets buried under managing dozens of APIs, authentication methods, and data formats 
                across multiple agent deployments. The problem isn't the agents themselves—it's the missing unified tool access layer.
              </p>
            </CardContent>
          </Card>

          {/* Enter 2LY */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-400/10 p-2 rounded">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-2xl text-white">Enter 2LY: The AI Tools Platform</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                2LY is the unified tools layer that eliminates integration complexity. Your agent connects once to 2LY and 
                gains standardized access to your entire toolkit through one consistent interface.
              </p>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                <p className="text-xl font-semibold text-cyan-400 mb-4">
                  Framework agnostic. Tool universal. No more hardcoded integrations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* From the Alps */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-400/10 p-2 rounded">
                  <Mountain className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-white">From the Alps to the World</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                From our Swiss Alps base, we're building the infrastructure that transforms AI concepts into production-ready 
                solutions. Mountains teach us that summits are reached not by brute force, but by finding the right path 
                with the right tools.
              </p>
            </CardContent>
          </Card>

          {/* Join Us */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-400/10 p-2 rounded">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-2xl text-white">Join Us</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-300 leading-relaxed">
                Ready to focus on building instead of integration? Join developers who've moved beyond integration 
                headaches to build AI that changes the world.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center py-12">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <p className="text-lg text-gray-300 mb-6 italic">
                Experience 2LY and discover what happens when brilliant AI meets frictionless access to everything 
                it needs to succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-cyan-400 text-gray-900 hover:bg-cyan-300 font-bold font-mono" asChild>
                  <a href="https://github.com/AlpinAI/2LY" target="_blank" rel="noopener noreferrer">
                    View on GitHub
                  </a>
                </Button>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 font-mono" asChild>
                  <a href="https://discord.gg/dvM3RtVD" target="_blank" rel="noopener noreferrer">
                    Join Discord
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;