import React from 'react';

interface BackButtonProps {
  label: string;
  onClick: () => void;
}

/**
 * A consistent back button component with an arrow icon
 */
export const BackButton: React.FC<BackButtonProps> = ({ label, onClick }) => {
  return (
    <button
      className="flex items-center font-medium text-black hover:text-gray-800 p-1"
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
};

export default BackButton;
