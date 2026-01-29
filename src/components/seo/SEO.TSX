import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "product" | "article";
};

const SITE_NAME = "BelléaWigs";
const SITE_URL = "https://belleawigs.com";

export default function SEO({
  title,
  description,
  canonical,
  image,
  noindex,
  type,
}: SEOProps) {
  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;

  const canonicalUrl = canonical
    ? `${SITE_URL}${canonical}`
    : undefined;

  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>

      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* OpenGraph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && (
        <meta property="og:description" content={description} />
      )}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:type" content={type ?? "website"} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta
        name="twitter:card"
        content={ogImage ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={fullTitle} />
      {description && (
        <meta name="twitter:description" content={description} />
      )}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Indexation */}
      {noindex && (
        <meta name="robots" content="noindex,nofollow" />
      )}
    </Helmet>
  );
}
