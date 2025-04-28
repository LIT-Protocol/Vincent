type StatusAnimationType = 'success' | 'disapproval' | null;

interface StatusAnimationProps {
  type: StatusAnimationType;
}

const StatusAnimation = ({ type }: StatusAnimationProps) => {
  if (!type) return null;

  return (
    <div className='flex justify-center items-center my-4'>
      {type === 'success' && (
        <div className="rounded-full bg-green-100 p-3 h-16 w-16 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default StatusAnimation; 