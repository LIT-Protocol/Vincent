import LoadingLock from './LoadingLock';

interface LoadingProps {
  text?: string;
}

export default function Loading({ text }: LoadingProps) {
  return (
    <div
      className="flex items-center justify-center w-full h-full absolute inset-0"
      style={{ marginTop: '-10vh' }}
    >
      <LoadingLock text={text} />
    </div>
  );
}
