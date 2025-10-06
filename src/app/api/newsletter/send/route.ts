import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createClient } from '@/lib/supabase/server'

// Initialize SendGrid with your API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
sgMail.setApiKey(SENDGRID_API_KEY)

// Helper function to personalize template
const personalizeTemplate = (templateHtml: string, templateSubject: string, user: any, styleMap: { [key: number]: string }) => {
  let personalizedHtml = templateHtml
  let personalizedSubject = templateSubject

  // Get style name from the styleMap or fallback to generic text
  const styleName = styleMap[user.tipo_estilo] || `Estilo ${user.tipo_estilo}`

  // Replace placeholders with user data
  personalizedHtml = personalizedHtml.replace(/\{\{nombre\}\}/g, user.nombre || 'Usuario')
  personalizedHtml = personalizedHtml.replace(/\{\{tipo_estilo\}\}/g, styleName)
  personalizedHtml = personalizedHtml.replace(/\{\{tipo_cuerpo\}\}/g, user.tipo_cuerpo || 'tu tipo de cuerpo')
  personalizedHtml = personalizedHtml.replace(/\{\{estado\}\}/g, user.estado || 'tu ubicación')
  personalizedHtml = personalizedHtml.replace(/\{\{genero\}\}/g, user.genero || '')
  personalizedHtml = personalizedHtml.replace(/\{\{edad\}\}/g, user.edad?.toString() || '')
  personalizedHtml = personalizedHtml.replace(/\{\{ocupacion\}\}/g, user.ocupacion || 'tu ocupación')

  personalizedSubject = personalizedSubject.replace(/\{\{nombre\}\}/g, user.nombre || 'Usuario')
  personalizedSubject = personalizedSubject.replace(/\{\{tipo_estilo\}\}/g, styleName)

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

    // Fetch all styles from database to build a map
    const supabase = await createClient()
    const { data: stylesData, error: stylesError } = await supabase
      .from('estilos')
      .select('id, tipo')

    if (stylesError) {
      console.error('Error fetching styles:', stylesError)
    }

    // Create a map of style id to style name
    const styleMap: { [key: number]: string } = {}
    if (stylesData) {
      stylesData.forEach((style: any) => {
        styleMap[style.id] = style.tipo
      })
    }

    // Prepare personalized emails for each user
    const personalizedEmails = users.map(user => {
      const { personalizedHtml, personalizedSubject } = personalizeTemplate(
        template.htmlContent,
        template.subject,
        user,
        styleMap
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