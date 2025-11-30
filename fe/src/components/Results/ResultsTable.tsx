import "../../styles/common.css";
import "../../styles/results.css";

interface MatchResult {
  id: number;
  roomNumber: string;
  studentA: {
    name: string;
    studentId: string;
    email: string;
    gender: string;
    completed: boolean;
  };
  studentB: {
    name: string;
    studentId: string;
    email: string;
    gender: string;
    completed: boolean;
  };
  matchScore: number;
}

interface ResultsTableProps {
  results: MatchResult[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const getScoreClass = (score: number) => {
    if (score === 0) return "zero";
    if (score >= 90) return "high";
    if (score >= 80) return "medium";
    if (score >= 50) return "low";
    return "very-low";
  };

  return (
    <div className="results-table-container">
      <table className="data-table" id="results-table">
        <thead>
          <tr>
            <th>방 번호</th>
            <th>학생 A 정보</th>
            <th>학생 B 정보</th>
            <th>매칭 점수</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id}>
              <td>{result.roomNumber}</td>
              <td>
                <div className="student-info">
                  {result.studentA?.name && result.studentA?.studentId ? (
                    <>
                      <div className="student-name-id">
                        {result.studentA.name} ({result.studentA.studentId})
                      </div>
                      {result.studentA.email && (
                        <div className="student-email">
                          {result.studentA.email}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="student-empty">미배정</div>
                  )}
                </div>
              </td>
              <td>
                <div className="student-info">
                  {result.studentB?.name && result.studentB?.studentId ? (
                    <>
                      <div className="student-name-id">
                        {result.studentB.name} ({result.studentB.studentId})
                      </div>
                      {result.studentB.email && (
                        <div className="student-email">
                          {result.studentB.email}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="student-empty">미배정</div>
                  )}
                </div>
              </td>
              <td>
                <span
                  className={`match-score ${getScoreClass(result.matchScore)}`}
                >
                  {result.matchScore}점
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
