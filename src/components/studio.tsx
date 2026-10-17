import { ArrowUpRight } from "lucide-react";
import { OxogMark } from "./oxog-mark";

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
