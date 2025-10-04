"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Lightbulb, GitBranch, ShieldCheck, ArrowLeft, Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
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
        <Card className="bg-gray-800 border-gray-700 text-white shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="bg-cyan-400/10 rounded-full p-4 mx-auto mb-4 inline-block">
              <Users className="h-12 w-12 text-cyan-400" />
            </div>
            <CardTitle className="text-4xl font-bold mb-2 text-white">Who We Are & Why We Built 2LY</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Our mission is to empower AI builders with clarity and control.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 text-lg leading-relaxed">
            <p className="text-gray-300">
              At AlpinAI, we combine business insight with technical expertise to turn complex technologies into measurable outcomes. Our hybrid profiles bridge strategy and implementation, ensuring that every solution delivers controlled costs, rapid deployments, and tangible ROI.
            </p>
            <p className="text-gray-300">
              Beyond advisory, we also develop tools for AI builders — practical solutions that accelerate development, improve observability, and make agentic systems easier to manage and scale.
            </p>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 space-y-4">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                <Lightbulb className="h-6 w-6 text-yellow-400" /> The Problem We Solved
              </h3>
              <p className="text-gray-300">
                Through our work, we identified a recurring gap in the rise of agentic AI: tools remain the blind spot. While AI agents are advancing fast, the tools they rely on often go untracked, create inefficiencies, evolve chaotically, and leave no audit trail. This lack of visibility makes scaling AI risky and unpredictable.
              </p>
            </div>
            <p className="text-gray-300">
              That's why we built 2LY — the AI Tools Intelligence Platform.
            </p>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 space-y-4">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                <GitBranch className="h-6 w-6 text-green-400" /> Our Solution: 2LY
              </h3>
              <p className="text-gray-300">
                Designed to be framework-agnostic, 2LY integrates seamlessly with the systems AI builders already use: LangChain, n8n, CrewAI, MCP servers, APIs, or custom functions. It maps agent–tool relationships, tracks every execution, and validates performance — all within one unified intelligence layer.
              </p>
              <p className="text-gray-300">
                For AI builders, 2LY delivers clean observability, faster iteration, and simplified integration. For enterprises, it ensures efficiency, compliance, and control at scale.
              </p>
            </div>
            <p className="text-gray-300 text-center font-semibold flex items-center justify-center gap-3">
              <ShieldCheck className="h-6 w-6 text-blue-400" /> With 2LY, we give enterprises the confidence to scale AI responsibly: every tool tracked, every relationship mapped, every call auditable.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-700">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-white">Join Our Mission</h3>
                <p className="text-gray-400">
                  Ready to bring intelligence to your AI tools? Connect with us and be part of the future of agentic systems.
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;