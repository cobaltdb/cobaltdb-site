export function DatabaseArt() {
  return (
    <div className="database-art">
      <svg
        viewBox="0 0 620 530"
        fill="none"
        role="img"
        aria-labelledby="database-art-title"
      >
        <title id="database-art-title">
          CobaltDB engine connecting an application to SQL, JSON and durable
          storage
        </title>
        <defs>
          <linearGradient
            id="db-side"
            x1="230"
            y1="170"
            x2="430"
            y2="390"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#255fea" />
            <stop offset=".5" stopColor="#164bd3" />
            <stop offset="1" stopColor="#10389c" />
          </linearGradient>
          <linearGradient id="db-top" x1="220" y1="150" x2="420" y2="230">
            <stop stopColor="#5e8cff" />
            <stop offset="1" stopColor="#2e64ef" />
          </linearGradient>
          <linearGradient id="platform" x1="180" y1="350" x2="460" y2="430">
            <stop stopColor="#eaf0ff" />
            <stop offset="1" stopColor="#cedcfc" />
          </linearGradient>
          <filter id="db-shadow" x="-50%" y="-50%" width="200%" height="220%">
            <feGaussianBlur stdDeviation="15" />
          </filter>
          <pattern
            id="art-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
            patternTransform="matrix(1 .5 -1 .5 310 65)"
          >
            <path d="M0 0h36v36" stroke="#b8c8e9" strokeWidth=".7" />
          </pattern>
        </defs>
        <rect
          x="5"
          y="30"
          width="610"
          height="465"
          fill="url(#art-grid)"
          opacity=".45"
        />
        <g className="art-connections" stroke="#91a9db" strokeWidth="1.4">
          <path d="m96 205 110 55v62l94 47" />
          <path d="m431 232 92-46v-64" />
          <path d="m391 362 131 66v-66" />
          <path d="M315 135V69l-80-40" />
          <path d="m193 369-76 39v-54" />
        </g>
        <g className="art-packets" fill="#3567e8">
          <circle r="3">
            <animateMotion
              dur="5s"
              repeatCount="indefinite"
              path="m96 205 110 55v62l94 47"
            />
          </circle>
          <circle r="3">
            <animateMotion
              dur="4s"
              repeatCount="indefinite"
              path="m431 232 92-46v-64"
            />
          </circle>
          <circle r="3">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path="m391 362 131 66v-66"
            />
          </circle>
        </g>
        <ellipse
          cx="324"
          cy="408"
          rx="134"
          ry="26"
          fill="#2c57ac"
          opacity=".18"
          filter="url(#db-shadow)"
        />
        <path
          d="m156 363 162-81 164 82v18l-164 83-162-83Z"
          fill="#c4d4f7"
          stroke="#adc2ed"
        />
        <path
          d="m156 363 162-81 164 82-164 83Z"
          fill="url(#platform)"
          stroke="#b2c7f0"
        />
        <path
          d="m183 362 135-67 136 68-136 68Z"
          fill="#f6f8ff"
          stroke="#b8cbf2"
        />
        <g className="art-core">
          <path
            d="M218 209v125c0 28 46 51 103 51s103-23 103-51V209"
            fill="url(#db-side)"
            stroke="#1646b8"
          />
          <ellipse
            cx="321"
            cy="209"
            rx="103"
            ry="51"
            fill="url(#db-top)"
            stroke="#7da0ff"
          />
          <ellipse
            cx="321"
            cy="209"
            rx="82"
            ry="39"
            stroke="#a0bcff"
            strokeOpacity=".65"
          />
          <ellipse
            cx="321"
            cy="209"
            rx="61"
            ry="28"
            stroke="#c2d3ff"
            strokeOpacity=".7"
          />
          <path
            d="M218 249c0 28 46 51 103 51s103-23 103-51M218 291c0 28 46 51 103 51s103-23 103-51"
            stroke="#8dacff"
            strokeOpacity=".55"
          />
          <path
            d="M236 251v25m0 17v24m0 17v13"
            stroke="#a1bbff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g
            transform="translate(296 190) scale(.82)"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 0-14 13 15 7M44 0l14 13-14 7M33-4 24 25" />
          </g>
          <circle cx="401" cy="330" r="4" fill="#b7fbd4" />
          <text
            x="300"
            y="368"
            fill="#d7e4ff"
            fontSize="10"
            letterSpacing="3"
            fontFamily="monospace"
          >
            COBALTDB
          </text>
        </g>
        <g className="art-chip art-chip-one">
          <path
            d="m47 150 53-27 54 27v38l-54 28-53-28Z"
            fill="#e9efff"
            stroke="#b3c7ee"
          />
          <path d="m47 150 53 27 54-27M100 177v39" stroke="#b3c7ee" />
          <path d="m47 150 53-27 54 27-54 27Z" fill="#fff" stroke="#b3c7ee" />
          <text
            transform="matrix(.95 .48 -.9 .5 82 144)"
            fill="#2153b1"
            fontSize="19"
            fontWeight="600"
            fontFamily="monospace"
          >
            Go
          </text>
          <circle cx="66" cy="176" r="2" fill="#3567e8" />
        </g>
        <g className="art-chip art-chip-two">
          <path
            d="m470 78 53-27 54 27v34l-54 28-53-28Z"
            fill="#e9efff"
            stroke="#b3c7ee"
          />
          <path d="m470 78 53 27 54-27M523 105v35" stroke="#b3c7ee" />
          <path d="m470 78 53-27 54 27-54 27Z" fill="#fff" stroke="#b3c7ee" />
          <text
            transform="matrix(.95 .48 -.9 .5 508 71)"
            fill="#2153b1"
            fontSize="18"
            fontWeight="600"
            fontFamily="monospace"
          >
            SQL
          </text>
        </g>
        <g className="art-chip art-chip-three">
          <path
            d="m470 305 53-27 54 27v34l-54 28-53-28Z"
            fill="#e9efff"
            stroke="#b3c7ee"
          />
          <path d="m470 305 53 27 54-27M523 332v35" stroke="#b3c7ee" />
          <path d="m470 305 53-27 54 27-54 27Z" fill="#fff" stroke="#b3c7ee" />
          <text
            transform="matrix(.95 .48 -.9 .5 504 297)"
            fill="#2153b1"
            fontSize="17"
            fontWeight="600"
            fontFamily="monospace"
          >{`{ }`}</text>
        </g>
        <g
          fill="#687eaa"
          fontSize="10"
          letterSpacing="1.5"
          fontFamily="monospace"
        >
          <text x="48" y="244">
            YOUR APPLICATION
          </text>
          <text x="477" y="162">
            SQL ENGINE
          </text>
          <text x="491" y="391">
            JSON DATA
          </text>
          <text x="255" y="496">
            ONE SMALL FOOTPRINT.
          </text>
        </g>
        <g>
          <circle cx="117" cy="354" r="5" fill="#fff" stroke="#8faadc" />
          <circle cx="235" cy="29" r="5" fill="#fff" stroke="#8faadc" />
        </g>
        <g transform="translate(51 435)">
          <rect width="121" height="28" rx="14" fill="#fff" stroke="#d6e0f3" />
          <circle cx="15" cy="14" r="3" fill="#2c9968" />
          <text
            x="25"
            y="18"
            fontSize="10"
            fill="#50627e"
            fontFamily="monospace"
          >
            CGO_ENABLED=0
          </text>
        </g>
      </svg>
      <div className="art-caption">
        <span>FIG. 01</span> A complete database. Inside your app.
        <span>GO →</span>
      </div>
    </div>
  );
}
