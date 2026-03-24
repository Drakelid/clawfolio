export interface MetaData {
  title: string;
  description: string;
  url: string;
}

export interface HeroData {
  name: string;
  role: string;
  taglines: string[];
  coordinates: { lat: string; lng: string };
  socials: { github: string; linkedin: string; twitter: string };
}

export interface Stat {
  label: string;
  value: number;
  suffix: string;
}

export interface AboutData {
  bio: string[];
  stats: Stat[];
  techStack: Record<string, string[]>;
}

export interface ContactData {
  email: string;
}

export interface SiteData {
  meta: MetaData;
  hero: HeroData;
  about: AboutData;
  contact: ContactData;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  gallery: string[];
  tags: string[];
  category: string;
  featured: boolean;
  accent: string;
  links: { live: string; github: string };
}

export interface Experience {
  id: number;
  role: string;
  company: string;
  companyUrl: string | null;
  period: string;
  description: string[];
}
