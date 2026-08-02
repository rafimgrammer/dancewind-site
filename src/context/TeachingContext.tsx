// src/context/TeachingContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import initialClasses from "../data/classes.json";

export interface Comment {
    id: string;
    author: string;
    content: string;
    date: string;
}

export interface TeachingClass {
    id: string;
    category: string;
    title: string;
    description: string;
    teacher: string;
    youtubeUrl: string;
    songTitle: string;
    songStart: string;
    songEnd: string;
    classDate: string;
    classTime: string;
    maxSpots: number | null; // null = 인원무관
    applicants: string[];
    comments: Comment[];
    createdAt: string;
}

interface TeachingContextType {
    classes: TeachingClass[];
    getById: (id: string) => TeachingClass | undefined;
    addClass: (
        data: Omit<TeachingClass, "id" | "applicants" | "comments" | "createdAt">
    ) => void;
    removeClass: (id: string) => void;
    toggleApply: (id: string, name: string) => void;
    addComment: (id: string, author: string, content: string) => void;
    editComment: (classId: string, commentId: string, content: string) => void;
    removeComment: (classId: string, commentId: string) => void;
}

const TeachingContext = createContext<TeachingContextType | null>(null);

export function TeachingProvider({ children }: { children: ReactNode }) {
    const [classes, setClasses] = useState<TeachingClass[]>(
        (initialClasses as any[]).map((c) => ({
            id: c.id,
            category: c.category ?? "케이팝",
            title: c.title,
            description: c.description ?? "",
            teacher: c.teacher,
            youtubeUrl: c.youtubeUrl ?? "",
            songTitle: c.songTitle ?? "",
            songStart: c.songStart ?? "0:00",
            songEnd: c.songEnd ?? "0:00",
            classDate: c.classDate ?? new Date().toISOString().slice(0, 10),
            classTime: c.classTime ?? "19:00",
            maxSpots: c.maxSpots ?? 10,
            applicants: c.applicants ?? [],
            comments: c.comments ?? [],
            createdAt: c.createdAt ?? new Date().toISOString().slice(0, 10),
        }))
    );

    const getById = (id: string) => classes.find((c) => c.id === id);

    const addClass: TeachingContextType["addClass"] = (data) => {
        setClasses((prev) => [
            {
                ...data,
                id: `c${Date.now()}`,
                applicants: [],
                comments: [],
                createdAt: new Date().toISOString().slice(0, 10),
            },
            ...prev,
        ]);
    };

    const removeClass = (id: string) =>
        setClasses((prev) => prev.filter((c) => c.id !== id));

    const toggleApply = (id: string, name: string) => {
        setClasses((prev) =>
            prev.map((c) => {
                if (c.id !== id) return c;
                const applied = c.applicants.includes(name);
                if (applied) {
                    return { ...c, applicants: c.applicants.filter((a) => a !== name) };
                }
                if (c.maxSpots !== null && c.applicants.length >= c.maxSpots) {
                    alert("정원이 마감된 클래스예요.");
                    return c;
                }
                return { ...c, applicants: [...c.applicants, name] };
            })
        );
    };

    const addComment = (id: string, author: string, content: string) => {
        if (!content.trim()) return;
        setClasses((prev) =>
            prev.map((c) =>
                c.id === id
                    ? {
                        ...c,
                        comments: [
                            ...c.comments,
                            {
                                id: `cm${Date.now()}`,
                                author,
                                content: content.trim(),
                                date: new Date().toISOString().slice(0, 10),
                            },
                        ],
                    }
                    : c
            )
        );
    };

    const editComment = (classId: string, commentId: string, content: string) => {
        if (!content.trim()) return;
        setClasses((prev) =>
            prev.map((c) =>
                c.id === classId
                    ? {
                        ...c,
                        comments: c.comments.map((cm) =>
                            cm.id === commentId ? { ...cm, content: content.trim() } : cm
                        ),
                    }
                    : c
            )
        );
    };

    const removeComment = (classId: string, commentId: string) => {
        setClasses((prev) =>
            prev.map((c) =>
                c.id === classId
                    ? { ...c, comments: c.comments.filter((cm) => cm.id !== commentId) }
                    : c
            )
        );
    };

    return (
        <TeachingContext.Provider
            value={{
                classes,
                getById,
                addClass,
                removeClass,
                toggleApply,
                addComment,
                editComment,
                removeComment,
            }}
        >
            {children}
        </TeachingContext.Provider>
    );
}

export function useTeaching() {
    const ctx = useContext(TeachingContext);
    if (!ctx) throw new Error("useTeaching은 TeachingProvider 안에서만 써야 해요.");
    return ctx;
}