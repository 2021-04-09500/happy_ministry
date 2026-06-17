import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
} from 'lucide-react';
import { useEffect } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Underline,
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class:
                    'min-h-[180px] px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#F5A623] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#555]',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;

        if (value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) return null;

    const btnClass = (active: boolean) =>
        `px-3 py-2 rounded-lg border text-sm transition-all ${
            active
                ? 'bg-[#F5A623] text-white border-[#F5A623]'
                : 'border-gray-200 text-[#444] hover:border-[#F5A623] hover:text-[#F5A623]'
        }`;

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-3">
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleBold().run();
                    }}
                    className={btnClass(editor.isActive('bold'))}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleItalic().run();
                    }}
                    className={btnClass(editor.isActive('italic'))}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleUnderline().run();
                    }}
                    className={btnClass(editor.isActive('underline'))}
                    title="Underline"
                >
                    <UnderlineIcon size={16} />
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleBulletList().run();
                    }}
                    className={btnClass(editor.isActive('bulletList'))}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleOrderedList().run();
                    }}
                    className={btnClass(editor.isActive('orderedList'))}
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleBlockquote().run();
                    }}
                    className={btnClass(editor.isActive('blockquote'))}
                    title="Quote"
                >
                    <Quote size={16} />
                </button>
            </div>

            <EditorContent editor={editor} />

            {!value && placeholder && (
                <p className="text-xs text-[#999] mt-2">{placeholder}</p>
            )}
        </div>
    );
}