'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export function Terminal() {
  const [terminalStep, setTerminalStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const terminalSteps = [
    'client [icon: user]',
    'api [icon: aws-api-gateway]',
    'lambda [icon: aws-lambda]',
    'sqs [icon: aws-sqs]',
    'worker [icon: aws-batch]',
    'db [icon: aws-rds]',
    'client > api: request',
    'api > lambda: invoke',
    'lambda > sqs: enqueue',
    'sqs > worker: process',
    'worker > db: save',
  ];

  useEffect(() => {
    if (terminalStep < terminalSteps.length - 1) {
        const timer = setTimeout(() => {
        setTerminalStep((prev) => prev + 1);
        }, 700);
        return () => clearTimeout(timer);
    }
    }, [terminalStep]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalSteps.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStep = (step: string) => {
    const nodeMatch = step.match(/^(.+)\s+\[icon:\s*(.+)\]$/i);
    if (nodeMatch) {
      const [, name, icon] = nodeMatch;
      return (
        <span>
          <span className="text-sky-400">{name.trim()}</span>{' '}
          <span className="text-yellow-400">[</span>
          <span className="text-green-400">icon</span>
          <span className="text-yellow-400">: </span>
          <span className="text-green-400">{icon.trim()}</span>
          <span className="text-yellow-400">]</span>
        </span>
      );
    }

    const connMatch = step.match(/^(.+)\s*>\s*(.+):\s*(.+)$/);
    if (connMatch) {
      const [, from, to, action] = connMatch;
      return (
        <span>
          <span className="text-sky-400">{from.trim()}</span>{' '}
          <span className="text-green-400">&gt;</span>{' '}
          <span className="text-sky-400">{to.trim()}</span>
          <span className="text-yellow-400">: </span>
          <span className="text-white">{action.trim()}</span>
        </span>
      );
    }

    return <span>{step}</span>;
  };

  return (
    <div className="w-full rounded-lg shadow-lg overflow-hidden bg-gray-900 text-white font-mono text-sm relative">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="space-y-2">
          {terminalSteps.map((step, index) => (
            <div
              key={index}
              className={`${
                index > terminalStep ? 'opacity-0' : 'opacity-100'
              } transition-opacity duration-300`}
            >
              <span className="text-green-400">$</span>{' '}
              {renderStep(step)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
