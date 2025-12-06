import { motion } from 'framer-motion';

export function ScrollIndicator() {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={{
        y: [0, 10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Mouse Icon */}
      <div className="w-6 h-10 border-2 border-gray-900 dark:border-white rounded-full p-1 flex justify-center">
        <motion.div
          className="w-1 h-2 rounded-full"
          style={{ backgroundColor: '#FF4205' }}
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      {/* Down Arrow */}
      <svg
        className="w-4 h-4 text-gray-900 dark:text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </motion.div>
  );
}
