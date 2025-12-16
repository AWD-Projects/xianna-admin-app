import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { htmlToPlainText, generateWhatsAppLink } from '@/lib/utils/htmlToText'

// Helper function to personalize template
const personalizeTemplate = (
  templateHtml: string,
  templateSubject: string,
  user: any,
  styleMap: { [key: number]: string }
) => {
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
      return NextResponse.json({ error: 'No users provided' }, { status: 400 })
    }

    if (!template || !template.subject || !template.htmlContent) {
      return NextResponse.json({ error: 'Template is incomplete' }, { status: 400 })
    }

    const supabase = createClient()

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

    // Generate WhatsApp links for each user
    const whatsappLinks = []
    const usersWithoutPhone = []
    const failedUsers = []

    for (const user of users) {
      try {
        // Check if user has a phone number
        // Convert to string first in case it's stored as a number in the database
        const phoneNumber = user.telefono ? String(user.telefono).trim() : ''

        if (!phoneNumber) {
          usersWithoutPhone.push({
            email: user.correo,
            name: user.nombre
          })
          continue
        }

        // Personalize the template for this user
        const { personalizedHtml, personalizedSubject } = personalizeTemplate(
          template.htmlContent,
          template.subject,
          user,
          styleMap
        )

        // Convert HTML to plain text
        const plainTextMessage = htmlToPlainText(personalizedHtml)

        // Add subject at the beginning if needed
        const fullMessage = `*${personalizedSubject}*\n\n${plainTextMessage}`

        // Generate WhatsApp link
        const whatsappLink = generateWhatsAppLink(phoneNumber, fullMessage)

        whatsappLinks.push({
          userId: user.id,
          userName: user.nombre,
          userEmail: user.correo,
          userPhone: phoneNumber,
          whatsappLink
        })
      } catch (error: any) {
        console.error(`Failed to generate WhatsApp link for user ${user.correo}:`, error)
        failedUsers.push({
          email: user.correo,
          name: user.nombre,
          error: error.message
        })
      }
    }

    // Return the generated WhatsApp links
    return NextResponse.json({
      success: true,
      message: `Generated WhatsApp links for ${whatsappLinks.length} users`,
      totalUsers: users.length,
      successCount: whatsappLinks.length,
      usersWithoutPhone: usersWithoutPhone.length > 0 ? usersWithoutPhone : undefined,
      failedUsers: failedUsers.length > 0 ? failedUsers : undefined,
      whatsappLinks,
      campaignId
    })
  } catch (error: any) {
    console.error('WhatsApp generation error:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate WhatsApp links',
        details: error.message
      },
      { status: 500 }
    )
  }
}
