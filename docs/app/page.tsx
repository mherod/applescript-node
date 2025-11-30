import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold mb-4">applescript-node</h1>
      <p className="text-fd-muted-foreground text-lg mb-8 max-w-xl">
        Type-safe macOS automation from Node.js. Control apps, manage windows, and automate workflows with a fluent API.
      </p>
      <div className="flex gap-4">
        <Link
          href="/docs"
          className="inline-flex items-center justify-center rounded-md bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/mherod/applescript-node"
          className="inline-flex items-center justify-center rounded-md border border-fd-border px-6 py-3 text-sm font-medium transition-colors hover:bg-fd-accent"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </main>
  );
}
