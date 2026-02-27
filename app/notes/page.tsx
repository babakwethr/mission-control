'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Trash2, Save, Tag, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes')
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
        if (data.length > 0 && !selectedNote) {
          selectNote(data[0])
        }
      }
    } catch (e) {
      console.error('Error fetching notes:', e)
    } finally {
      setLoading(false)
    }
  }

  const selectNote = (note: Note) => {
    setSelectedNote(note)
    setEditingTitle(note.title)
    setEditingContent(note.content || '')
  }

  const createNote = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
          tags: []
        })
      })
      
      if (res.ok) {
        const newNote = await res.json()
        setNotes([newNote, ...notes])
        selectNote(newNote)
      }
    } catch (e) {
      console.error('Error creating note:', e)
    } finally {
      setSaving(false)
    }
  }

  const saveNote = async () => {
    if (!selectedNote) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/notes?id=${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle,
          content: editingContent
        })
      })
      
      if (res.ok) {
        const updatedNote = await res.json()
        setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n))
        setSelectedNote(updatedNote)
      }
    } catch (e) {
      console.error('Error saving note:', e)
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      setNotes(notes.filter(n => n.id !== id))
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
    } catch (e) {
      console.error('Error deleting note:', e)
    }
  }

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Notes List Sidebar */}
      <div className="w-80 border-r flex flex-col bg-muted/20">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Notes</h2>
            <Button size="sm" onClick={createNote} disabled={saving}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {notes.length === 0 ? 'No notes yet. Create one!' : 'No matching notes'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors",
                    selectedNote?.id === note.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{note.title || 'Untitled'}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(note.updated_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNote(note.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {note.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Note title"
                  className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
                />
                <Button 
                  size="sm" 
                  onClick={saveNote} 
                  disabled={saving || (editingTitle === selectedNote.title && editingContent === selectedNote.content)}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {formatDate(selectedNote.updated_at)}
              </p>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                placeholder="Start writing..."
                className="h-full resize-none border-0 focus-visible:ring-0"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a note or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
