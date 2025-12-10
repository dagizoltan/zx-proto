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
    <div class="pagination flex justify-end mt-4">
      <a href={getNextUrl()} class="btn btn-secondary btn-sm">
        Next Page &rarr;
      </a>
    </div>
  );
};
