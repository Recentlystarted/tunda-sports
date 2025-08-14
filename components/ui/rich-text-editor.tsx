'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon, List, ListOrdered } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      BulletList.configure({
        HTMLAttributes: {
          class: 'ml-4 list-disc space-y-1',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'ml-4 list-decimal space-y-1',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'ml-0',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 text-foreground',
      },
    },
  })

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }
  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap gap-1 rounded-t-md">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
        {/* Editor */}
      <div className="border border-t-0 rounded-b-md bg-background relative">
        <style jsx>{`
          .ProseMirror ul {
            list-style-type: disc;
            margin-left: 1rem;
            padding-left: 1rem;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            margin-left: 1rem;
            padding-left: 1rem;
          }
          .ProseMirror li {
            margin: 0.25rem 0;
            line-height: 1.5;
          }
          .ProseMirror li p {
            margin: 0;
            display: inline;
          }
          .ProseMirror p {
            margin: 0.5rem 0;
          }
          .ProseMirror:first-child {
            margin-top: 0;
          }
          .ProseMirror:last-child {
            margin-bottom: 0;
          }
        `}</style>
        <EditorContent 
          editor={editor} 
          className="min-h-[200px] max-h-[400px] overflow-y-auto"
        />
        {!content && placeholder && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
