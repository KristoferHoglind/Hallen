import { Pagination } from "react-bootstrap";

type MatchPaginationProps = {
  currentPage: number;
  totalPages: number;
  onChangePage: (page: number) => void;
};

export function MatchPagination({
  currentPage,
  totalPages,
  onChangePage,
}: MatchPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="d-flex justify-content-center mt-3">
      <Pagination className="mb-0">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        />

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <Pagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => onChangePage(page)}
            >
              {page}
            </Pagination.Item>
          ),
        )}

        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        />
      </Pagination>
    </div>
  );
}