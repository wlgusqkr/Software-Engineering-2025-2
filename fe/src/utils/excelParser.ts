import * as XLSX from 'xlsx';

export interface ParsedStudent {
    id: string;
    name: string;
    gender: 'M' | 'F' | string;
    email?: string;
}

/**
 * 엑셀 파일을 파싱하여 학생 목록을 반환
 * @param file 엑셀 파일 (File 객체)
 * @returns 파싱된 학생 목록
 */
export async function parseExcelFile(file: File): Promise<ParsedStudent[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error('파일을 읽을 수 없습니다.'));
                    return;
                }

                // 엑셀 파일 파싱
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // JSON으로 변환
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: '',
                }) as unknown[][];

                if (jsonData.length < 2) {
                    reject(new Error('엑셀 파일에 데이터가 없습니다.'));
                    return;
                }

                // 헤더 확인 (첫 번째 행)
                const headers = (jsonData[0] as string[]).map((h) => h.trim().toLowerCase());

                // 컬럼 인덱스 찾기
                const idIndex = findColumnIndex(headers, ['학번', 'student id', 'id', 'studentid']);
                const nameIndex = findColumnIndex(headers, ['이름', 'name', '이름']);
                const genderIndex = findColumnIndex(headers, ['성별', 'gender', 'sex']);
                const emailIndex = findColumnIndex(headers, ['이메일', 'email', 'e-mail']);

                if (idIndex === -1 || nameIndex === -1 || genderIndex === -1) {
                    reject(new Error('필수 컬럼(학번, 이름, 성별)을 찾을 수 없습니다.'));
                    return;
                }

                // 데이터 파싱 (헤더 제외)
                const students: ParsedStudent[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as unknown[];

                    const id = String(row[idIndex] || '').trim();
                    const name = String(row[nameIndex] || '').trim();
                    const gender = String(row[genderIndex] || '').trim();
                    const email = emailIndex !== -1 ? String(row[emailIndex] || '').trim() : undefined;

                    // 빈 행 건너뛰기
                    if (!id && !name) {
                        continue;
                    }

                    // 성별 정규화 (남자/남/M → M, 여자/여/F → F)
                    let normalizedGender = gender;
                    if (gender.includes('남') || gender.toLowerCase() === 'm' || gender.toLowerCase() === 'male') {
                        normalizedGender = 'M';
                    } else if (gender.includes('여') || gender.toLowerCase() === 'f' || gender.toLowerCase() === 'female') {
                        normalizedGender = 'F';
                    }

                    students.push({
                        id,
                        name,
                        gender: normalizedGender,
                        email,
                    });
                }

                if (students.length === 0) {
                    reject(new Error('파싱된 학생 데이터가 없습니다.'));
                    return;
                }

                resolve(students);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
        };

        reader.readAsBinaryString(file);
    });
}

/**
 * 헤더 배열에서 컬럼 인덱스를 찾음
 */
function findColumnIndex(headers: string[], keywords: string[]): number {
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        for (const keyword of keywords) {
            if (header.includes(keyword)) {
                return i;
            }
        }
    }
    return -1;
}

