'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Database, AlertTriangle } from 'lucide-react'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage('Success: ' + data.message)
      } else {
        setMessage('Error: ' + (data.error || 'Unknown error'))
      }
    } catch (e) {
      setMessage('Error: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 pt-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin & Settings</h1>
        <p className="text-muted-foreground text-lg">System configuration and maintenance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>
              Initialize or reset the database with default projects and columns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex items-start gap-3 text-sm text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>
                This action will attempt to create default projects (FAMCO, Mekanik, etc.) if they don't exist. 
                Existing data will not be overwritten.
              </p>
            </div>
            
            <Button 
              onClick={handleSeed} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                'Seed Initial Data'
              )}
            </Button>

            {message && (
              <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
             <CardTitle>System Info</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2 text-sm">
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Version</span>
                 <span>1.0.0 (MVP)</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Environment</span>
                 <span>{process.env.NODE_ENV}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Agent</span>
                 <span>Sara (Active)</span>
               </div>
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
