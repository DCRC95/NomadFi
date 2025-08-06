import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const LandingPage = () => {
  const router = useRouter();
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [allText, setAllText] = useState('');

  const sections = [
    {
      title: "NOMADFI CROSS-CHAIN YIELD AGGREGATOR",
      content: [
        "╔══════════════════════════════════════════════════════════════╗",
        "║                    NOMADFI TERMINAL v1.0.0                   ║",
        "║                    CROSS-CHAIN YIELD AGGREGATOR              ║",
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        "SYSTEM STATUS: ONLINE",
        "MULTI-CHAIN PROTOCOLS: ACTIVE",
        "YIELD STRATEGIES: DEPLOYED",
        "",
        "══════════════════════════════════════════════════════════════════"
      ]
    },
    {
      title: "WHAT IS NOMADFI?",
      content: [
        "Navigating the decentralized finance (DeFi) landscape can be complex.",
        "With countless yield opportunities spread across different blockchains,",
        "finding and managing the best returns often means juggling multiple",
        "wallets, bridging assets, and paying high fees.",
        "",
        "Our Cross-Chain Yield Aggregator is designed to simplify this,",
        "bringing the power of multi-chain DeFi directly to you.",
        "",
        "This application is a decentralized yield aggregator that allows",
        "you to easily deposit your digital assets into various yield-",
        "generating strategies, even if those strategies are on different",
        "blockchains. Think of it as your single portal to diversified",
        "DeFi returns, without the hassle of manual cross-chain bridging.",
        "",
        "══════════════════════════════════════════════════════════════════"
      ]
    },
    {
      title: "HOW IT WORKS",
      content: [
        "1. DEPOSIT ASSETS",
        "   Deposit your digital assets into the aggregator",
        "",
        "2. AUTO-OPTIMIZATION",
        "   Our algorithms automatically find the best yield",
        "   opportunities across multiple blockchains",
        "",
        "3. CROSS-CHAIN BRIDGING",
        "   Seamless cross-chain asset movement handled",
        "   automatically by our smart contracts",
        "",
        "4. YIELD GENERATION",
        "   Your assets are deployed to the highest-yielding",
        "   strategies across different protocols",
        "",
        "5. REAL-TIME MONITORING",
        "   Track your positions and yields in real-time",
        "   through our unified dashboard",
        "",
        "══════════════════════════════════════════════════════════════════"
      ]
    },
    {
      title: "FEATURES",
      content: [
        "• MULTI-CHAIN SUPPORT",
        "  - Ethereum, Base, Sepolia, and more",
        "",
        "• AUTOMATED YIELD OPTIMIZATION",
        "  - AI-powered strategy selection",
        "  - Real-time yield comparison",
        "",
        "• GAS OPTIMIZATION",
        "  - Batch transactions",
        "  - Smart routing",
        "",
        "• SECURITY FIRST",
        "  - Audited smart contracts",
        "  - Multi-signature governance",
        "",
        "• USER-FRIENDLY INTERFACE",
        "  - Retro-futuristic terminal design",
        "  - Real-time data visualization",
        "",
        "══════════════════════════════════════════════════════════════════"
      ]
    },
    {
      title: "GET STARTED",
      content: [
        "Ready to unlock yield across blockchains?",
        "",
        "Click the button below to access the NomadFi Terminal",
        "and start earning yield on your digital assets.",
        "",
        "══════════════════════════════════════════════════════════════════"
      ]
    }
  ];

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (currentSection >= sections.length) return;

    const section = sections[currentSection];
    const fullText = section.content.join('\n');
    
    if (textIndex < fullText.length) {
      const timer = setTimeout(() => {
        const newText = fullText.substring(0, textIndex + 1);
        setCurrentText(newText);
        setTextIndex(textIndex + 1);
        
        // Update allText with the current section's progress
        const previousSections = sections.slice(0, currentSection).map(s => s.content.join('\n')).join('\n\n');
        const currentSectionText = newText;
        setAllText(previousSections + (previousSections ? '\n\n' : '') + currentSectionText);
      }, 12); // Speed of typing - twice as fast (was 25ms)

      return () => clearTimeout(timer);
    } else {
      // Move to next section after a delay
      const timer = setTimeout(() => {
        setCurrentSection(currentSection + 1);
        setTextIndex(0);
        setCurrentText('');
      }, 500); // Reduced delay between sections (was 1000ms)

      return () => clearTimeout(timer);
    }
  }, [textIndex, currentSection, sections]);

  const handleLaunchApp = () => {
    router.push('/app');
  };

  return (
    <div className="h-screen bg-retro-darker flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex-1">
              <h1 className="retro-text text-4xl font-bold mb-2">
                NOMADFI TERMINAL v1.0.0
              </h1>
              <div className="retro-text-dim text-sm">
                <span className="terminal-cursor">SYSTEM STATUS: ONLINE</span>
              </div>
            </div>
            <div className="retro-card p-2">
              <button
                onClick={handleLaunchApp}
                className="retro-button px-6 py-2 text-sm font-bold uppercase tracking-wider"
              >
                LAUNCH APP
              </button>
            </div>
          </div>
          
          <div className="retro-card p-6 mb-6">
            <div className="retro-text text-sm mb-2">
              <span className="text-retro-text-dim">{'>'}</span> INITIALIZING LANDING SEQUENCE...
            </div>
            <div className="retro-text text-sm">
              <span className="text-retro-text-dim">{'>'}</span> LOADING NOMADFI PRESENTATION...
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - Full Width Terminal */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full h-full flex flex-col">
          {/* Terminal Output - Full Width and Height */}
          <div className="flex-1 bg-black border border-retro-border p-4 md:p-6 overflow-y-auto">
            <div className="text-retro-text font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap h-full text-center">
              {allText}
              {showCursor && <span className="text-retro-text">█</span>}
            </div>
          </div>

          {/* Action Buttons - Fixed at Bottom */}
          {currentSection >= sections.length && (
            <div className="flex-shrink-0 bg-retro-darker p-4 border-t border-retro-border">
              <div className="text-center space-y-4">
                <button
                  onClick={handleLaunchApp}
                  className="bg-retro-text text-retro-dark px-6 md:px-8 py-3 md:py-4 font-bold text-base md:text-lg border-2 border-retro-text hover:bg-retro-dark hover:text-retro-text transition-all duration-300 uppercase tracking-wider"
                >
                  LAUNCH NOMADFI TERMINAL
                </button>
                
                <div className="flex justify-center space-x-4 md:space-x-8 mt-4 md:mt-8">
                  <a
                    href="https://github.com/your-repo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-retro-text hover:text-retro-text-dim transition-colors duration-300 text-xs md:text-sm"
                  >
                    [ GITHUB ]
                  </a>
                  <a
                    href="https://t.me/your-telegram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-retro-text hover:text-retro-text-dim transition-colors duration-300 text-xs md:text-sm"
                  >
                    [ TELEGRAM ]
                  </a>
                  <a
                    href="https://twitter.com/your-twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-retro-text hover:text-retro-text-dim transition-colors duration-300 text-xs md:text-sm"
                  >
                    [ TWITTER ]
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed Footer */}
      <div className="flex-shrink-0">
        <div className="text-center py-4 text-retro-text-dim text-sm">
          <div className="mb-2">© 2024 NOMADFI. ALL RIGHTS RESERVED.</div>
          <div className="text-xs">
            UNLOCK YIELD ACROSS BLOCKCHAINS
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 