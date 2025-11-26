import { useState, useEffect } from "react";
import AdminLayout from "../components/common/AdminLayout";
import ResultsSurveySelector from "../components/Results/ResultsSurveySelector";
import SummaryCards from "../components/Results/SummaryCards";
import ResultsTable from "../components/Results/ResultsTable";
import Pagination from "../components/common/Pagination";
import { useSurveys, useMatchingResultDetail } from "../hooks";
import "../styles/common.css";
import "../styles/results.css";
import "../styles/dashboard.css";

interface Survey {
  id: number;
  formId?: string; // formId 추가
  title: string;
  deadline: string;
  status: "active" | "inactive";
}

interface MatchResult {
  id: number;
  roomNumber: string;
  studentA: string;
  studentB: string;
  matchScore: number;
}

export default function Results() {
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);

  // 설문 목록 조회
  const { data: surveysData = [] } = useSurveys();

  // 설문 목록을 로컬 형식으로 변환 (매칭 결과가 있는 설문만)
  const surveys: Survey[] = surveysData.map((survey, index) => {
    const surveyWithExtras = survey as typeof survey & {
      formId?: string;
      deadline?: string;
    };
    // survey.id를 안전하게 숫자로 변환, 실패하면 인덱스 기반 고유 ID 사용
    const numericId = parseInt(survey.id, 10);
    const uniqueId =
      !isNaN(numericId) && numericId !== 0 ? numericId : index + 1;

    return {
      id: uniqueId,
      formId: surveyWithExtras.formId || survey.id, // formId 저장
      title: survey.title,
      deadline: surveyWithExtras.deadline
        ? new Date(surveyWithExtras.deadline).toISOString().split("T")[0]
        : "",
      status: survey.status === "published" ? "active" : "inactive",
    };
  });

  // 선택된 설문의 formId 찾기
  const selectedSurvey = selectedSurveyId
    ? surveys.find((s) => s.id === selectedSurveyId)
    : null;
  const selectedFormId = selectedSurvey?.formId || null;

  // 매칭 결과 상세 조회 (통계 정보 포함)
  const { data: matchingDetail, isLoading: isLoadingResults } =
    useMatchingResultDetail(selectedFormId);

  // 매칭 결과를 로컬 형식으로 변환
  const results: MatchResult[] = (matchingDetail?.results || []).map(
    (item, index) => {
      // memberA와 memberB가 객체인 경우 문자열로 변환
      const getStudentString = (
        member: string | { studentId?: string; name?: string } | undefined
      ): string => {
        if (!member) return "";
        if (typeof member === "string") return member;
        // 객체인 경우 studentId 또는 name을 사용
        return member.studentId || member.name || JSON.stringify(member);
      };

      return {
        id: index + 1,
        roomNumber: item.roomId || `A${String(index + 1).padStart(3, "0")}`,
        studentA: getStudentString(item.memberA),
        studentB: getStudentString(item.memberB),
        matchScore: item.score || 0,
      };
    }
  );

  // URL 파라미터에서 설문 ID 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const surveyIdParam = urlParams.get("surveyId");
    if (surveyIdParam) {
      const surveyId = parseInt(surveyIdParam, 10);
      if (!isNaN(surveyId)) {
        // 비동기로 상태 업데이트하여 경고 방지
        setTimeout(() => {
          setSelectedSurveyId(surveyId);
        }, 0);
      }
    }
  }, []);

  const handleEditMatch = (matchId: number) => {
    alert(`매칭 ${matchId} 수정 기능 (구현 예정)`);
  };

  const handleDownloadResults = () => {
    if (!selectedSurveyId) {
      alert("먼저 설문을 선택해주세요.");
      return;
    }
    alert("엑셀 다운로드 기능 (구현 예정)");
  };

  // 통계 계산 (API에서 받은 데이터 사용)
  const totalParticipants = matchingDetail?.totalParticipants || 0;
  const completedCount = matchingDetail?.completedCount || 0;
  const totalMatched = results.length * 2;
  const successfulPairs = results.length;
  const successRate =
    totalParticipants > 0
      ? Math.round((completedCount / totalParticipants) * 100)
      : 0;
  const unmatched = totalParticipants - totalMatched;

  return (
    <AdminLayout>
      <div className="page-title">매칭 결과 검토</div>

      <div className="matching-info-section">
        <ResultsSurveySelector
          surveys={surveys}
          selectedSurveyId={selectedSurveyId}
          onSelectChange={setSelectedSurveyId}
        />
      </div>

      {selectedSurveyId && isLoadingResults && (
        <div className="alert alert-info">매칭 결과를 불러오는 중...</div>
      )}

      {selectedSurveyId && !isLoadingResults && matchingDetail && (
        <>
          <SummaryCards
            totalMatched={totalMatched}
            successfulPairs={successfulPairs}
            successRate={successRate}
            unmatched={unmatched}
          />

          {results.length > 0 && (
            <>
              <div className="results-actions">
                <button
                  className="btn-success"
                  id="download-results"
                  onClick={handleDownloadResults}
                >
                  엑셀로 결과 다운로드
                </button>
              </div>

              <ResultsTable results={results} onEdit={handleEditMatch} />

              <Pagination />
            </>
          )}

          {results.length === 0 && (
            <div className="alert alert-info">
              선택한 설문에 매칭 결과가 없습니다.
            </div>
          )}
        </>
      )}

      {selectedSurveyId && !isLoadingResults && !matchingDetail && (
        <div className="alert alert-info">
          선택한 설문에 매칭 결과가 없습니다.
        </div>
      )}

      {!selectedSurveyId && (
        <div className="alert alert-info">
          매칭 결과를 보려면 위에서 설문을 선택해주세요.
        </div>
      )}
    </AdminLayout>
  );
}
