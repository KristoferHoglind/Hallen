import { useMemo, useState } from "react";

type UsePaginationOptions<T> = {
  items: T[];
  pageSize: number;
};

export function usePagination<T>({ items, pageSize }: UsePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, pageSize, safeCurrentPage]);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  function goToFirstPage() {
    setCurrentPage(1);
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }

  return {
    currentPage: safeCurrentPage,
    totalPages,
    pagedItems,
    goToPage,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
  };
}