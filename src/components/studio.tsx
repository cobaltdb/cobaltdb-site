import { ArrowUpRight } from "lucide-react";

function OxogMark() {
  return (
    <svg
      viewBox="0 0 200 130"
      fill="none"
      aria-hidden="true"
      className="studio-symbol"
    >
      <path
        d="M93 56 72 35C49 13 14 24 9 53 3 84 23 104 46 103"
        stroke="var(--oxog-pink)"
        strokeWidth="12"
      />
      <path
        d="M146 25c24-7 45 10 47 34 3 26-16 46-39 44-14-1-24-11-41-27"
        stroke="var(--oxog-pink)"
        strokeWidth="12"
      />
      <path
        d="M76 18c30-20 75 1 77 40 1 12-1 24-6 33M53 36c-19 41 14 84 50 79 9-1 16-3 22-7"
        stroke="var(--oxog-purple)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="m74 87 54-51"
        stroke="var(--oxog-pink)"
        strokeWidth="12"
        strokeLinecap="square"
      />
    </svg>
  );
}
const projects = [
  {
    name: "AGEZT",
    description: "An agentic operating system",
    href: "https://oxog.net/projects/agezt",
  },
  {
    name: "WrongStack",
    description: "AI coding orchestration",
    href: "https://oxog.net/projects/wrongstack",
  },
  {
    name: "WrongTrace",
    description: "Agent observability",
    href: "https://oxog.net/projects/wrongtrace",
  },
  {
    name: "NineDeploy",
    description: "Self-hosted deployment",
    href: "https://oxog.net/projects/ninedeploy",
  },
];
export function Studio() {
  return (
    <section
      className="studio-section container"
      aria-labelledby="studio-heading"
    >
      <div className="studio-card">
        <a
          className="studio-logo-link"
          href="https://oxog.net/"
          target="_blank"
          rel="noreferrer"
          aria-label="Visit OXOGNET"
        >
          <OxogMark />
        </a>
        <div className="studio-copy">
          <span className="eyebrow">THE PEOPLE BEHIND THE ENGINE</span>
          <p>CobaltDB is built and maintained by</p>
          <h2 id="studio-heading">
            <a href="https://oxog.net/" target="_blank" rel="noreferrer">
              oxog<span>net</span>
              <span className="studio-dot">.</span>
              <ArrowUpRight size={22} />
            </a>
          </h2>
          <p>
            An independent studio in Estonia building AI agents, developer tools
            and the infrastructure behind them. A shared curiosity. A whole
            ecosystem of ideas.
          </p>
          <a
            className="studio-explore"
            href="https://oxog.net/projects"
            target="_blank"
            rel="noreferrer"
          >
            Explore the OXOGNET ecosystem
            <ArrowUpRight size={14} />
          </a>
        </div>
        <nav className="studio-projects" aria-label="More from OXOGNET">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.href}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <strong>{project.name}</strong>
                <small>{project.description}</small>
              </span>
              <ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
      </div>
      <div className="studio-signature">
        <span>OXOGNET OÜ</span>
        <span>Made in Estonia. Built for the world.</span>
      </div>
    </section>
  );
}
