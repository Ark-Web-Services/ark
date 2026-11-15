/**
 * Public configuration for the reusable service-business site template.
 * Replace the instructional copy and contact details before publishing.
 */
export interface BusinessConfig {
  enabled: boolean;
  contentEnabled?: boolean;
  /** Keep a purpose-built homepage and expose its own section anchors instead of template brochure routes. */
  customHome?: boolean;
  customHomeNav?: { label: string; href: string }[];
  customHomeContactHref?: string;
  name: string;
  description: string;
  email: string;
  phone?: string;
  location: string;
  serviceAreas: string[];
  website?: string;
  /** Optional GA4 measurement ID. Leave blank to disable analytics. */
  ga4Id?: string;
  logo?: string;
  socials: { label: string; url: string }[];
  brand: {
    background: string;
    foreground: string;
    accent: string;
    muted: string;
    headingFont: string;
    bodyFont: string;
  };
  hero: { eyebrow?: string; heading: string; body: string; image?: string; imageAlt?: string };
  about?: string;
  services: { id: string; title: string; description: string; details?: string[] }[];
  projects: {
    id: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    credit?: string;
    demo?: boolean;
  }[];
  testimonials: { quote: string; name: string; detail?: string; image?: string }[];
  process: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  inquiries: {
    enabled: boolean;
    endpoint: string;
    successMessage: string;
    turnstileSiteKey?: string;
  };
}

const businessConfig: BusinessConfig = {
  enabled: false,
  contentEnabled: true,
  name: "ARK Web Services",
  description:
    "Web design, WordPress rescue, custom development, and SEO foundations for service businesses in Charlotte, NC.",
  email: "support@arkwebservices.com",
  phone: "+1 (704) 256-0860",
  location: "Charlotte, NC",
  serviceAreas: ["Charlotte, North Carolina", "United States"],
  website: "https://arkwebservices.com",
  ga4Id: "G-5QLHJDZ3ZH",
  socials: [],
  brand: {
    background: "#f7f7f6",
    foreground: "#111111",
    accent: "#111111",
    muted: "#555555",
    headingFont: "'Montserrat Alternates', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
  },
  hero: {
    eyebrow: "WordPress Rescue · Custom Development · SEO Foundations",
    heading: "Your website should be bringing in customers — not collecting dust.",
    body:
      "Based in Charlotte, North Carolina, we help service businesses fix underperforming websites with WordPress rescue, custom development, and clear SEO foundations.",
  },
  about:
    "ARK Web Services is a Charlotte-based web studio helping service businesses improve how their sites work and how clearly they explain their services. We scope each project around the problem at hand, with practical recommendations and straightforward project work.",
  services: [
    { id: "wordpress-rescue", title: "WordPress rescue", description: "Fix slow pages, broken layouts, and site issues that get in the way of using your website.", details: ["Review the current site and agree on the specific issues to address.", "Repair and refine the agreed WordPress pages and functionality.", "Walk through the completed changes and next steps."] },
    { id: "website-redesign", title: "Website redesign", description: "Rework an outdated or unclear website around your services, customers, and next steps.", details: ["Clarify the audience, services, and actions each page should support.", "Restructure and redesign the agreed pages.", "Prepare the site for launch with the agreed content and technical setup."] },
    { id: "seo-for-service-businesses", title: "SEO foundations", description: "Set up clear service-page structure and local search signals as a focused project.", details: ["Map priority services and locations to relevant pages.", "Improve page titles, headings, internal links, and technical basics.", "Provide a practical handoff for maintaining the site after the project."] },
    { id: "custom-website-development", title: "Custom development", description: "Build a tailored website feature or web application when an off-the-shelf setup does not fit.", details: ["Define the user need and technical scope before work begins.", "Build and review the agreed feature or application.", "Document the delivered work and handoff requirements."] },
  ],
  projects: [],
  testimonials: [
    {
      quote: "Ark Web Services is the best web design service I've ever used. Not only was my website delivered on time, it was better than I was expecting. They were able to enhance my vision and bring my dream to a reality.",
      name: "Cedric P.",
      detail: "CEO, Presidential Consulting",
      image: "/assets/client/cedric-p.webp",
    },
    {
      quote: "The team has exceeded our expectations, from their attention to detail to their competitive analysis. Their communication is excellent, with flexible scheduling and timely meetings. Their reliability and quality of work are highly recommendable.",
      name: "Dominic S.",
      detail: "CMO, Pick A Pro",
      image: "/assets/client/dominic-s.webp",
    },
  ],
  process: [
    { title: "Review", description: "Tell us what is not working and share your website so we can understand the issue." },
    { title: "Scope", description: "We outline the work, timeline, and project price before you decide whether to proceed." },
    { title: "Build", description: "We complete the agreed work and walk you through the result." },
  ],
  faqs: [
    { question: "What kind of website work do you take on?", answer: "ARK works on WordPress fixes, website redesigns, custom development, and one-time SEO foundation projects for service businesses." },
    { question: "How does pricing work?", answer: "We review the project, define a written scope, and share the project price before work begins. Pricing depends on the work involved." },
    { question: "Do you offer ongoing SEO retainers?", answer: "The SEO foundations service is scoped as a one-time project. It establishes site structure and targeting; it does not guarantee search rankings or traffic." },
    { question: "Can you improve a site I already have?", answer: "Yes. Share your current website and the issues you want to address. We will review whether a focused fix, redesign, or custom work is the right fit." },
  ],
  inquiries: {
    enabled: false,
    endpoint: "/api/inquiries",
    successMessage: "Thank you. Your inquiry has been received.",
  },
};

export default businessConfig;

Object.assign(businessConfig, { enabled: true, name: "ARK Web Services", email: "support@arkwebservices.com", website: "https://arkwebservices.com" });

businessConfig.contentEnabled = true;

businessConfig.inquiries.enabled = false;
