import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";

import { JsonLd } from "@/components/parkvega/json-ld";
import { SectionHeading } from "@/components/parkvega/page-hero";
import { RichText } from "@/components/parkvega/rich-text";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { Button } from "@/components/ui/button";
import { ApiError, publicFetch } from "@/lib/api.server";
import { excerptOf, isPublished, postDate, readMinutes, truncate } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";
import type { ContentPage } from "@/types/api";

// ISR: regenerate each blog post page at most once every 60 seconds
// (Requirements 4.1, 4.9).
export const revalidate = 60;

const fetchOpts = { next: { revalidate: 60 } } as const;

// SEO fallbacks used when the REST API is unavailable (Requirement 5.1).
const FALLBACK_TITLE = "Blog | Park Vega Waterpark";
const FALLBACK_DESCRIPTION =
  "Read the latest news, event highlights and visit tips from Park Vega Waterpark in Agbor, Delta State.";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await publicFetch<ContentPage>(`/content/pages/${slug}`, fetchOpts);
    if (!isPublished(post)) return { title: FALLBACK_TITLE, robots: { index: false } };

    const title = truncate(post.seo_title?.trim() || `${post.title} | Park Vega Blog`, 60);
    const description = truncate(post.seo_description?.trim() || excerptOf(post), 160);
    const images = post.cover_image_url ? [post.cover_image_url] : undefined;

    return {
      title,
      description,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: { title, description, type: "article", publishedTime: postDate(post), images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  } catch {
    // Any failure (including 404) degrades to a static fallback (Requirement 5.1).
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      openGraph: { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION, type: "article" },
      twitter: { card: "summary_large_image", title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION },
    };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let post: ContentPage;
  try {
    post = await publicFetch<ContentPage>(`/content/pages/${slug}`, fetchOpts);
  } catch (err) {
    // A 404 from the REST API means the blog post slug does not exist — render
    // the Next.js not-found page (Requirements 4.9, 4.11).
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    // Any other error bubbles up to the route's error boundary (Requirement 4.12).
    throw err;
  }
  // Drafts are only visible in the admin preview.
  if (!isPublished(post)) notFound();

  const date = postDate(post);
  const publishedLabel = new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: excerptOf(post),
    image: post.cover_image_url ?? `${SITE_URL}/photos/slide-tower-tubes.jpg`,
    datePublished: date,
    dateModified: post.updated_at,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Organization", name: "Park Vega Waterpark", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Park Vega Waterpark", url: SITE_URL },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      <JsonLd data={articleSchema} />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to blog
      </Link>

      <header className="mt-6">
        <span className="flex items-center gap-3 text-[11px] font-bold uppercase text-muted-foreground">
          <time dateTime={date}>{publishedLabel}</time>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" /> {readMinutes(post.body)} min read
          </span>
        </span>
        <h1 className="mt-3 text-balance text-4xl font-semibold sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}
      </header>

      {post.cover_image_url && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl bg-muted">
          <Image src={post.cover_image_url} alt="" fill preload sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}

      {post.body.trim() ? (
        <RichText body={post.body} className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg" />
      ) : (
        <p className="mt-8 text-muted-foreground">This post doesn&apos;t have any content yet. Check back soon.</p>
      )}

      <aside className="mt-12 rounded-3xl bg-deep p-6 text-hero-foreground sm:p-8">
        <h2 className="text-2xl font-semibold">Ready to make a splash?</h2>
        <p className="mt-2 text-hero-foreground/75">Book online and skip the queue at the gate.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="ticket">
            <Link href="/tickets">Buy Tickets</Link>
          </Button>
          <WhatsAppButton>Ask on WhatsApp</WhatsAppButton>
        </div>
      </aside>

      <div className="mt-16 border-t border-border pt-10">
        <SectionHeading
          eyebrow="Keep reading"
          title="More from the park."
          description="Head back to the blog for more news, event recaps and visit tips."
        />
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
        >
          <ArrowLeft className="size-4" /> All blog posts
        </Link>
      </div>
    </article>
  );
}
