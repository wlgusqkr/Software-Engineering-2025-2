import { useState, useRef } from "react";
import AdminLayout from "../components/common/AdminLayout";
import SurveyListTable from "../components/SurveyManagement/SurveyListTable";
import SurveyForm from "../components/SurveyManagement/SurveyForm";
import { createSurvey } from "../api/admin";
import { parseExcelFile } from "../utils/excelParser";
import "../styles/survey-management.css";

interface Survey {
  id: number;
  title: string;
  createdDate: string;
  deadline: string;
  status: "active" | "inactive";
  studentIds: string[]; // 설문에 참여할 학생 ID 목록
  students: SurveyStudent[]; // 설문별 학생 상세 정보
  questions: Question[];
}

interface SurveyStudent {
  id: string;
  name: string;
  gender: string;
}

interface Question {
  id: number;
  text: string;
  type: "multiple-choice" | "text-input";
}

export default function SurveyManagement() {
  // 설문 목록은 서버에서 가져옴 (로컬 스토리지 제거)
  const getSurveys = (): Survey[] => {
    return [];
  };

  // 고정된 질문 목록
  const fixedQuestions: Question[] = [
    { id: 1, text: "기상 시간은 언제인가요?", type: "multiple-choice" },
    { id: 2, text: "취침 시간은 언제인가요?", type: "multiple-choice" },
    { id: 3, text: "흡연 여부", type: "multiple-choice" },
    { id: 4, text: "수면 습관 (코골이, 이갈이 등)", type: "multiple-choice" },
    { id: 5, text: "MBTI", type: "text-input" },
    { id: 6, text: "전공", type: "text-input" },
    { id: 7, text: "특이사항 또는 요청사항", type: "text-input" },
  ];

  const [surveys, setSurveys] = useState<Survey[]>(getSurveys());
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDeadline, setSurveyDeadline] = useState("");
  const [surveyStudents, setSurveyStudents] = useState<SurveyStudent[]>([]);
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGender, setNewStudentGender] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleEditSurvey = (surveyId: number) => {
    alert(`설문 ${surveyId} 수정 기능 (구현 예정)`);
  };

  const handleDeleteSurvey = (surveyId: number) => {
    if (confirm(`설문 ${surveyId}를 삭제하시겠습니까?`)) {
      alert("삭제 완료 (구현 예정)");
    }
  };

  const handleAddStudent = () => {
    if (!newStudentId || !newStudentName || !newStudentGender) {
      alert("학번, 이름, 성별을 모두 입력해주세요.");
      return;
    }

    // 중복 확인
    if (surveyStudents.some((s) => s.id === newStudentId)) {
      alert("이미 추가된 학번입니다.");
      return;
    }

    const newStudent: SurveyStudent = {
      id: newStudentId,
      name: newStudentName,
      gender: newStudentGender,
    };

    setSurveyStudents([...surveyStudents, newStudent]);

    // 입력 필드 초기화
    setNewStudentId("");
    setNewStudentName("");
    setNewStudentGender("");
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm("이 학생을 목록에서 제거하시겠습니까?")) {
      setSurveyStudents(surveyStudents.filter((s) => s.id !== studentId));
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadExcel = async () => {
    // 파일 선택 다이얼로그 열기
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // 엑셀 파일 확장자 확인
    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      alert("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);

    try {
      // 프론트엔드에서 엑셀 파일 파싱
      const parsedStudents = await parseExcelFile(file);

      if (parsedStudents.length === 0) {
        alert("엑셀 파일에서 학생 데이터를 찾을 수 없습니다.");
        return;
      }

      // 파싱된 학생 데이터를 SurveyStudent 형식으로 변환
      const newStudents: SurveyStudent[] = parsedStudents.map((student) => ({
        id: student.id,
        name: student.name,
        gender:
          student.gender === "M"
            ? "남"
            : student.gender === "F"
            ? "여"
            : student.gender,
      }));

      // 기존 학생 목록과 병합 (중복 제거)
      const existingIds = new Set(surveyStudents.map((s) => s.id));
      const uniqueNewStudents = newStudents.filter(
        (s) => !existingIds.has(s.id)
      );

      if (uniqueNewStudents.length === 0) {
        alert("모든 학생이 이미 추가되어 있습니다.");
        return;
      }

      // 학생 목록에 추가
      setSurveyStudents([...surveyStudents, ...uniqueNewStudents]);

      alert(
        `엑셀 파일에서 ${parsedStudents.length}명의 학생을 찾았습니다.\n${uniqueNewStudents.length}명이 추가되었습니다.`
      );
    } catch (error) {
      console.error("엑셀 파일 파싱 실패:", error);
      alert(
        `엑셀 파일 파싱에 실패했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setIsUploading(false);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveSurvey = async () => {
    if (!surveyTitle || !surveyDeadline) {
      alert("설문 제목과 마감일을 입력해주세요.");
      return;
    }
    if (surveyStudents.length === 0) {
      alert("최소 1명 이상의 학생을 추가해주세요.");
      return;
    }

    // 마감일을 ISO 형식으로 변환 (날짜만 입력된 경우 시간 추가)
    let deadlineISO = surveyDeadline;
    if (!deadlineISO.includes("T")) {
      deadlineISO = `${surveyDeadline}T23:59:59`;
    }

    // 참여자 데이터 변환 (서버 API 형식)
    const participants = surveyStudents.map((s) => ({
      studentNo: s.id,
      name: s.name,
      gender: s.gender as "남" | "여",
    }));

    // 질문 데이터 변환 (서버 API 형식)
    const fields = fixedQuestions.map((q, index) => {
      const field: {
        id: string;
        title: string;
        type: "multiple-choice" | "boolean" | "text";
        options?: string[];
      } = {
        id: `q${index + 1}`,
        title: q.text,
        type: q.type === "multiple-choice" ? "multiple-choice" : "text",
      };

      // multiple-choice 타입인 경우 options 추가
      if (q.type === "multiple-choice") {
        // 질문별 옵션 설정
        if (q.text.includes("기상 시간")) {
          field.options = ["6시 이전", "6시-8시", "8시-10시", "10시 이후"];
        } else if (q.text.includes("취침 시간")) {
          field.options = ["22시 이전", "22시-24시", "24시 이후"];
        } else if (q.text.includes("흡연")) {
          field.options = ["예", "아니오"];
        } else if (q.text.includes("수면 습관")) {
          field.options = ["코골이", "이갈이", "없음"];
        } else {
          field.options = ["선택지1", "선택지2", "선택지3", "기타"];
        }
      }

      return field;
    });

    // 서버로 설문 생성 요청 (저장 상태)
    try {
      const createdSurvey = await createSurvey({
        title: surveyTitle,
        deadline: deadlineISO,
        link: "",
        participants,
        fields,
      });

      if (!createdSurvey) {
        alert("설문 저장에 실패했습니다.");
        return;
      }

      // 난수 ID 생성 (로컬 상태 관리용)
      const surveyId = crypto.randomUUID();

      // 로컬 상태 업데이트
      const newSurvey: Survey = {
        id: parseInt(surveyId.split("-")[0], 16) % 1000000, // UUID를 숫자로 변환 (임시)
        title: surveyTitle,
        createdDate: new Date().toISOString().split("T")[0],
        deadline: surveyDeadline,
        status: "inactive",
        studentIds: surveyStudents.map((s) => s.id),
        students: surveyStudents,
        questions: fixedQuestions,
      };

      // 로컬 상태 업데이트 (서버에 저장되므로 로컬 스토리지 불필요)
      const updatedSurveys = [...surveys, newSurvey];
      setSurveys(updatedSurveys);

      // 폼 초기화
      setSurveyTitle("");
      setSurveyDeadline("");
      setSurveyStudents([]);

      alert("설문이 저장되었습니다.");
    } catch (error) {
      console.error("설문 저장 실패:", error);
      alert("설문 저장에 실패했습니다.");
    }
  };

  const handleDeploySurvey = async () => {
    if (!surveyTitle || !surveyDeadline) {
      alert("설문 제목과 마감일을 입력해주세요.");
      return;
    }
    if (surveyStudents.length === 0) {
      alert("최소 1명 이상의 학생을 추가해주세요.");
      return;
    }

    // 마감일을 ISO 형식으로 변환 (날짜만 입력된 경우 시간 추가)
    let deadlineISO = surveyDeadline;
    if (!deadlineISO.includes("T")) {
      deadlineISO = `${surveyDeadline}T23:59:59`;
    }

    // 참여자 데이터 변환 (서버 API 형식)
    const participants = surveyStudents.map((s) => ({
      studentNo: s.id,
      name: s.name,
      gender: s.gender as "남" | "여",
    }));

    // 질문 데이터 변환 (서버 API 형식)
    const fields = fixedQuestions.map((q, index) => {
      const field: {
        id: string;
        title: string;
        type: "multiple-choice" | "boolean" | "text";
        options?: string[];
      } = {
        id: `q${index + 1}`,
        title: q.text,
        type: q.type === "multiple-choice" ? "multiple-choice" : "text",
      };

      // multiple-choice 타입인 경우 options 추가
      if (q.type === "multiple-choice") {
        // 질문별 옵션 설정
        if (q.text.includes("기상 시간")) {
          field.options = ["6시 이전", "6시-8시", "8시-10시", "10시 이후"];
        } else if (q.text.includes("취침 시간")) {
          field.options = ["22시 이전", "22시-24시", "24시 이후"];
        } else if (q.text.includes("흡연")) {
          field.options = ["예", "아니오"];
        } else if (q.text.includes("수면 습관")) {
          field.options = ["코골이", "이갈이", "없음"];
        } else {
          field.options = ["선택지1", "선택지2", "선택지3", "기타"];
        }
      }

      return field;
    });

    // 서버로 설문 생성 요청
    try {
      const createdSurvey = await createSurvey({
        title: surveyTitle,
        deadline: deadlineISO,
        link: "",
        participants,
        fields,
      });

      if (!createdSurvey) {
        alert("설문 배포에 실패했습니다.");
        return;
      }

      // 난수 ID 생성 (로컬 상태 관리용)
      const surveyId = crypto.randomUUID();

      // 로컬 상태 업데이트
      const newSurvey: Survey = {
        id: parseInt(surveyId.split("-")[0], 16) % 1000000, // UUID를 숫자로 변환 (임시)
        title: surveyTitle,
        createdDate: new Date().toISOString().split("T")[0],
        deadline: surveyDeadline,
        status: "active",
        studentIds: surveyStudents.map((s) => s.id),
        students: surveyStudents,
        questions: fixedQuestions,
      };

      // 로컬 상태 업데이트 (서버에 저장되므로 로컬 스토리지 불필요)
      const updatedSurveys = [...surveys, newSurvey];
      setSurveys(updatedSurveys);

      // 서버에서 반환된 링크가 있으면 사용, 없으면 로컬 링크 생성
      const surveyLink =
        (createdSurvey as { link?: string }).link ||
        `${window.location.origin}/survey/${surveyId}`;
      alert(`설문 배포 완료! 링크: ${surveyLink}`);

      // 폼 초기화
      setSurveyTitle("");
      setSurveyDeadline("");
      setSurveyStudents([]);
    } catch (error) {
      console.error("설문 배포 실패:", error);
      alert("설문 배포에 실패했습니다.");
    }
  };

  return (
    <AdminLayout>
      <div className="page-title">매칭 설문 관리</div>

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <SurveyListTable
        surveys={surveys}
        onEdit={handleEditSurvey}
        onDelete={handleDeleteSurvey}
      />

      <SurveyForm
        title={surveyTitle}
        deadline={surveyDeadline}
        students={surveyStudents}
        questions={fixedQuestions}
        newStudentId={newStudentId}
        newStudentName={newStudentName}
        newStudentGender={newStudentGender}
        onTitleChange={setSurveyTitle}
        onDeadlineChange={setSurveyDeadline}
        onStudentIdChange={setNewStudentId}
        onStudentNameChange={setNewStudentName}
        onStudentGenderChange={setNewStudentGender}
        onAddStudent={handleAddStudent}
        onDeleteStudent={handleDeleteStudent}
        onUploadExcel={handleUploadExcel}
        onSave={handleSaveSurvey}
        onDeploy={handleDeploySurvey}
        isUploading={isUploading}
      />
    </AdminLayout>
  );
}
