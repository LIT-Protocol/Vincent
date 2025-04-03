interface LoadingProps {
  copy: string;
  error?: Error;
}

export default function Loading({ copy }: LoadingProps) {
  return (
    <div className="container">
      <div className="wrapper">
        <div className="loader-container">
          <div className="loader"></div>
          <p>{copy}</p>
        </div>
      </div>
    </div>
  );
}
