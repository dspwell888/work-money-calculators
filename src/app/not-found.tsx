import Link from "next/link";

import { TOOLS, toolPath } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <header className="grid gap-x-10 gap-y-6 pt-16 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="kicker">Error 404</span>
          <h1 className="mt-4 font-heading text-[clamp(2.5rem,6.5vw,4.25rem)] leading-[0.94] tracking-tight">
            That page is not here
          </h1>
        </div>
        <p className="max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground lg:pb-2">
          The link may be out of date, or the calculator you are after may not
          be built yet. Everything that does exist is listed below.
        </p>
      </header>

      <section>
        <div className="rule-b pb-3">
          <h2 className="font-heading text-2xl tracking-tight">
            The calculators
          </h2>
        </div>
        <ul>
          {TOOLS.map((tool, i) => (
            <li key={tool.slug}>
              <Link
                href={toolPath(tool.slug)}
                className="flex flex-col gap-1 border-b border-[var(--rule)] py-5 transition-colors hover:bg-accent/50 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="kicker font-mono sm:w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-medium sm:w-64 sm:shrink-0">
                  {tool.title}
                </span>
                <span className="flex-1 text-sm text-muted-foreground">
                  {tool.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
