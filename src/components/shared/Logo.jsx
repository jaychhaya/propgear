export default function Logo({ width = 200 }) {
  return (
    <svg width={width} height={width * 90 / 220} viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 8)">
        <g fill="#4f9cf9">
          <rect x="17" y="0" width="10" height="8" rx="2"/>
          <rect x="17" y="56" width="10" height="8" rx="2"/>
          <rect x="0" y="17" width="8" height="10" rx="2"/>
          <rect x="56" y="17" width="8" height="10" rx="2"/>
          <rect x="6" y="6" width="8" height="8" rx="2" transform="rotate(45 10 10)"/>
          <rect x="46" y="6" width="8" height="8" rx="2" transform="rotate(45 50 10)"/>
          <rect x="6" y="46" width="8" height="8" rx="2" transform="rotate(45 10 50)"/>
          <rect x="46" y="46" width="8" height="8" rx="2" transform="rotate(45 50 50)"/>
        </g>
        <circle cx="32" cy="32" r="24" fill="#4f9cf9"/>
        <circle cx="32" cy="32" r="14" fill="#0d0f14"/>
        <polyline points="22,36 32,24 42,36" fill="none" stroke="#4f9cf9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="25,36 25,42 39,42 39,36" fill="none" stroke="#4f9cf9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <text x="100" y="34" fontFamily="'Sora', sans-serif" fontSize="18" fontWeight="600" fill="#e8eaf0" letterSpacing="-0.5">Prop</text>
      <text x="100" y="54" fontFamily="'Sora', sans-serif" fontSize="18" fontWeight="600" fill="#4f9cf9" letterSpacing="-0.5">Gear</text>
      <text x="100" y="70" fontFamily="monospace" fontSize="9" fill="#555a70" letterSpacing="1.5">Your Portfolio OS</text>
    </svg>
  )
}
