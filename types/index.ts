export type UserRole = "freelancer" | "startup";

export type UploadKind = "resume" | "portfolio" | "logo";

export type ApplicationStatus =
  | "applied"
  | "chat_approved"
  | "approved"
  | "rejected";

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRecord extends Timestamped {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface UploadedFileAsset {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface FreelancerProfile extends Timestamped {
  id: string;
  fullName: string;
  headline: string;
  focusRole: "GTM";
  skills: string[];
  yearsExperience: number;
  sectors: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  bio: string;
  desiredMonthlyBudget: number;
  resume?: UploadedFileAsset | null;
  portfolioFiles: UploadedFileAsset[];
}

export interface StartupProfile extends Timestamped {
  id: string;
  companyName: string;
  industry: string;
  website?: string;
  teamSize: string;
  about: string;
  logo?: UploadedFileAsset | null;
}

export interface Opportunity extends Timestamped {
  id: string;
  startupId: string;
  title: string;
  description: string;
  industry: string;
  category: string;
  requiredSkills: string[];
  minExperience: number;
  budgetMin: number;
  budgetMax: number;
  status: "open" | "closed";
}

export interface ApplicationRecord extends Timestamped {
  id: string;
  startupId: string;
  freelancerId: string;
  opportunityId: string;
  opportunityTitle: string;
  startupName: string;
  status: ApplicationStatus;
  lastActionAt?: Date | null;
}

export interface MessageRecord extends Timestamped {
  id: string;
  applicationId: string;
  startupId: string;
  freelancerId: string;
  senderId: string;
  senderName: string;
  body: string;
}

export interface RecommendationBreakdown {
  skillsMatch: number;
  experienceMatch: number;
  budgetCompatibility: number;
  industryRelevance: number;
}

export interface RecommendationDetails {
  matchedSkills: string[];
  budgetBand: "excellent" | "good" | "fair" | "poor";
  experienceSummary: string;
  categorySummary: string;
}

export interface AIRecommendation extends Timestamped {
  id: string;
  startupId: string;
  freelancerId: string;
  opportunityId: string;
  score: number;
  breakdown: RecommendationBreakdown;
  details: RecommendationDetails;
}

export interface ProfileBundle {
  user: UserRecord | null;
  freelancer: FreelancerProfile | null;
  startup: StartupProfile | null;
  opportunities: Opportunity[];
  applications: ApplicationRecord[];
}

export interface SessionUser {
  uid: string;
  backend: "firebase" | "local";
}
