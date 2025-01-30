'use client';

interface ButtonSyncProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
}

export default function ButtonSync({ onClick, isLoading }: ButtonSyncProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        btn btn-primary
        ${isLoading ? 'loading' : ''}
        flex items-center gap-2
      `}
    >
      {!isLoading && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
        </svg>
      )}
      {isLoading ? 'Syncing to Pinecone...' : 'Sync Knowledge Base'}
    </button>
  );
} 