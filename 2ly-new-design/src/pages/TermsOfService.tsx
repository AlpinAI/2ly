"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    // Load terms of service content from markdown file
    fetch('/terms-of-service.md')
      .then(response => response.text())
      .then(text => setContent(text))
      .catch(() => {
        setContent("Terms of Service content will be loaded here. Please add your terms of service content to the terms-of-service.md file in the public folder.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-cyan-400 hover:text-cyan-300 hover:bg-gray-800 font-mono"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center pb-6">
            <div className="bg-cyan-400/10 rounded-full p-4 mx-auto mb-4 inline-block">
              <FileText className="h-12 w-12 text-cyan-400" />
            </div>
            <CardTitle className="text-4xl font-bold mb-2 text-white">Terms of Service</CardTitle>
            <p className="text-gray-400">Last updated: [DATE]</p>
          </CardHeader>
          <CardContent className="max-w-none">
            <div className="whitespace-pre-wrap text-gray-300 leading-relaxed font-mono text-sm">
              {content || (
                <div className="text-center py-12">
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                    <p className="text-xl text-cyan-400 mb-4 font-bold">Terms of Service Content</p>
                    <p className="text-gray-400 mb-4">
                      This is a placeholder page. Please add your terms of service content to the 
                    </p>
                    <code className="bg-gray-700 px-3 py-2 rounded text-cyan-300 font-mono">
                      public/terms-of-service.md
                    </code>
                    <p className="text-gray-400 mt-4">
                      file to display your actual terms of service.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;