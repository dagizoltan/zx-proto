import { h } from 'preact';

export const PaginationControls = ({ nextCursor, baseUrl, currentUrl }) => {
  if (!nextCursor) return null;

  // URL helper to preserve existing query params
  const getNextUrl = () => {
    // SSR guard
    const base = typeof window !== 'undefined' ? window.location.href : 'http://dummy.com';
    const url = new URL(baseUrl || currentUrl || base, 'http://dummy.com');
    url.searchParams.set('cursor', nextCursor);
    return `${url.pathname}${url.search}`;
  };

  return (
    <div class="pagination-controls">
      <a href={getNextUrl()} class="btn btn-secondary btn-sm">
        Next Page &rarr;
      </a>

      <style>{`
        .pagination-controls { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
        .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
      `}</style>
    </div>
  );
};
