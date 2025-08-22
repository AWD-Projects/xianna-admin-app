import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with your API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
sgMail.setApiKey(SENDGRID_API_KEY) 

// Helper function to get style name
const getStyleName = (tipoEstilo: number) => {
  const styleMap: { [key: number]: string } = {
    1: 'Casual', 2: 'Elegante', 3: 'Deportivo', 4: 'Boho', 
    5: 'Minimalista', 6: 'Rockero', 7: 'Vintage'
  }
  return styleMap[tipoEstilo] || `Estilo ${tipoEstilo}`
}

// Helper function to personalize template
const personalizeTemplate = (templateHtml: string, templateSubject: string, user: any) => {
  let personalizedHtml = templateHtml
  let personalizedSubject = templateSubject
  
  // Replace placeholders with user data
  personalizedHtml = personalizedHtml.replace(/\{\{nombre\}\}/g, user.nombre || 'Usuario')
  personalizedHtml = personalizedHtml.replace(/\{\{tipo_estilo\}\}/g, getStyleName(user.tipo_estilo))
  personalizedHtml = personalizedHtml.replace(/\{\{tipo_cuerpo\}\}/g, user.tipo_cuerpo || 'tu tipo de cuerpo')
  personalizedHtml = personalizedHtml.replace(/\{\{estado\}\}/g, user.estado || 'tu ubicación')
  personalizedHtml = personalizedHtml.replace(/\{\{genero\}\}/g, user.genero || '')
  personalizedHtml = personalizedHtml.replace(/\{\{edad\}\}/g, user.edad?.toString() || '')
  personalizedHtml = personalizedHtml.replace(/\{\{ocupacion\}\}/g, user.ocupacion || 'tu ocupación')
  
  personalizedSubject = personalizedSubject.replace(/\{\{nombre\}\}/g, user.nombre || 'Usuario')
  personalizedSubject = personalizedSubject.replace(/\{\{tipo_estilo\}\}/g, getStyleName(user.tipo_estilo))
  
  return { personalizedHtml, personalizedSubject }
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, users, template } = await request.json()

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'No users provided' },
        { status: 400 }
      )
    }

    if (!template || !template.subject || !template.htmlContent) {
      return NextResponse.json(
        { error: 'Template is incomplete' },
        { status: 400 }
      )
    }

    // Prepare personalized emails for each user
    const personalizedEmails = users.map(user => {
      const { personalizedHtml, personalizedSubject } = personalizeTemplate(
        template.htmlContent, 
        template.subject, 
        user
      )
      
      return {
        to: user.correo,
        from: {
          email: 'xianna-newsletter@amoxtli.tech',
          name: 'Xianna Fashion'
        },
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedHtml.replace(/<[^>]*>/g, ''), // Simple HTML to text conversion
        trackingSettings: {
          clickTracking: {
            enable: true,
            enableText: false
          },
          openTracking: {
            enable: true
          }
        },
        customArgs: {
          campaign_id: campaignId.toString(),
          campaign_type: 'newsletter',
          user_id: user.id.toString()
        }
      }
    })

    // Send all personalized emails
    const responses = await Promise.all(
      personalizedEmails.map(emailData => sgMail.send(emailData))
    )

    console.log(`SendGrid responses: ${responses.length} emails sent`)

    return NextResponse.json({
      success: true,
      message: `Newsletter sent successfully to ${users.length} recipients`,
      sentCount: users.length,
      campaignId
    })

  } catch (error: any) {
    console.error('SendGrid error:', error)
    
    // Handle SendGrid specific errors
    if (error.response) {
      console.error('SendGrid error body:', error.response.body)
      return NextResponse.json(
        { 
          error: 'Failed to send newsletter',
          details: error.response.body?.errors || error.message
        },
        { status: error.code || 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to send newsletter',
        details: error.message
      },
      { status: 500 }
    )
  }
}