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
  services: {
    id: string;
    title: string;
    description: string;
    details?: string[];
    symptom?: string;
    summary?: string;
    linkLabel?: string;
  }[];
  projects: {
    id: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    credit?: string;
    demo?: boolean;
  }[];
  testimonials: { quote: string; name: string; detail?: string; image?: string; publicationApproved?: boolean; imageApproved?: boolean }[];
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
    background: "#ffffff",
    foreground: "#0d1117",
    accent: "#ff5a1f",
    muted: "#47515e",
    headingFont: "'Geist', sans-serif",
    bodyFont: "'Geist', sans-serif",
  },
  hero: {
    heading: "Get your website back on track.",
    body:
      "ARK repairs WordPress sites, redesigns websites that are hard to use, builds custom features, and takes on one-time SEO projects.",
  },
  about:
    "ARK Web Services is a Charlotte-based web studio helping service businesses improve how their sites work and how clearly they explain their services. We scope each project around the problem at hand, with practical recommendations and straightforward project work.",
  services: [
    {
      id: "wordpress-rescue",
      title: "WordPress rescue",
      description: "Fix slow pages, broken layouts, and site issues that get in the way of using your website.",
      symptom: "WordPress errors or broken pages",
      summary: "Your WordPress site shows errors or pages no longer display correctly.",
      linkLabel: "See WordPress rescue",
      details: ["Review the current site and agree on the specific issues to address.", "Repair and refine the agreed WordPress pages and functionality.", "Walk through the completed changes and next steps."],
    },
    {
      id: "website-redesign",
      title: "Website redesign",
      description: "Rework an outdated or unclear website around your services, customers, and next steps.",
      symptom: "Looks dated or customers can't find things",
      summary: "Customers have trouble finding what you offer or how to contact you.",
      linkLabel: "See website redesign",
      details: ["Clarify the audience, services, and actions each page should support.", "Restructure and redesign the agreed pages.", "Prepare the site for launch with the agreed content and technical setup."],
    },
    {
      id: "custom-website-development",
      title: "Custom development",
      description: "Build a tailored website feature or web application when an off-the-shelf setup does not fit.",
      symptom: "Needs a feature or integration",
      summary: "Your site needs a feature or integration that a theme or plugin can’t provide.",
      linkLabel: "See custom development",
      details: ["Define the user need and technical scope before work begins.", "Build and review the agreed feature or application.", "Document the delivered work and handoff requirements."],
    },
    {
      id: "seo-for-service-businesses",
      title: "SEO foundations",
      description: "Set up clear service-page structure and local search signals as a focused project.",
      symptom: "Customers can't find us on Google",
      summary: "A one-time project for sites without clear pages for the services and locations they cover.",
      linkLabel: "See SEO foundations",
      details: ["Map priority services and locations to relevant pages.", "Improve page titles, headings, internal links, and technical basics.", "Provide a practical handoff for maintaining the site after the project."],
    },
  ],
  projects: [],
  // Preserved legacy records. Set approval flags only after confirming permission.
  testimonials: [
    {
      quote: "Ark Web Services is the best web design service I've ever used. Not only was my website delivered on time, it was better than I was expecting. They were able to enhance my vision and bring my dream to a reality.",
      name: "Cedric P.",
      detail: "CEO, Presidential Consulting",
      image: "/assets/client/cedric-p.webp",
      publicationApproved: false,
      imageApproved: false,
    },
    {
      quote: "The team has exceeded our expectations, from their attention to detail to their competitive analysis. Their communication is excellent, with flexible scheduling and timely meetings. Their reliability and quality of work are highly recommendable.",
      name: "Dominic S.",
      detail: "CMO, Pick A Pro",
      image: "/assets/client/dominic-s.webp",
      publicationApproved: false,
      imageApproved: false,
    },
  ],
  process: [
    { title: "Review", description: "Send us your website and tell us what’s getting in the way. We’ll look at the issue you describe." },
    { title: "Scope", description: "We outline the work, timeline, and project price before you decide whether to proceed." },
    { title: "Build", description: "We make the agreed changes and walk you through the work at handoff." },
  ],
  faqs: [
    { question: "Can you work on my existing site?", answer: "Yes. Send us the address and explain the problem. We’ll look at whether it calls for a repair or a larger change." },
    { question: "When will I know the price?", answer: "Pricing depends on the work involved. You’ll get a written scope and project price before work begins." },
    { question: "Is SEO foundations an ongoing service?", answer: "It’s a one-time project focused on how your site is organized around your services and locations." },
    { question: "Do you work with businesses outside Charlotte?", answer: "Yes. ARK is based in Charlotte and works with service businesses across the United States." },
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
