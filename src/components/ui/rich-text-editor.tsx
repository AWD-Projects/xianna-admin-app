'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="min-h-[200px] border border-gray-300 rounded-md bg-gray-50 animate-pulse" />
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Escribe el contenido aquí...",
  className = "",
  error 
}: RichTextEditorProps) {

  // Custom toolbar configuration for blog content
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ]

  // Custom styles for the editor
  const editorStyle = {
    backgroundColor: 'white',
    minHeight: '300px',
  }

  useEffect(() => {
    // Custom CSS for Quill editor
    const style = document.createElement('style')
    style.textContent = `
      .ql-editor {
        min-height: 300px;
        font-family: Inter, sans-serif;
        font-size: 16px;
        line-height: 1.6;
      }
      
      .ql-editor.ql-blank::before {
        color: #9ca3af;
        font-style: normal;
        font-weight: normal;
      }
      
      .ql-toolbar {
        border-top: 1px solid #d1d5db;
        border-left: 1px solid #d1d5db;
        border-right: 1px solid #d1d5db;
        border-bottom: none;
        border-radius: 0.375rem 0.375rem 0 0;
        background: #f9fafb;
      }
      
      .ql-container {
        border-left: 1px solid #d1d5db;
        border-right: 1px solid #d1d5db;
        border-bottom: 1px solid #d1d5db;
        border-top: none;
        border-radius: 0 0 0.375rem 0.375rem;
        font-family: Inter, sans-serif;
      }
      
      .ql-editor h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 1rem 0;
      }
      
      .ql-editor h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0.875rem 0;
      }
      
      .ql-editor h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0.75rem 0;
      }
      
      .ql-editor h4 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0.625rem 0;
      }
      
      .ql-editor p {
        margin: 0.5rem 0;
      }
      
      .ql-editor strong {
        font-weight: 600;
      }
      
      .ql-editor em {
        font-style: italic;
      }
      
      .ql-editor ul, .ql-editor ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      
      .ql-editor blockquote {
        border-left: 4px solid #e5e7eb;
        padding-left: 1rem;
        margin: 1rem 0;
        font-style: italic;
        color: #6b7280;
      }
      
      .ql-editor code {
        background-color: #f3f4f6;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 0.875rem;
      }
      
      .ql-editor pre {
        background-color: #f3f4f6;
        padding: 1rem;
        border-radius: 0.375rem;
        overflow-x: auto;
        margin: 1rem 0;
      }
      
      .ql-editor a {
        color: #ec4899;
        text-decoration: underline;
      }
      
      .ql-editor a:hover {
        color: #db2777;
      }
      
      ${error ? `
        .ql-toolbar,
        .ql-container {
          border-color: #ef4444;
        }
      ` : ''}
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [error])

  return (
    <div className={className}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={editorStyle}
      />
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}