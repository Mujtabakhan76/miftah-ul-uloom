import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/library`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    await connectDB();
    const books = await Book.find({}).select("_id updatedAt").limit(500).lean();
    const bookRoutes: MetadataRoute.Sitemap = books.map((b) => ({
      url: `${base}/library/${b._id}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...bookRoutes];
  } catch {
    return staticRoutes;
  }
}
