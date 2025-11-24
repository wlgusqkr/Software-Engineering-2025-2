import { useState } from "react";
import AdminLayout from "../components/common/AdminLayout";
import StudentActionButtons from "../components/Dashboard/StudentActionButtons";
import StudentListTable from "../components/Dashboard/StudentListTable";
import Pagination from "../components/common/Pagination";
import "../styles/common.css";

interface Student {
  id: string;
  name: string;
  gender: string;
  email: string;
  birthDate: string;
  registerDate: string;
}

export default function Dashboard() {
  // 학생 데이터는 서버에서 가져옴 (로컬 스토리지 제거)
  const [students, setStudents] = useState<Student[]>([]);

  // 학생 데이터 업데이트 (서버 API로 대체 필요)
  const updateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
  };

  const handleEdit = (studentId: string) => {
    alert(`학생 ${studentId} 수정 기능 (구현 예정)`);
  };

  const handleDelete = (studentId: string) => {
    if (confirm(`학생 ${studentId}를 삭제하시겠습니까?`)) {
      const updatedStudents = students.filter((s) => s.id !== studentId);
      updateStudents(updatedStudents);
      alert("삭제 완료");
    }
  };

  const handleUploadExcel = () => {
    alert("엑셀 업로드 기능 (구현 예정)");
  };

  const handleAddStudent = () => {
    alert("학생 추가 기능 (구현 예정)");
  };

  return (
    <AdminLayout>
            <div className="page-title">학생 목록 관리</div>

      <StudentActionButtons
        onUploadExcel={handleUploadExcel}
        onAddStudent={handleAddStudent}
      />

      <StudentListTable
        students={students}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination />
    </AdminLayout>
  );
}
