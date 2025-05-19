export default function ProtectedByLit() {
  return (
    <div className="flex items-center justify-center px-6 py-3 border-t border-gray-100">
      <svg
        className="w-3.5 h-3.5 mr-1"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <a
        href="https://litprotocol.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center"
      >
        <p className="text-xs text-black">Protected by </p>
        <img src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
      </a>
    </div>
  );
}
