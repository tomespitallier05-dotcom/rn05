import type { MetadataRoute } from "next"

// Défense en profondeur en plus des balises meta robots par page : outil
// interne, jamais indexé.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  }
}
