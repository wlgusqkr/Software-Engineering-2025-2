import { useState } from "react";
import AdminLayout from "../components/common/AdminLayout";
import SurveySelector from "../components/Matching/SurveySelector";
import MatchingStats from "../components/Matching/MatchingStats";
import MatchingAction from "../components/Matching/MatchingAction";
import { useMatchingResultsWithStats, useRunMatching } from "../hooks";
import "../styles/dashboard.css";
import "../styles/survey.css";

interface Survey {
  id: number;
  formId: string; // formId 추가
  title: string;
  createdDate: string;
  deadline: string;
  status: "active" | "inactive";
  studentIds: string[];
}

export default function Matching() {
  const [matchingStatus, setMatchingStatus] = useState<string>("");
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);

  // 매칭 실행 결과 조회 (통계 정보 포함)
  const { data: surveysWithStatsData = [] } = useMatchingResultsWithStats();
  const runMatchingMutation = useRunMatching();

  // 설문 목록을 로컬 형식으로 변환
  const surveys: Survey[] = surveysWithStatsData.map((survey, index) => {
    // formId를 숫자로 변환하되, 실패하면 고유한 인덱스 기반 ID 사용
    const parsedId = parseInt(survey.formId);
    const uniqueId =
      !isNaN(parsedId) && parsedId !== 0 ? parsedId : index + 10000;

    return {
      id: uniqueId,
      formId: survey.formId, // formId 저장
      title: survey.title,
      createdDate: survey.createdAt
        ? new Date(survey.createdAt).toISOString().split("T")[0]
        : "",
      deadline: survey.deadline
        ? new Date(survey.deadline).toISOString().split("T")[0]
        : "",
      status: "active", // 서버에서 받은 설문은 모두 활성화된 것으로 간주
      studentIds: [],
    };
  });

  // 선택된 설문의 formId 찾기
  const selectedSurvey = selectedSurveyId
    ? surveys.find((s) => s.id === selectedSurveyId)
    : null;
  const selectedSurveyWithStats = selectedSurvey
    ? surveysWithStatsData.find((s) => s.formId === selectedSurvey.formId)
    : null;

  // 선택된 설문의 응답 데이터 조회 (현재 사용되지 않지만 향후 사용 가능)
  // const { data: responsesData = [] } = useSurveyResponses(
  //   selectedSurveyWithStats?.formId || null
  // );

  const handleRunMatching = async () => {
    if (!selectedSurveyId) {
      alert("매칭할 설문을 선택해주세요.");
      return;
    }

    const survey = surveys.find((s) => s.id === selectedSurveyId);
    if (!survey) {
      alert("선택한 설문을 찾을 수 없습니다.");
      return;
    }

    const surveyWithStats = surveysWithStatsData.find(
      (s) => s.formId === survey.formId
    );
    if (!surveyWithStats) {
      alert("선택한 설문을 찾을 수 없습니다.");
      return;
    }

    const totalParticipants = surveyWithStats.totalParticipants;
    const completedCount = surveyWithStats.completedCount;

    if (totalParticipants < 2) {
      alert(
        "매칭을 실행하려면 최소 2명 이상의 학생이 설문에 포함되어야 합니다."
      );
      return;
    }

    if (completedCount < 2) {
      alert("매칭을 실행하려면 최소 2명 이상의 학생이 설문을 완료해야 합니다.");
      return;
    }

    setMatchingStatus("매칭 알고리즘 실행 중...");

    try {
      const result = await runMatchingMutation.mutateAsync(
        surveyWithStats.formId
      );

      if (result) {
        setMatchingStatus(
          `매칭 완료! ${result.pairs?.length || 0}개의 쌍이 매칭되었습니다.`
        );

        setTimeout(() => {
          window.location.href = `/results?surveyId=${selectedSurveyId}`;
        }, 2000);
      } else {
        setMatchingStatus("매칭 실행에 실패했습니다.");
      }
    } catch (error) {
      console.error("매칭 실행 실패:", error);
      setMatchingStatus("매칭 실행에 실패했습니다.");
    }
  };

  const activeSurveys = surveys.filter((s) => s.status === "active");

  // 선택된 설문의 통계 정보 (서버에서 받은 데이터 사용)
  const getSurveyStats = (surveyId: number) => {
    const survey = surveys.find((s) => s.id === surveyId);
    if (!survey) return { total: 0, completed: 0, rate: 0 };

    const surveyWithStats = surveysWithStatsData.find(
      (s) => s.formId === survey.formId
    );
    if (!surveyWithStats) return { total: 0, completed: 0, rate: 0 };

    const total = surveyWithStats.totalParticipants;
    const completed = surveyWithStats.completedCount;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, rate };
  };

  const stats = selectedSurveyId
    ? getSurveyStats(selectedSurveyId)
    : { total: 0, completed: 0, rate: 0 };

  return (
    <AdminLayout>
      <div className="page-title">매칭 실행</div>

      <div className="matching-info-section">
        <SurveySelector
          surveys={activeSurveys}
          selectedSurveyId={selectedSurveyId}
          onSelectChange={setSelectedSurveyId}
        />

        {selectedSurveyId && (
          <>
            <MatchingStats
              total={stats.total}
              completed={stats.completed}
              rate={stats.rate}
            />

            {stats.completed < 2 && (
              <div className="alert alert-error">
                매칭을 실행하려면 최소 2명 이상의 학생이 설문을 완료해야 합니다.
              </div>
            )}

            {stats.completed >= 2 && (
              <MatchingAction
                isRunning={runMatchingMutation.isPending}
                status={matchingStatus}
                onRun={handleRunMatching}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
