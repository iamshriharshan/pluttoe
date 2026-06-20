"use client";

import Link from "next/link";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/lib/utils";
import styles from "./page.module.css";

const matchSignals = [
  ["target", "Sector Relevance", "Operators with proven experience in your industry."],
  ["wallet", "Budget Alignment", "Commercial fit with your budget and engagement model."],
  ["globe", "Regional Access", "Local market presence in your target geography."],
  ["chart", "Sales Channel Expertise", "Experience across the channels you want to activate."],
  ["building", "Startup Stage Experience", "Operators who understand early-stage and growth-stage needs."],
  ["message", "Language Compatibility", "Clear communication in your preferred language."],
] as const;

const workflow = [
  ["Define the GTM Requirement", "Submit your product, target market, sales goal, budget, and engagement model."],
  ["Receive Ranked Matches", "Pluto analyzes and ranks operators based on relevance, experience, and commercial fit."],
  ["Review Verified Profile Context", "Evaluate industries, channels, experience, pricing, availability, and proof of execution."],
  ["Approve and Connect", "Start conversations only after identifying the right fit for your growth objective."],
] as const;

type Plan = {
  name: string;
  description: string;
  price: string;
  features: readonly string[];
  action: string;
  featured?: boolean;
  specialist?: boolean;
};

const plans: readonly Plan[] = [
  {
    name: "Startup Basic",
    description: "For early-stage startups exploring GTM options.",
    price: "$49",
    features: ["5 specialist matches per month", "Basic profile access", "Email support", "Standard matching"],
    action: "Get Started",
  },
  {
    name: "Startup Pro",
    description: "For growth-stage startups with active GTM needs.",
    price: "$149",
    features: ["25 specialist matches per month", "Full profile intelligence", "Priority matching", "Chat access & shortlist management", "Email & priority support"],
    action: "Get Started",
    featured: true,
  },
  {
    name: "Startup Scale",
    description: "For startups with ongoing hiring and expansion needs.",
    price: "$299",
    features: ["Unlimited specialist matches", "Advanced matching", "Dedicated account support", "Shortlist management", "Custom requirements"],
    action: "Get Started",
  },
  {
    name: "GTM Specialist",
    description: "For GTM freelancers, consultants, and channel partners.",
    price: "$29",
    features: ["Professional profile", "Marketplace visibility", "Match opportunities", "Performance insights", "Priority support"],
    action: "Join as Specialist",
    specialist: true,
  },
] as const;

function SignalIcon({ name }: { name: (typeof matchSignals)[number][0] }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.7 };

  if (name === "target") return <svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="8" {...common}/><circle cx="14" cy="14" r="2" {...common}/><path d="M14 2v4m0 16v4M2 14h4m16 0h4" {...common}/></svg>;
  if (name === "wallet") return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 7.5h15.5a2 2 0 0 1 2 2v12H7a3 3 0 0 1-3-3v-9a2 2 0 0 1 1-2Z" {...common}/><path d="M6 7.5 19 4v3.5m0 5h5v5h-5a2.5 2.5 0 0 1 0-5Z" {...common}/></svg>;
  if (name === "globe") return <svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="10" {...common}/><path d="M4 14h20M14 4c3 3 4 6.5 4 10s-1 7-4 10c-3-3-4-6.5-4-10s1-7 4-10Z" {...common}/></svg>;
  if (name === "chart") return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 23V17m6 6v-9m6 9V11m6 12V6M4 12l6-5 5 3 8-8m-4 0h4v4" {...common}/></svg>;
  if (name === "building") return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 24h20M6 24V9h9v15m0-11h7v11M9 13h2m-2 4h2m-2 4h2m8-4h1m-1 4h1M9 5h6v4H9Z" {...common}/></svg>;
  return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 6.5h14a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-8l-5 3v-3.2a4 4 0 0 1-3-3.8v-5a4 4 0 0 1 2-4Z" {...common}/><path d="M9 13h.01M14 13h.01M19 13h.01" {...common} strokeWidth="2.4"/></svg>;
}

export default function Home() {
  const { profile } = useAuth();
  const workspaceHref = profile ? getRoleHomePath(profile.role) : "/login";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Pluto home">
          <Image src="/pluto-logo.png" alt="Pluto" width={36} height={36} className={styles.logo} priority />
          <span><strong>Pluto</strong><small>GTM matching platform</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="#home">Home</Link>
          <Link href="#how-it-works">How It Works</Link>
          <Link href={workspaceHref}>For Startups</Link>
          <Link href={workspaceHref}>For GTM Specialists</Link>
          <Link href="#pricing">Pricing</Link>
        </nav>
        <Link href={workspaceHref} className={`${styles.button} ${styles.buttonDark} ${styles.headerCta}`}>
          {profile ? "Open Workspace" : "Create Startup Workspace"}
        </Link>
      </header>

      <main>
        <section id="home" className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>The GTM intelligence platform built to connect startups with verified revenue operators.</h1>
            <p>Pluto enables startups to identify, evaluate, and connect with trusted go-to-market freelancers, channel sales partners, and growth operators based on sector expertise, regional access, budget alignment, and proven execution capability.</p>
            <div className={styles.statement}>Pluto replaces fragmented GTM hiring with a structured, intelligence-led matching system designed for serious market expansion.</div>
            <div className={styles.actions}>
              <Link href={workspaceHref} className={`${styles.button} ${styles.buttonDark}`}>Create startup workspace</Link>
              <Link href={workspaceHref} className={`${styles.button} ${styles.buttonLight}`}>Join as GTM specialist</Link>
            </div>
          </div>

          <div className={styles.signalsCard}>
            <p className={styles.eyebrow}>MATCH SIGNALS</p>
            <div className={styles.signalList}>
              {matchSignals.map(([icon, title, description]) => (
                <div className={styles.signal} key={title}>
                  <span className={styles.signalIcon}><SignalIcon name={icon} /></span>
                  <span><strong>{title}</strong><small>{description}</small></span>
                </div>
              ))}
            </div>
            <div className={styles.signalNote}>
              <span aria-hidden="true">✣</span>
              <p>Every match is evaluated across multiple signals to ensure relevance, alignment, and execution potential.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.workflowSection}>
          <p className={styles.eyebrow}>HOW PLUTO WORKS</p>
          <h2>A disciplined matching workflow for startups that need GTM execution, not generic talent discovery.</h2>
          <div className={styles.workflowGrid}>
            {workflow.map(([title, description], index) => (
              <article className={styles.workflowCard} key={title}>
                <div className={styles.workflowTitle}><span>{index + 1}</span><h3>{title}</h3></div>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.pricingSection}>
          <p className={styles.eyebrow}>PRICING</p>
          <h2>Simple, transparent pricing<br />for startups and GTM specialists.</h2>
          <p className={styles.pricingLead}>Choose the plan that fits your stage and growth ambition.</p>
          <div className={styles.pricingGrid}>
            {plans.map((plan) => (
              <article className={`${styles.planCard} ${plan.specialist ? styles.specialistPlan : ""}`} key={plan.name}>
                {plan.featured && <span className={styles.popular}>Most Popular</span>}
                <h3>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <p className={styles.price}><strong>{plan.price}</strong><span>/month</span></p>
                <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
                <Link href={workspaceHref} className={`${styles.button} ${(plan.featured || plan.specialist) ? styles.buttonDark : styles.buttonLight}`}>{plan.action}</Link>
              </article>
            ))}
          </div>
          <p className={styles.pricingFootnote}>All plans are billed monthly. Cancel anytime.<br />No long-term contracts. No hidden fees.</p>
        </section>
      </main>
    </div>
  );
}
