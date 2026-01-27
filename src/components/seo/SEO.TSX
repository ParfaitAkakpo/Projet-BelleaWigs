import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description?: string;
  canonical?: string; // ex: "/shop"
  image?: string;     // ex: "/og.jpg"
  noindex?: boolean;
};

const SITE_NAME = "BelléaWigs";
// Mets ton vrai domaine quand tu l’as (sinon laisse vide ou l’URL prod)
const SITE_URL = "https://belleawigs.com";

export default function SEO({
  title,
  description,
  canonical,
  image,
  noindex,
}: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
  const ogImage = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>

      {description ? <meta name="description" content={description} /> : null}

      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

      {/* OpenGraph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      <meta property="og:type" content="website" />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}

      {/* Twitter */}
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}

      {/* Indexation */}
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
    </Helmet>
  );
}
