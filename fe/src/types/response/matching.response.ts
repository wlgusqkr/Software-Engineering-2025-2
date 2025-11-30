/**
 * 매칭 관련 Response DTOs
 */

export interface MatchingPairResponse {
    student1: string;
    student2: string;
    score: number;
}

export interface MatchingResultResponse {
    surveyId: string;
    pairs: MatchingPairResponse[];
    createdAt: string;
    totalPairs: number;
}

/**
 * 매칭 결과 멤버 정보
 */
export interface MatchingMemberInfo {
    completed: boolean;
    studentId: string;
    formId: string;
    createdAt: string;
    email: string;
    name: string;
    gender: "남" | "여";
}

/**
 * 매칭 결과 응답 (새 형식)
 */
export interface MatchingResultItemResponse {
    roomId: string;
    score: string | number;
    memberA: MatchingMemberInfo | string | { studentId?: string; name?: string; [key: string]: any };
    memberB: MatchingMemberInfo | string | { studentId?: string; name?: string; [key: string]: any };
}

/**
 * 매칭 결과 전체 응답 (관리자용)
 */
export interface MatchingResultDetailResponse {
    formId: string;
    totalParticipants: number;
    completedCount: number;
    notCompletedCount: number;
    maleResults?: MatchingResultItemResponse[];
    femaleResults?: MatchingResultItemResponse[];
    results?: MatchingResultItemResponse[]; // 기존 형식 호환성
}

/**
 * CSV 다운로드 응답
 */
export interface MatchingResultsExportResponse {
    downloadUrl: string;
}

