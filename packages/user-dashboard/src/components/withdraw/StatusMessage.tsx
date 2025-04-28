import React from 'react';
import { StatusType } from './types';

interface StatusMessageProps {
  message: string | null;
  type: StatusType;
}

const STATUS_TYPES = {
  info: 'bg-[#f0f7ff] border border-[#d8e4fa] text-[#000000]',
  warning: 'bg-[#fff9e6] border border-[#fff3bf] text-[#9a6700]',
  success: 'bg-[#f0fff4] border border-[#d3f9d8] text-[#1a7f37]',
  error: 'bg-[#fff2f0] border border-[#ffcecb] text-[#cf222e]',
};

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-center px-4 py-2.5 mb-4 rounded-lg text-sm leading-6 max-w-full min-h-[48px] opacity-100 transition-[background-color,color,border-color,opacity] duration-300 ease-in-out ${STATUS_TYPES[type]}`}
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
};

export default StatusMessage;
