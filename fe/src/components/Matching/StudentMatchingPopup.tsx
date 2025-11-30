import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import "../../styles/student-matching-popup.css";

interface Student {
    id: string;
    name: string;
    gender: "남" | "여";
    score: number;
}

interface Room {
    id: string;
    students: (Student | null)[]; // Fixed size 2
    score: number;
}

interface StudentMatchingPopupProps {
    surveyTitle: string;
    students?: Array<{ id: string; name: string; gender: string }>;
    onClose: () => void;
    onSave: (rooms: Room[]) => void;
}

// Mock Data Generation
const generateMockRooms = (gender: "남" | "여", count: number): Room[] => {
    const rooms: Room[] = [];
    let studentIdCounter = gender === "남" ? 1 : 11;

    for (let i = 1; i <= count; i++) {
        const student1: Student = {
            id: `2024${String(studentIdCounter++).padStart(4, "0")}`,
            name: `${gender}학생${studentIdCounter - (gender === "남" ? 1 : 11)}`,
            gender: gender,
            score: Math.floor(Math.random() * 100),
        };
        const student2: Student = {
            id: `2024${String(studentIdCounter++).padStart(4, "0")}`,
            name: `${gender}학생${studentIdCounter - (gender === "남" ? 1 : 11)}`,
            gender: gender,
            score: Math.floor(Math.random() * 100),
        };

        rooms.push({
            id: `${gender === "남" ? "M" : "F"}-Room-${i}`,
            students: [student1, student2],
            score: Math.floor((student1.score + student2.score) / 2), // Mock room score
        });
    }
    return rooms;
};

