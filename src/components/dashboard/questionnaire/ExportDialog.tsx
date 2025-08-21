'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exportQuestionsToCSV, exportQuestionsToExcel, exportQuestionsSummaryToCSV } from '@/utils/exportUtils'
import type { Question } from '@/types'
import { FileSpreadsheet, FileText, Download, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  questions: Question[]
}

export function ExportDialog({ isOpen, onClose, questions }: ExportDialogProps) {
  const [exportType, setExportType] = useState<'detailed' | 'summary'>('detailed')
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('excel')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (questions.length === 0) {
      toast.error('No hay preguntas para exportar')
      return
    }

    setIsExporting(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
      
      if (exportType === 'summary') {
        exportQuestionsSummaryToCSV(questions)
        toast.success('Resumen exportado exitosamente')
      } else {
        if (exportFormat === 'excel') {
          exportQuestionsToExcel(questions)
          toast.success('Archivo Excel exportado exitosamente')
        } else {
          exportQuestionsToCSV(questions)
          toast.success('Archivo CSV exportado exitosamente')
        }
      }
      
      onClose()
    } catch (error) {
      toast.error('Error al exportar el archivo')
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getFileName = () => {
    const date = new Date().toISOString().split('T')[0]
    if (exportType === 'summary') {
      return `resumen_cuestionario_${date}.csv`
    }
    return `cuestionario_${date}.${exportFormat === 'excel' ? 'xls' : 'csv'}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Cuestionario
          </DialogTitle>
          <DialogDescription>
            Exporta las preguntas y respuestas del cuestionario en diferentes formatos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="text-base font-medium">Tipo de exportación</label>
            <Select value={exportType} onValueChange={(value) => setExportType(value as 'detailed' | 'summary')}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    Exportación Detallada
                  </div>
                </SelectItem>
                <SelectItem value="summary">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    Resumen Ejecutivo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">
              {exportType === 'detailed' 
                ? 'Incluye todas las preguntas con respuestas completas, identificadores y estilos'
                : 'Resumen compacto con estadísticas de preguntas y cantidad de respuestas'
              }
            </p>
          </div>

          {/* Format Selection (only for detailed export) */}
          {exportType === 'detailed' && (
            <div>
              <label className="text-base font-medium">Formato de archivo</label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'csv' | 'excel')}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Excel (.xls)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Archivo a generar:</span>
              <span className="text-gray-600">{getFileName()}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="font-medium">Total preguntas:</span>
              <span className="text-gray-600">{questions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="font-medium">Total respuestas:</span>
              <span className="text-gray-600">
                {questions.reduce((acc, q) => acc + q.answers.length, 0)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}