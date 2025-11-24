import { Auth } from 'aws-amplify';
import type { CognitoUser } from '../types';

/**
 * 이메일과 비밀번호로 로그인
 */
export async function signIn(
    email: string,
    password: string
): Promise<{ user: CognitoUser | null; error: string | null }> {
    try {
        const user = await Auth.signIn(email, password);
        return {
            user: {
                username: user.username,
                email: user.attributes?.email,
                attributes: user.attributes,
            },
            error: null,
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : '로그인에 실패했습니다.';
        console.error('로그인 실패:', error);
        return { user: null, error: errorMessage };
    }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<void> {
    try {
        await Auth.signOut();
    } catch (error) {
        console.error('로그아웃 실패:', error);
        throw error;
    }
}

/**
 * 현재 로그인된 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<CognitoUser | null> {
    try {
        const user = await Auth.currentAuthenticatedUser();
        return {
            username: user.username,
            email: user.attributes?.email,
            attributes: user.attributes,
        };
    } catch (error) {
        console.log('로그인 상태가 아님:', error);
        return null;
    }
}

/**
 * 현재 세션 확인
 */
export async function checkAuthSession(): Promise<boolean> {
    try {
        await Auth.currentSession();
        return true;
    } catch {
        return false;
    }
}

/**
 * 비밀번호 찾기 - 1단계: 인증 코드 이메일 발송
 */
export async function forgotPassword(email: string): Promise<{ error: string | null }> {
    try {
        await Auth.forgotPassword(email);
        return { error: null };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : '비밀번호 찾기 요청에 실패했습니다.';
        console.error('비밀번호 찾기 실패:', error);
        return { error: errorMessage };
    }
}

/**
 * 비밀번호 찾기 - 2단계: 코드와 새 비밀번호로 변경 완료
 */
export async function forgotPasswordSubmit(
    email: string,
    code: string,
    newPassword: string
): Promise<{ error: string | null }> {
    try {
        await Auth.forgotPasswordSubmit(email, code, newPassword);
        return { error: null };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
        console.error('비밀번호 변경 실패:', error);
        return { error: errorMessage };
    }
}

