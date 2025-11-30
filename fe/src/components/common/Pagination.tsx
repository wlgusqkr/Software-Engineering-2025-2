import "../../styles/common.css";

interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: PaginationProps) {
  // 페이지 번호 생성 (최대 10개까지만 표시)
  const getPageNumbers = () => {
    const maxVisiblePages = 10;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 10개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변만 표시
      if (currentPage <= 5) {
        // 앞부분
        for (let i = 1; i <= 7; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 4) {
        // 뒷부분
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 6; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 중간
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange?.(currentPage - 1)}
      >
        이전
      </button>
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ...
            </span>
          );
        }
        return (
          <button
            key={page}
            className={`pagination-btn ${page === currentPage ? "active" : ""}`}
            onClick={() => onPageChange?.(page as number)}
          >
            {page}
          </button>
        );
      })}
      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
      >
        다음
      </button>
    </div>
  );
}

