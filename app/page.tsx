import CodeReviewer from "./components/CodeReviewer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 border-b border-[#d8d8d8]/20 pb-6">
          <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#3b89ff]">
            AI-Powered Development Tooling
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold leading-tight text-white">
            CodeMind - AI Code Reviewer
          </h1>
          <p className="mt-3 max-w-3xl text-base md:text-lg text-gray-300">
            Review, explain, and fix your code with a single workflow powered by Next.js and OpenRouter.
          </p>
        </header>

        <CodeReviewer />

        <footer className="mt-10 border-t border-[#d8d8d8]/20 pt-6 text-sm text-gray-400 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3b89ff] transition hover:text-[#146ef5]"
          >
            GitHub
          </a>
          <p>Built with Next.js + OpenRouter</p>
        </footer>
      </main>
    </div>
  );
}
