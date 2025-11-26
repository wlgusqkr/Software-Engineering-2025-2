import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  runMatching,
  getMatchingResults,
  getMatchingResultDetail,
  deleteMatchingResults,
} from '../api/admin';
// MatchingResultItemResponse는 getMatchingResults의 반환 타입으로 자동 추론됨

// Query Keys
export const matchingKeys = {
  all: ['matching'] as const,
  results: (surveyId: string) => [...matchingKeys.all, 'results', surveyId] as const,
  resultDetail: (formId: string) => [...matchingKeys.all, 'resultDetail', formId] as const,
};

/**
 * 매칭 실행
 */
export function useRunMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string) => runMatching(surveyId),
    onSuccess: (_, surveyId) => {
      // 매칭 결과 캐시 무효화
      queryClient.invalidateQueries({ queryKey: matchingKeys.results(surveyId) });
    },
  });
}

/**
 * 매칭 결과 조회
 */
export function useMatchingResults(surveyId: string | null) {
  return useQuery({
    queryKey: matchingKeys.results(surveyId || ''),
    queryFn: () => getMatchingResults(surveyId!),
    enabled: !!surveyId,
  });
}

/**
 * 매칭 결과 상세 조회 (통계 정보 포함)
 */
export function useMatchingResultDetail(formId: string | null) {
  return useQuery({
    queryKey: matchingKeys.resultDetail(formId || ''),
    queryFn: () => getMatchingResultDetail(formId!),
    enabled: !!formId,
  });
}

/**
 * 매칭 결과 삭제
 */
export function useDeleteMatchingResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string) => deleteMatchingResults(surveyId),
    onSuccess: (_, surveyId) => {
      // 매칭 결과 캐시 무효화
      queryClient.invalidateQueries({ queryKey: matchingKeys.results(surveyId) });
    },
  });
}

