import { useState, useEffect } from "react";
import AdminLayout from "../components/common/AdminLayout";
import ResultsSurveySelector from "../components/Results/ResultsSurveySelector";
import SummaryCards from "../components/Results/SummaryCards";
import ResultsTable from "../components/Results/ResultsTable";
import Pagination from "../components/common/Pagination";
import { useSurveys, useMatchingResultDetail } from "../hooks";
import {
  exportMatchingResultsToCSV,
  sendMatchingResultsEmail,
} from "../api/admin";
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

export default function Results() {
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [maleCurrentPage, setMaleCurrentPage] = useState<number>(1);
  const [femaleCurrentPage, setFemaleCurrentPage] = useState<number>(1);
  const [legacyCurrentPage, setLegacyCurrentPage] = useState<number>(1);
  const itemsPerPage = 10; // 페이지당 표시할 항목 수

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
  const convertMemberToStudent = (member: unknown) => {
    if (!member) {
      return {
        name: "",
        studentId: "",
        email: "",
        gender: "",
        completed: false,
      };
    }

    if (typeof member === "string") {
      return {
        name: member,
        studentId: "",
        email: "",
        gender: "",
        completed: false,
      };
    }

    if (typeof member === "object" && member !== null) {
      const memberObj = member as Record<string, unknown>;
      return {
        name: (memberObj.name as string) || "",
        studentId: (memberObj.studentId as string) || "",
        email: (memberObj.email as string) || "",
        gender: (memberObj.gender as string) || "",
        completed: (memberObj.completed as boolean) || false,
      };
    }

    return {
      name: "",
      studentId: "",
      email: "",
      gender: "",
      completed: false,
    };
  };

  // 남성 결과 변환
  const maleResults: MatchResult[] = (matchingDetail?.maleResults || []).map(
    (item, index) => {
      return {
        id: index + 1,
        roomNumber: item.roomId || `M${String(index + 1).padStart(3, "0")}`,
        studentA: convertMemberToStudent(item.memberA),
        studentB: convertMemberToStudent(item.memberB),
        matchScore:
          typeof item.score === "string"
            ? parseInt(item.score, 10) || 0
            : item.score || 0,
      };
    }
  );

  // 여성 결과 변환
  const femaleResults: MatchResult[] = (
    matchingDetail?.femaleResults || []
  ).map((item, index) => {
    return {
      id: index + 1,
      roomNumber: item.roomId || `F${String(index + 1).padStart(3, "0")}`,
      studentA: convertMemberToStudent(item.memberA),
      studentB: convertMemberToStudent(item.memberB),
      matchScore:
        typeof item.score === "string"
          ? parseInt(item.score, 10) || 0
          : item.score || 0,
    };
  });

  // 기존 형식 호환성 (results가 있는 경우)
  const legacyResults: MatchResult[] = (matchingDetail?.results || []).map(
    (item, index) => {
      return {
        id: index + 1,
        roomNumber: item.roomId || `A${String(index + 1).padStart(3, "0")}`,
        studentA: convertMemberToStudent(item.memberA),
        studentB: convertMemberToStudent(item.memberB),
        matchScore:
          typeof item.score === "string"
            ? parseInt(item.score, 10) || 0
            : item.score || 0,
      };
    }
  );

  const totalResults =
    maleResults.length + femaleResults.length + legacyResults.length;

  // 남성 결과 페이징 계산
  const maleTotalPages = Math.ceil(maleResults.length / itemsPerPage);
  const maleStartIndex = (maleCurrentPage - 1) * itemsPerPage;
  const maleEndIndex = maleStartIndex + itemsPerPage;
  const paginatedMaleResults = maleResults.slice(maleStartIndex, maleEndIndex);

  // 여성 결과 페이징 계산
  const femaleTotalPages = Math.ceil(femaleResults.length / itemsPerPage);
  const femaleStartIndex = (femaleCurrentPage - 1) * itemsPerPage;
  const femaleEndIndex = femaleStartIndex + itemsPerPage;
  const paginatedFemaleResults = femaleResults.slice(
    femaleStartIndex,
    femaleEndIndex
  );

  // 기존 형식 결과 페이징 계산
  const legacyTotalPages = Math.ceil(legacyResults.length / itemsPerPage);
  const legacyStartIndex = (legacyCurrentPage - 1) * itemsPerPage;
  const legacyEndIndex = legacyStartIndex + itemsPerPage;
  const paginatedLegacyResults = legacyResults.slice(
    legacyStartIndex,
    legacyEndIndex
  );

  // 페이지 변경 핸들러
  const handleMalePageChange = (page: number) => {
    if (page >= 1 && page <= maleTotalPages) {
      setMaleCurrentPage(page);
      // 해당 섹션으로 스크롤
      const element = document.getElementById("male-results-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleFemalePageChange = (page: number) => {
    if (page >= 1 && page <= femaleTotalPages) {
      setFemaleCurrentPage(page);
      // 해당 섹션으로 스크롤
      const element = document.getElementById("female-results-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleLegacyPageChange = (page: number) => {
    if (page >= 1 && page <= legacyTotalPages) {
      setLegacyCurrentPage(page);
    }
  };

  // 설문이 변경되면 모든 페이지를 첫 페이지로 리셋
  useEffect(() => {
    setMaleCurrentPage(1);
    setFemaleCurrentPage(1);
    setLegacyCurrentPage(1);
  }, [selectedSurveyId]);

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

  const handleDownloadResults = async () => {
    if (!selectedSurveyId || !selectedFormId) {
      alert("먼저 설문을 선택해주세요.");
      return;
    }

    try {
      const success = await exportMatchingResultsToCSV(selectedFormId);
      if (!success) {
        alert("CSV 다운로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("CSV 다운로드 실패:", error);
      alert("CSV 다운로드 중 오류가 발생했습니다.");
    }
  };

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    if (!selectedSurveyId || !selectedFormId) {
      alert("먼저 설문을 선택해주세요.");
      return;
    }

    if (!confirm("학생들에게 매칭 결과를 이메일로 발송하시겠습니까?")) {
      return;
    }

    setIsSendingEmail(true);
    try {
      const success = await sendMatchingResultsEmail(selectedFormId);
      if (success) {
        alert("이메일 발송이 완료되었습니다.");
      } else {
        alert("이메일 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("이메일 발송 실패:", error);
      alert("이메일 발송 중 오류가 발생했습니다.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 통계 계산 (API에서 받은 데이터 사용)
  const totalParticipants = matchingDetail?.totalParticipants || 0;
  const completedCount = matchingDetail?.completedCount || 0;
  const totalMatched = totalResults * 2;
  const successfulPairs = totalResults;
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

          {totalResults > 0 && (
            <>
              <div className="results-actions">
                <button
                  className="btn-success"
                  id="download-results"
                  onClick={handleDownloadResults}
                >
                  엑셀로 결과 다운로드
                </button>
                <button
                  className="btn-primary"
                  id="send-email-results"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? "발송 중..." : "학생에게 결과 이메일 발송"}
                </button>
              </div>

              {/* 남성 매칭 결과 */}
              {maleResults.length > 0 && (
                <div
                  id="male-results-section"
                  className="gender-results-section"
                >
                  <h3 className="gender-section-title male-section">
                    <span className="gender-icon">👨</span> 남성 매칭 결과 (
                    {maleResults.length}쌍)
                  </h3>
                  {paginatedMaleResults.length > 0 && (
                    <div className="results-table-wrapper">
                      <div className="results-info">
                        전체 {maleResults.length}개 중 {maleStartIndex + 1}-
                        {Math.min(maleEndIndex, maleResults.length)}개 표시
                      </div>
                      <ResultsTable results={paginatedMaleResults} />
                    </div>
                  )}
                  {maleTotalPages > 1 && (
                    <Pagination
                      currentPage={maleCurrentPage}
                      totalPages={maleTotalPages}
                      onPageChange={handleMalePageChange}
                    />
                  )}
                </div>
              )}

              {/* 여성 매칭 결과 */}
              {femaleResults.length > 0 && (
                <div
                  id="female-results-section"
                  className="gender-results-section"
                >
                  <h3 className="gender-section-title female-section">
                    <span className="gender-icon">👩</span> 여성 매칭 결과 (
                    {femaleResults.length}쌍)
                  </h3>
                  {paginatedFemaleResults.length > 0 && (
                    <div className="results-table-wrapper">
                      <div className="results-info">
                        전체 {femaleResults.length}개 중 {femaleStartIndex + 1}-
                        {Math.min(femaleEndIndex, femaleResults.length)}개 표시
                      </div>
                      <ResultsTable results={paginatedFemaleResults} />
                    </div>
                  )}
                  {femaleTotalPages > 1 && (
                    <Pagination
                      currentPage={femaleCurrentPage}
                      totalPages={femaleTotalPages}
                      onPageChange={handleFemalePageChange}
                    />
                  )}
                </div>
              )}

              {/* 기존 형식 호환성 */}
              {legacyResults.length > 0 && (
                <div className="gender-results-section">
                  <h3 className="gender-section-title">
                    매칭 결과 ({legacyResults.length}쌍)
                  </h3>
                  {paginatedLegacyResults.length > 0 && (
                    <div className="results-table-wrapper">
                      <div className="results-info">
                        전체 {legacyResults.length}개 중 {legacyStartIndex + 1}-
                        {Math.min(legacyEndIndex, legacyResults.length)}개 표시
                      </div>
                      <ResultsTable results={paginatedLegacyResults} />
                    </div>
                  )}
                  {legacyTotalPages > 1 && (
                    <Pagination
                      currentPage={legacyCurrentPage}
                      totalPages={legacyTotalPages}
                      onPageChange={handleLegacyPageChange}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {totalResults === 0 && (
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
