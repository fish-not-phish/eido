import { Button } from '@/components/ui/button';
import { ArrowRight, Code2, Database, FileCode2 } from 'lucide-react';
import { Terminal } from '@/components/terminal';
import Link from 'next/link';
import { Suspense } from 'react';
import Image from "next/image"

export default function HomePage() {
  return (
    
    <main>
      <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
        <Image
          src="/eido-light.svg"
          alt="Eido Logo"
          width={120}
          height={32}
          className="h-8 w-auto dark:hidden"
        />
        <Image
          src="/eido-dark.svg"
          alt="Eido Logo"
          width={120}
          height={32}
          className="h-8 w-auto hidden dark:block"
        />
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <Button asChild className="rounded-full">
              <Link href="/docs">Docs</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/register">Register</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/login">Log in</Link>
            </Button>
          </Suspense>
        </div>
      </div>
    </header>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight sm:text-5xl md:text-6xl">
                Diagram as Code
                <span className="block text-[#6777F1] mt-2">Code Visualized.</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Describe your systems in simple, declarative code. Our engine
                automatically transforms your text into architectural
                diagrams, keeping docs and design always in sync.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <a
                  href="/login"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg rounded-full cursor-pointer"
                  >
                    Start for free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#6777F1] text-white">
                <FileCode2 className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Diagram as Code
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Write simple DSL statements and instantly generate reusable system diagrams.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#6777F1] text-white">
                <Code2 className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Powered by Next.js, React & Django Ninja
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Built with modern frameworks on both frontend and backend.
                  Fast, reliable, and designed for developers.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#6777F1] text-white">
                <Database className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Backed by Postgres
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Robust relational database support ensures your architectural
                  data is stored, and queried  efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to turn code into diagrams?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Skip the manual diagramming. With our diagram-as-code approach,
                you write once and get accurate, always-up-to-date visuals for your systems automatically.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a href="https://github.com/fish-not-phish/eido" target="_blank">
                <Button
                  size="lg"
                  className="text-lg rounded-full cursor-pointer bg-[#6777F1] text-white hover:bg-[#5665d9]"
                >
                  View the code
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}