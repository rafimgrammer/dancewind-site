// src/components/RichTextEditor.tsx
import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Image, Youtube, TextStyle, FontSize],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있어요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      editor.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);

    e.target.value = ""; // 같은 파일 다시 선택해도 onChange 재발동되게 초기화
  };

  const addYoutube = () => {
    const url = window.prompt("유튜브 영상 URL을 입력하세요");
    if (url) editor.commands.setYoutubeVideo({ src: url });
  };

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  return (
    <div className="rounded-lg border border-line bg-stage">
      <div className="flex flex-wrap gap-1 border-b border-line p-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className="rounded px-2 py-1 text-xs text-backstage hover:bg-afterglow-2">굵게</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className="rounded px-2 py-1 text-xs text-backstage hover:bg-afterglow-2">기울임</button>
        <select onChange={(e) => setFontSize(e.target.value)} className="rounded bg-afterglow-2 px-2 py-1 text-xs text-backstage" defaultValue="16px">
          <option value="14px">작게</option>
          <option value="16px">보통</option>
          <option value="20px">크게</option>
          <option value="28px">아주 크게</option>
        </select>
        <button onClick={openFilePicker} className="rounded px-2 py-1 text-xs text-backstage hover:bg-afterglow-2">사진 첨부</button>
        <button onClick={addYoutube} className="rounded px-2 py-1 text-xs text-backstage hover:bg-afterglow-2">유튜브</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <EditorContent editor={editor} className="prose prose-invert max-w-none px-3 py-2 text-sm" />
    </div>
  );
}