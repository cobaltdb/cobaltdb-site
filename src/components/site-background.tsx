"use client";

import { useEffect, useId, useRef } from "react";
import {
  arcPath,
  BACKGROUND_SCENE as config,
  freezeBackgroundScene,
  mountBackgroundScene,
  objectSeed,
} from "@/lib/background-scene";
import {
  backgroundPreference,
  useBackgroundPreference,
} from "@/lib/background-preference";

/** Persistent ambient + interaction planes. React renders their bounded pools once. */
export function SiteBackground() {
  const ref = useRef<SVGSVGElement>(null);
  const interactionRef = useRef<SVGSVGElement>(null);
  const prefix = `fabric-${useId().replaceAll(":", "")}`;
  const preference = useBackgroundPreference();
  useEffect(() => {
    const svg = ref.current;
    const overlay = interactionRef.current;
    if (!svg || !overlay) return;
    // Read the real preference even on the hydration effect's server snapshot.
    const current = backgroundPreference();
    if (current !== preference) return;
    if (current === "off" || current === "system-off") {
      const freeze = () =>
        freezeBackgroundScene(
          svg,
          overlay,
          current === "off" ? "disabled" : "reduced",
        );
      freeze();
      // Static resizing needs no animation clock or input listeners.
      const observer = new ResizeObserver(freeze);
      observer.observe(svg);
      return () => observer.disconnect();
    }
    return mountBackgroundScene(svg, overlay, prefix, current === "on");
  }, [prefix, preference]);
  return (
    <>
      <svg
        ref={ref}
        className="site-background"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        focusable="false"
        tabIndex={-1}
        data-motion="static"
      >
        <defs>
          <radialGradient id={`${prefix}-glow`} cx="75%" cy="35%" r="80%">
            <stop stopColor="var(--fabric-node)" stopOpacity=".055" />
            <stop offset="1" stopColor="var(--fabric-node)" stopOpacity="0" />
          </radialGradient>
          <g id={`${prefix}-record`}>
            <rect
              x="-18"
              y="-11"
              width="36"
              height="22"
              rx="5"
              fill="var(--fabric-fill)"
              stroke="currentColor"
            />
            <text x="0" y="3" textAnchor="middle" className="fabric-label">
              SQL
            </text>
            <path d="M-12 7h9m4 0h5" stroke="currentColor" opacity=".35" />
          </g>
          <g id={`${prefix}-commit`} stroke="currentColor">
            <path d="m0-13 23 13L0 13-23 0Zm0 6 12 7L0 7-12 0Z" />
            <circle r="2" fill="currentColor" />
          </g>
          <g id={`${prefix}-json`} stroke="currentColor" strokeLinecap="round">
            <path d="M-8-11h-4v7l-4 4 4 4v7h4M8-11h4v7l4 4-4 4v7H8" />
            <path d="M-3-4h6m-6 4h6m-6 4h6" opacity=".5" />
          </g>
          <g id={`${prefix}-store`} stroke="currentColor">
            <ellipse cy="-9" rx="13" ry="6" />
            <path d="M-13-9V9c0 8 26 8 26 0V-9M-13 0c0 8 26 8 26 0" />
          </g>
          <path
            id={`${prefix}-spark`}
            d="m-2 0 2-2 2 2-2 2Z"
            fill="currentColor"
          />
          {Array.from({ length: config.pulse.segments }, (_, index) => (
            <g key={index}>
              <path
                id={`${prefix}-arc-${index}`}
                d={arcPath(index)}
                stroke="currentColor"
                vectorEffect="non-scaling-stroke"
              />
              <path
                id={`${prefix}-hex-${index}`}
                d={arcPath(index, true)}
                stroke="currentColor"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
          {Array.from({ length: config.routes.full }, (_, index) => (
            <linearGradient
              key={index}
              id={`${prefix}-route-${index}`}
              className="fabric-route-gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="1600"
              y2="0"
            >
              {Array.from({ length: config.routes.stops }, (_, step) => (
                <stop
                  key={step}
                  offset={step / (config.routes.stops - 1)}
                  stopColor="var(--fabric-line)"
                  stopOpacity={step && step < config.routes.stops - 1 ? 0.2 : 0}
                />
              ))}
            </linearGradient>
          ))}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${prefix}-glow)`} />
        <g className="fabric-field" opacity={config.idle.opacity}>
          <g className="fabric-routes">
            {Array.from({ length: config.routes.full }, (_, index) => (
              <path
                key={index}
                className="fabric-route"
                data-wide={index >= config.routes.compact || undefined}
                d={`M0 ${index * 95 - 120} 1600 ${index * 95 + (index % 2 ? 360 : -600)}`}
                stroke={`url(#${prefix}-route-${index})`}
                strokeWidth=".9"
              />
            ))}
          </g>
          <g className="fabric-packets" fill="var(--fabric-node)">
            {Array.from({ length: config.routes.full }, (_, index) => (
              <rect
                key={index}
                className="fabric-packet"
                data-wide={index >= config.routes.compact || undefined}
                x="-5"
                y="-1"
                width="10"
                height="2"
                rx="1"
                opacity="0"
              />
            ))}
          </g>
          <g className="fabric-objects" strokeWidth=".8">
            {Array.from({ length: config.objects.full }, (_, index) => {
              const seed = objectSeed(index);
              return (
                <g
                  key={index}
                  className="fabric-object"
                  data-wide={index >= config.objects.compact || undefined}
                  transform={`translate(${seed.x * 1600} ${seed.y * 1000})`}
                  opacity=".55"
                >
                  <use
                    href={`#${prefix}-${["record", "commit", "json", "store"][index % 4]}`}
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <svg
        ref={interactionRef}
        className="site-interaction"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        focusable="false"
        tabIndex={-1}
      >
        <defs>
          <radialGradient id={`${prefix}-pointer-light`}>
            <stop stopColor="var(--fabric-node)" stopOpacity=".12" />
            <stop
              offset=".28"
              stopColor="var(--fabric-node)"
              stopOpacity=".065"
            />
            <stop
              offset=".65"
              stopColor="var(--fabric-accent)"
              stopOpacity=".025"
            />
            <stop offset="1" stopColor="var(--fabric-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="fabric-pointer" opacity="0">
          <circle
            r={config.pointer.lightRadius}
            fill={`url(#${prefix}-pointer-light)`}
          />
          <ellipse
            rx="38"
            ry="24"
            stroke="var(--fabric-accent)"
            strokeWidth=".8"
            opacity=".25"
          />
          <ellipse
            rx="68"
            ry="43"
            stroke="var(--fabric-node)"
            strokeWidth=".65"
            opacity=".13"
          />
        </g>
        <g
          className="fabric-trails"
          stroke="var(--fabric-accent)"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          {Array.from({ length: config.trail.max }, (_, index) => (
            <path key={index} className="fabric-trail" opacity="0" />
          ))}
        </g>
        <g className="fabric-responses" strokeWidth="1.1">
          {Array.from({ length: config.objects.full }, (_, index) => (
            <g
              key={index}
              className="fabric-response"
              data-wide={index >= config.objects.compact || undefined}
              opacity="0"
            >
              <use
                href={`#${prefix}-${["record", "commit", "json", "store"][index % 4]}`}
              />
            </g>
          ))}
        </g>
        <g className="fabric-effects">
          {Array.from({ length: config.pulse.max }, (_, index) => (
            <g
              className="fabric-pulse"
              key={index}
              data-wide={index >= config.pulse.compactMax || undefined}
            >
              {[0, 1].map((ring) => (
                <g key={ring} className="fabric-ring">
                  {Array.from(
                    { length: config.pulse.segments },
                    (_, segment) => (
                      <use
                        key={segment}
                        href={`#${prefix}-arc-${segment}`}
                        strokeWidth="1.5"
                        opacity="0"
                      />
                    ),
                  )}
                </g>
              ))}
              {Array.from({ length: config.sparks.count }, (_, spark) => (
                <use
                  key={spark}
                  className="fabric-spark"
                  data-wide={spark >= config.sparks.compactCount || undefined}
                  href={`#${prefix}-spark`}
                  opacity="0"
                />
              ))}
            </g>
          ))}
        </g>
      </svg>
    </>
  );
}
