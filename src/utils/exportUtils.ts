import type { Question } from '@/types'

/**
 * Export questions data to CSV format
 */
export function exportQuestionsToCSV(questions: Question[]) {
  // Prepare CSV headers
  const headers = [
    'ID Pregunta',
    'Pregunta', 
    'ID Respuesta',
    'Respuesta',
    'Identificador',
    'ID Estilo',
    'Fecha Creación'
  ]

  // Prepare CSV rows
  const rows: string[][] = []
  rows.push(headers)

  questions.forEach(question => {
    if (question.answers.length === 0) {
      // If no answers, add question row with empty answer fields
      rows.push([
        question.id.toString(),
        `"${question.pregunta}"`,
        '',
        '',
        '',
        '',
        new Date().toISOString().split('T')[0] // Current date as fallback
      ])
    } else {
      // Add a row for each answer
      question.answers.forEach(answer => {
        rows.push([
          question.id.toString(),
          `"${question.pregunta}"`,
          answer.id.toString(),
          `"${answer.respuesta}"`,
          answer.identificador.toUpperCase(),
          answer.id_estilo.toString(),
          new Date().toISOString().split('T')[0] // Current date as fallback
        ])
      })
    }
  })

  // Convert to CSV string
  const csvContent = rows.map(row => row.join(',')).join('\n')
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `cuestionario_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Export questions data to Excel format (using HTML table approach)
 */
export function exportQuestionsToExcel(questions: Question[]) {
  // Create HTML table structure
  let tableHTML = `
    <table border="1">
      <thead>
        <tr style="background-color: #f0f0f0; font-weight: bold;">
          <th>ID Pregunta</th>
          <th>Pregunta</th>
          <th>ID Respuesta</th>
          <th>Respuesta</th>
          <th>Identificador</th>
          <th>ID Estilo</th>
          <th>Fecha Exportación</th>
        </tr>
      </thead>
      <tbody>
  `

  questions.forEach(question => {
    if (question.answers.length === 0) {
      // If no answers, add question row with empty answer fields
      tableHTML += `
        <tr>
          <td>${question.id}</td>
          <td>${question.pregunta}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>${new Date().toLocaleDateString('es-ES')}</td>
        </tr>
      `
    } else {
      // Add a row for each answer
      question.answers.forEach((answer, index) => {
        tableHTML += `
          <tr>
            <td>${index === 0 ? question.id : ''}</td>
            <td>${index === 0 ? question.pregunta : ''}</td>
            <td>${answer.id}</td>
            <td>${answer.respuesta}</td>
            <td>${answer.identificador.toUpperCase()}</td>
            <td>${answer.id_estilo}</td>
            <td>${new Date().toLocaleDateString('es-ES')}</td>
          </tr>
        `
      })
    }
  })

  tableHTML += `
      </tbody>
    </table>
  `

  // Create Excel file
  const blob = new Blob([tableHTML], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  })
  
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `cuestionario_${new Date().toISOString().split('T')[0]}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Export questions summary to CSV
 */
export function exportQuestionsSummaryToCSV(questions: Question[]) {
  const headers = [
    'ID',
    'Pregunta',
    'Total Respuestas',
    'Identificadores',
    'Fecha Exportación'
  ]

  const rows: string[][] = []
  rows.push(headers)

  questions.forEach(question => {
    const identifiers = question.answers.map(a => a.identificador.toUpperCase()).join(', ')
    
    rows.push([
      question.id.toString(),
      `"${question.pregunta}"`,
      question.answers.length.toString(),
      `"${identifiers}"`,
      new Date().toISOString().split('T')[0]
    ])
  })

  const csvContent = rows.map(row => row.join(',')).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `resumen_cuestionario_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}