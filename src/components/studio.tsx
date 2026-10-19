import { ArrowUpRight } from "lucide-react";
import { OxogMark } from "./oxog-mark";

export function Studio() {
  return (
    <div className="container">
      <a className="studio" href="https://oxog.net">
        <OxogMark />
        <div>
          <span className="eyebrow">PART OF A BIGGER PICTURE</span>
          <h2>
            Small studio. <span>Big ideas.</span>
          </h2>
          <p>Explore the tools and infrastructure from Oxog.</p>
        </div>
        <span className="studio-link">
          Meet oxog.net <ArrowUpRight size={18} />
        </span>
      </a>
    </div>
  );
}
