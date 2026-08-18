import type { Metadata } from "next";

import { ProsePage } from "@/components/prose-page";
import { OPERATOR } from "@/lib/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to report a calculation error, ask about privacy, or get in touch about this site.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <ProsePage
      kicker="Contact"
      title="Get in touch"
      lead="Corrections are especially welcome. A reproducible arithmetic error is the most useful thing anyone can send."
    >
      <section className="mt-14 grid gap-x-12 gap-y-4 lg:grid-cols-[16rem_1fr]">
        <h2 className="font-heading text-xl leading-tight tracking-tight">
          Email
        </h2>
        <div className="flex max-w-prose flex-col gap-4 text-[0.9375rem] leading-relaxed">
          {OPERATOR.email ? (
            <p>
              <a
                className="font-mono underline underline-offset-4 hover:no-underline"
                href={`mailto:${OPERATOR.email}`}
              >
                {OPERATOR.email}
              </a>
            </p>
          ) : (
            <p className="text-muted-foreground">
              A contact address will be published here before this site goes
              live.
            </p>
          )}
          <p className="text-muted-foreground">
            {SITE_NAME} is operated by {OPERATOR.name}. There is no contact form
            because there is no database behind this site — email is the whole
            system.
          </p>
        </div>
      </section>

      <section className="mt-14 grid gap-x-12 gap-y-4 lg:grid-cols-[16rem_1fr]">
        <h2 className="font-heading text-xl leading-tight tracking-tight">
          Reporting an error
        </h2>
        <div className="flex max-w-prose flex-col gap-4 text-[0.9375rem] leading-relaxed">
          <p>
            The fastest fix comes from a share link. Set the calculator up so it
            shows the wrong figure, press{" "}
            <strong className="font-medium">Copy share link</strong>, and send
            that with a line about what you expected instead. The link carries
            every input, so the exact state can be reproduced immediately.
          </p>
          <p className="text-muted-foreground">
            Please include which figure is wrong and what it should be. &ldquo;The
            total looks off&rdquo; is much harder to act on than &ldquo;the
            biweekly figure should be $2,000, it shows $1,000&rdquo;.
          </p>
        </div>
      </section>

      <section className="mt-14 grid gap-x-12 gap-y-4 lg:grid-cols-[16rem_1fr]">
        <h2 className="font-heading text-xl leading-tight tracking-tight">
          Privacy requests
        </h2>
        <div className="flex max-w-prose flex-col gap-4 text-[0.9375rem] leading-relaxed">
          <p className="text-muted-foreground">
            The calculators store nothing, so there is normally no personal data
            to access or delete. If you believe otherwise, write to the address
            above and we will respond within 30 days.
          </p>
        </div>
      </section>
    </ProsePage>
  );
}