export default function StudentMatchingPopup({
    surveyTitle,
    students = [],
    onClose,
    onSave,
}: StudentMatchingPopupProps) {
    const [maleRooms, setMaleRooms] = useState<Room[]>([]);
    const [femaleRooms, setFemaleRooms] = useState<Room[]>([]);

    useEffect(() => {
        // 실제 학생 데이터가 있으면 사용, 없으면 mock 데이터 사용
        if (students && students.length > 0) {
            // 성별별로 학생 분류
            const maleStudents = students
                .filter((s) => s.gender === "남" || s.gender === "M")
                .map((s) => ({
                    id: s.id,
                    name: s.name,
                    gender: "남" as const,
                    score: Math.floor(Math.random() * 100), // 실제 매칭 점수는 서버에서 받아야 함
                }));

            const femaleStudents = students
                .filter((s) => s.gender === "여" || s.gender === "F")
                .map((s) => ({
                    id: s.id,
                    name: s.name,
                    gender: "여" as const,
                    score: Math.floor(Math.random() * 100), // 실제 매칭 점수는 서버에서 받아야 함
                }));

            // 학생들을 2명씩 묶어서 방 생성
            const createRoomsFromStudents = (studentList: Student[], gender: "남" | "여"): Room[] => {
                const rooms: Room[] = [];
                for (let i = 0; i < studentList.length; i += 2) {
                    const student1 = studentList[i];
                    const student2 = studentList[i + 1] || null;
                    rooms.push({
                        id: `${gender === "남" ? "M" : "F"}-Room-${Math.floor(i / 2) + 1}`,
                        students: [student1, student2],
                        score: student2
                            ? Math.floor((student1.score + student2.score) / 2)
                            : student1.score,
                    });
                }
                return rooms;
            };

            setMaleRooms(createRoomsFromStudents(maleStudents, "남"));
            setFemaleRooms(createRoomsFromStudents(femaleStudents, "여"));
        } else {
            // Mock data fallback
            setMaleRooms(generateMockRooms("남", 5));
            setFemaleRooms(generateMockRooms("여", 5));
        }
    }, [students]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;

        // Source and Destination IDs will be the Room IDs
        const sourceRoomId = source.droppableId;
        const destRoomId = destination.droppableId;

        // Find source and dest rooms
        const isSourceMale = sourceRoomId.startsWith("M");
        const isDestMale = destRoomId.startsWith("M");

        // Prevent cross-gender matching
        if (isSourceMale !== isDestMale) {
            return;
        }

        const rooms = isSourceMale ? [...maleRooms] : [...femaleRooms];
        const sourceRoomIndex = rooms.findIndex((r) => r.id === sourceRoomId);
        const destRoomIndex = rooms.findIndex((r) => r.id === destRoomId);

        if (sourceRoomIndex === -1 || destRoomIndex === -1) return;

        const sourceRoom = { ...rooms[sourceRoomIndex] };
        const destRoom = { ...rooms[destRoomIndex] };

        // Get the student being dragged
        const draggedStudent = sourceRoom.students[source.index];
        if (!draggedStudent) return;

        // If moving within same room (just swapping positions 0 and 1)
        if (sourceRoomId === destRoomId) {
            const newStudents = [...sourceRoom.students];
            const [removed] = newStudents.splice(source.index, 1);
            newStudents.splice(destination.index, 0, removed);

            sourceRoom.students = newStudents;
            rooms[sourceRoomIndex] = { ...sourceRoom }; // Score fixed
        } else {
            // Moving to another room
            const newSourceStudents = [...sourceRoom.students];
            newSourceStudents.splice(source.index, 1, null); // Leave empty slot

            const newDestStudents = [...destRoom.students];

            // Check if destination slot is occupied or if we need to swap
            // Strategy: If dropping onto an occupied slot (or if room is full), swap.
            // If room has space, just insert (fill null).

            // Since we have fixed 2 slots, let's look at destination index.
            // If destination.index is 0 or 1, we target that slot.
            const targetIndex = Math.min(destination.index, 1);
            const targetStudent = newDestStudents[targetIndex];

            if (targetStudent) {
                // SWAP: Move target student to source room
                newDestStudents[targetIndex] = draggedStudent;
                newSourceStudents.splice(source.index, 1, targetStudent); // Put swapped student back
            } else {
                // MOVE: Just place it there
                // If targetIndex is null, great. If not (maybe index 1 is null but we dropped on 0?), handle it.
                // Actually, if we drop on 0 and 0 is full but 1 is empty, should we shift?
                // Let's keep it simple: Swap if occupied, Place if empty.

                // If the specific slot we dropped on is empty:
                if (newDestStudents[targetIndex] === null) {
                    newDestStudents[targetIndex] = draggedStudent;
                } else {
                    // Try the other slot?
                    const otherIndex = targetIndex === 0 ? 1 : 0;
                    if (newDestStudents[otherIndex] === null) {
                        newDestStudents[otherIndex] = draggedStudent;
                    } else {
                        // Both full (should be covered by swap logic above, but just in case)
                        // Swap with target
                        newDestStudents[targetIndex] = draggedStudent;
                        newSourceStudents.splice(source.index, 1, targetStudent);
                    }
                }
            }

            // Clean up source room (if we left a null, ensure it's valid structure)
            // Our structure is (Student | null)[].

            sourceRoom.students = newSourceStudents;
            // sourceRoom.score = calculateRoomScore(sourceRoom.students); // Score is fixed as per request

            destRoom.students = newDestStudents;
            // destRoom.score = calculateRoomScore(destRoom.students); // Score is fixed as per request

            rooms[sourceRoomIndex] = sourceRoom;
            rooms[destRoomIndex] = destRoom;
        }

        if (isSourceMale) setMaleRooms(rooms);
        else setFemaleRooms(rooms);
    };

    const handleSave = () => {
        onSave([...maleRooms, ...femaleRooms]);
        onClose();
    };

    const renderRoom = (room: Room) => (
        <div className="room-card" key={room.id}>
            <div className="room-header">
                <span className="room-title">{room.id}</span>
                <div className="room-header-right">
                    <span className="room-score">Score: {room.score}</span>
                </div>
            </div>
            <Droppable droppableId={room.id} direction="horizontal">
                {(provided, snapshot) => {
                    const isFull = room.students.filter(Boolean).length >= 2;
                    const showSwap = snapshot.isDraggingOver && isFull;

                    return (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`room-students ${snapshot.isDraggingOver ? "dragging-over" : ""} ${showSwap ? "swap-target" : ""}`}
                        >
                            {showSwap && <div className="swap-indicator">Swap!</div>}
                            {room.students.map((student, index) => (
                                <Draggable
                                    key={student ? student.id : `${room.id}-empty-${index}`}
                                    draggableId={student ? student.id : `${room.id}-empty-${index}`}
                                    index={index}
                                    isDragDisabled={!student}
                                >
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`student-card mini ${!student ? "empty-slot" : ""} ${snapshot.isDragging ? "dragging" : ""}`}
                                        >
                                            {student ? (
                                                <>
                                                    <div className="student-info">
                                                        <span className="student-name">{student.name}</span>
                                                        <span className="student-id">{student.id}</span>
                                                    </div>
                                                    <div className="student-score-badge">{student.score}</div>
                                                </>
                                            ) : (
                                                <span className="empty-text">빈 자리</span>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    );
                }}
            </Droppable>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content matching-popup" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{surveyTitle} - 기숙사 배정 (2인 1실)</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body matching-body">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="matching-columns">
                            {/* Male Rooms Column */}
                            <div className="matching-column">
                                <h4 className="column-header male">남학생 기숙사</h4>
                                <div className="rooms-container">
                                    {maleRooms.map(renderRoom)}
                                </div>
                            </div>

                            {/* Female Rooms Column */}
                            <div className="matching-column">
                                <h4 className="column-header female">여학생 기숙사</h4>
                                <div className="rooms-container">
                                    {femaleRooms.map(renderRoom)}
                                </div>
                            </div>
                        </div>
                    </DragDropContext>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>취소</button>
                    <button className="btn-primary" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
