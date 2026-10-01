export default function LogoMark({ className = '' }) {
  return (
    <svg
      className={`logo-mark ${className}`.trim()}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="logo-mark-ring"
        d="M32 3 47 7 58 19 61 34 54 50 41 60 24 60 10 51 3 36 7 19 18 8 32 3Z"
      />
      <path
        className="logo-mark-mesh"
        d="M32 3 22 22 7 19M32 3 43 22 58 19M18 8 43 22 61 34M47 7 22 22 3 36M22 22 43 22 54 50M22 22 25 38 10 51M43 22 25 38 41 60M3 36 25 38 54 50M61 34 25 38 24 60M10 51 41 60M54 50 24 60"
      />
      <circle cx="25" cy="38" r="2.4" className="logo-mark-node" />
    </svg>
  )
}
