import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FaqBlock } from "@/components/parkvega/faq-block";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { publicFetch } from "@/lib/api.server";
import { excerptOf, isBlogPost, isPublished, postDate } from "@/lib/blog";
import type { ContentPage } from "@/types/api";

// ISR: regenerate the blog listing at most once every 60 seconds (Requirement 4.1).
export const revalidate = 60;

export const metadata: Metadata = {
  // Title: 42 chars (<= 60)
  title: "Blog | Park Vega Waterpark in Agbor",
  // Description: 139 chars (<= 160)
  description:
    "Dive into the Park Vega blog for park news, event highlights, visit tips and stories from Agbor's biggest water park in Delta State.",
  openGraph: {
    title: "Blog | Park Vega Waterpark in Agbor",
    description:
      "Park news, event highlights and visit tips from Park Vega in Agbor, Delta State.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Park Vega Waterpark in Agbor",
    description:
      "Park news, event highlights and visit tips from Park Vega in Agbor, Delta State.",
  },
};

const fetchOpts = { next: { revalidate: 60 } } as const;

export default async function BlogPage() {
  // Fetch the blog listing. A failure degrades to an empty state so the page
  // still renders (match the attractions listing pattern).
  const pages = await publicFetch<ContentPage[]>(
    "/content/pages",
    fetchOpts,
  ).catch(() => [] as ContentPage[]);

  // Keep only published blog posts (not drafts or the structural CMS pages), newest first.
  const posts = pages
    .filter((page) => isBlogPost(page) && isPublished(page))
    .sort((a, b) => postDate(b).localeCompare(postDate(a)));

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="From the park"
          title="The Park Vega blog."
          description="Fresh news, event recaps and tips to help you make the most of every splash at Park Vega."
        />

        {posts.length > 0 ? (
          <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
                >
                  {post.cover_image_url && (
                    <div className="relative aspect-[16/9] bg-muted">
                      <Image
                        src={post.cover_image_url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground">
                    {new Date(postDate(post)).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <h2 className="mt-3 text-balance text-xl font-semibold group-hover:text-primary-ink">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {excerptOf(post, 140)}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink">
                    Read more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-9 rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
            <h3 className="text-2xl font-semibold">No posts yet.</h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              We haven&apos;t published any blog posts yet. Check back soon for
              park news and stories.
            </p>
          </div>
        )}
      </section>
      <FaqBlock />
    </>
  );
}
