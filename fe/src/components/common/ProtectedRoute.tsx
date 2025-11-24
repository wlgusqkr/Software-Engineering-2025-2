import { Navigate } from "react-router-dom";
import { type ReactNode, useState, useEffect } from "react";
import { checkAuthSession } from "../../api/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Cognito 인증 세션 확인
    checkAuthSession().then((isAuth) => {
      setIsAuthenticated(isAuth);
    });
  }, []);

  // 인증 확인 중
  if (isAuthenticated === null) {
    return <div>로딩 중...</div>;
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
