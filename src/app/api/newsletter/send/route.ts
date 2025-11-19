import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

import { createClient } from '@/lib/supabase/server'

// Initialize SendGrid with your API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
sgMail.setApiKey(SENDGRID_API_KEY)

const EMAIL_LIMIT =
  Number(process.env.NEWSLETTER_EMAIL_LIMIT ?? process.env.NEXT_PUBLIC_NEWSLETTER_EMAIL_LIMIT ?? '1000') ||
  1000

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

    const supabase = createClient()

    // Enforce email limit
    const { data: campaignTotals, error: campaignTotalsError } = await supabase
      .from('newsletter_campaigns')
      .select('id, numero_usuarios_enviados')

    if (campaignTotalsError) {
      console.error('Error fetching campaign totals:', campaignTotalsError)
      return NextResponse.json(
        { error: 'Failed to calculate email usage', message: 'No se pudo validar el límite de correos' },
        { status: 500 }
      )
    }

    const previousEmailsSent =
      campaignTotals
        ?.filter((campaign) => campaign.id !== campaignId)
        .reduce((sum, campaign) => sum + (campaign.numero_usuarios_enviados ?? 0), 0) ?? 0

    const remainingCapacity = EMAIL_LIMIT - previousEmailsSent

    if (remainingCapacity <= 0) {
      return NextResponse.json(
        {
          error: 'EMAIL_LIMIT_EXCEEDED',
          message: 'Ya alcanzaste el límite mensual de envíos de correo.',
          remaining: 0,
          limit: EMAIL_LIMIT,
        },
        { status: 400 }
      )
    }

    if (users.length > remainingCapacity) {
      return NextResponse.json(
        {
          error: 'EMAIL_LIMIT_EXCEEDED',
          message: `Solo puedes enviar ${remainingCapacity} correos adicionales este mes.`,
          remaining: remainingCapacity,
          limit: EMAIL_LIMIT,
        },
        { status: 400 }
      )
    }

    // Fetch all styles from database to build a map
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

    // Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled(
      personalizedEmails.map(emailData => sgMail.send(emailData))
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length
    const failedEmails = results
      .map((r, index) => r.status === 'rejected' ? personalizedEmails[index].to : null)
      .filter(Boolean)

    // Log failed emails for debugging
    if (failedCount > 0) {
      console.error(`Failed to send ${failedCount} emails:`, failedEmails)
    }

    return NextResponse.json({
      success: successCount > 0,
      message: failedCount === 0
        ? `Newsletter sent successfully to all ${successCount} recipients`
        : `Newsletter sent to ${successCount} recipients. ${failedCount} failed.`,
      sentCount: successCount,
      failedCount,
      totalAttempted: users.length,
      failedEmails: failedCount > 0 ? failedEmails : undefined,
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
