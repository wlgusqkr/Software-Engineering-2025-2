import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import IdentityVerification from "../components/Survey/IdentityVerification";
import SurveyQuestions from "../components/Survey/SurveyQuestions";
import "../styles/survey.css";

interface Survey {
  id: number;
  title: string;
  students?: SurveyStudent[];
  studentIds: string[];
}

interface SurveyStudent {
  id: string;
  name: string;
  gender: string;
}

// 설문별 학생 데이터 가져오기 함수 (서버 API로 대체 필요)
const getSurveyStudentData = (surveyId: number) => {
  // TODO: 서버 API에서 설문 정보 가져오기
  return [];
};

export default function Survey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const surveyIdNum = surveyId ? parseInt(surveyId, 10) : null;
  
  const [isVerified, setIsVerified] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    wakeup: "",
    bedtime: "",
    smoking: "",
    sleepHabits: "",
    mbti: "",
    major: "",
    specialNotes: "",
  });

  // 이미 제출했는지 확인 (서버 API로 대체 필요)
  useEffect(() => {
    if (studentId && surveyIdNum) {
      // TODO: 서버 API에서 제출 여부 확인
      // const submitted = await checkSubmissionStatus(surveyIdNum, studentId);
      // setIsSubmitted(submitted);
    }
  }, [studentId, surveyIdNum]);

  const handleVerify = () => {
    setVerificationError("");
    if (!studentId || !studentName) {
      setVerificationError("학번과 이름을 모두 입력해주세요.");
      return;
    }

    if (!surveyIdNum) {
      setVerificationError("설문 ID가 없습니다.");
      return;
    }

    // 설문별 학생 정보 확인 (서버 API로 대체 필요)
    // TODO: 서버 API에서 학생 정보 확인
    // const studentData = await getSurveyStudents(surveyIdNum);
    // const student = studentData.find(
    //   (s) => s.id === studentId && s.name === studentName
    // );
    
    // 임시로 항상 인증 성공 (서버 API 연동 필요)
    setIsVerified(true);
    setVerificationError("");
  };

  const handleSubmit = () => {
    if (!isVerified) {
      alert("먼저 신원 확인을 완료해주세요.");
      return;
    }

    if (isSubmitted) {
      alert("이미 제출한 설문입니다. 한 번 제출한 설문은 수정할 수 없습니다.");
      return;
    }

    // 필수 항목 확인
    if (
      !formData.wakeup ||
      !formData.bedtime ||
      !formData.smoking ||
      !formData.sleepHabits
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!surveyIdNum) {
      alert("설문 ID가 없습니다.");
      return;
    }

    // 제출 데이터 서버로 전송 (서버 API로 대체)
    const submissionData = {
      studentId,
      studentName,
      ...formData,
      submittedAt: new Date().toISOString(),
    };
    
    // TODO: 서버 API로 설문 응답 제출
    // await submitSurveyResponse(surveyIdNum, submissionData);
    
    setIsSubmitted(true);
    alert("설문조사가 제출되었습니다!");
  };

  const handleRadioChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleStudentIdChange = (value: string) => {
    setStudentId(value);
    setIsVerified(false);
    setIsSubmitted(false);
  };

  const handleStudentNameChange = (value: string) => {
    setStudentName(value);
    setIsVerified(false);
    setIsSubmitted(false);
  };

  return (
    <div id="survey" className="survey-page">
      <div className="survey-content">
        <div className="survey-intro">
          <div className="page-title">룸메이트 매칭을 위한 기본 설문조사</div>
          <p>최적의 룸메이트 매칭을 위해 솔직하게 답변해 주세요.</p>
        </div>

        <IdentityVerification
          studentId={studentId}
          studentName={studentName}
          isVerified={isVerified}
          isSubmitted={isSubmitted}
          error={verificationError}
          onStudentIdChange={handleStudentIdChange}
          onStudentNameChange={handleStudentNameChange}
          onVerify={handleVerify}
        />

        <SurveyQuestions
          isVerified={isVerified}
          formData={formData}
          onRadioChange={handleRadioChange}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
