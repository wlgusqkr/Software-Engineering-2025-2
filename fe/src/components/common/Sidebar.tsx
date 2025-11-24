import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { signOut, getCurrentUser } from "../../api/auth";
import "../../styles/dashboard.css";

export default function Sidebar() {
  const location = useLocation();
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    // 현재 로그인된 사용자 정보 가져오기
    getCurrentUser().then((user) => {
      if (user?.email) {
        setAdminEmail(user.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("로그아웃 실패:", error);
      window.location.href = "/login";
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-title">메뉴</div>
        <div className="sidebar-admin-info">
          <div className="admin-name">
            관리자: {adminEmail || "관리자님"}
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link
            to="/survey-management"
            className={
              location.pathname === "/survey-management" ? "active" : ""
            }
          >
            매칭 설문 관리
          </Link>
        </li>
        <li>
          <Link
            to="/matching"
            className={location.pathname === "/matching" ? "active" : ""}
          >
            매칭 실행
          </Link>
        </li>
        <li>
          <Link
            to="/results"
            className={location.pathname === "/results" ? "active" : ""}
          >
            매칭 결과 보기
          </Link>
        </li>
      </ul>
    </div>
  );
}
