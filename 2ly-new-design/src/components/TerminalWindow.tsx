import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TerminalWindowProps {
  title?: string;
  code: string;
}

const TerminalWindow = ({ title = "2LY Setup", code }: TerminalWindowProps) => {
  const [copied, setCopied] = useState(false);

  const actualInstallationCommands = `# Clone the repository
git clone https://github.com/AlpinAI/2LY.git
cd 2LY

# Install dependencies
npm install

# Start all services
npm run start`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(actualInstallationCommands);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-300">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="p-4 text-sm font-mono">
        <div className="text-gray-500">// Initialize 2LY runtime</div>
        <div className="text-purple-400">import</div> <span className="text-white">{'{ Runtime }'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@2ly/core'</span>
        <br /><br />
        <div className="text-purple-400">const</div> <span className="text-blue-300">runtime</span> <span className="text-white">=</span> <span className="text-purple-400">new</span> <span className="text-yellow-300">Runtime</span><span className="text-white">({'{'}</span>
        <div className="ml-4">
          <span className="text-blue-300">observability</span><span className="text-white">:</span> <span className="text-orange-400">true</span><span className="text-white">,</span><br />
          <span className="text-blue-300">mcp</span><span className="text-white">:</span> <span className="text-orange-400">true</span><span className="text-white">,</span><br />
          <span className="text-blue-300">intelligence</span><span className="text-white">:</span> <span className="text-green-400">'advanced'</span>
        </div>
        <span className="text-white">{'});'}</span>
        <br /><br />
        <div className="text-green-400">✓ Agent relationships mapped</div>
        <div className="text-green-400">✓ Tool dependencies tracked</div>
        <div className="text-cyan-400">ℹ Ready for deployment</div>
      </div>
    </div>
  );
};

export default TerminalWindow;