import Link from "next/link";
import { ArrowRight } from "lucide-react";
export default function NotFound() {
  return (
    <main id="main" className="not-found container">
      <span className="eyebrow">ERROR 404 · ROW NOT FOUND</span>
      <h1>
        This page isn’t
        <br />
        in the database.
      </h1>
      <p>The link may have moved. Let’s get you back to building.</p>
      <Link className="button primary" href="/">
        Back to home
        <ArrowRight size={16} />
      </Link>
      <Link className="text-link" href="/docs/getting-started/">
        Read the documentation
        <ArrowRight size={16} />
      </Link>
    </main>
  );
}
