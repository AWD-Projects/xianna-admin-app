'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  fetchCampaigns,
  fetchUsersForNewsletter,
  createCampaign,
  toggleUserSelection,
  selectAllUsers,
  clearSelectedUsers,
  sendNewsletterCampaign,
  sendWhatsAppCampaign
} from '@/store/slices/newsletterSlice'
import { fetchBlogs } from '@/store/slices/blogSlice'
import { fetchOutfits } from '@/store/slices/outfitSlice'
import type { AppDispatch, RootState } from '@/store'
import type { NewsletterFormData, NewsletterFilters, SelectedUser, Blog, Outfit } from '@/types'
import { Send, Users, Filter, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { htmlToPlainText } from '@/lib/utils/htmlToText'
import { WhatsAppLinksModal } from '@/components/WhatsAppLinksModal'

const EMAIL_TEMPLATES = [
  {
    id: '1',
    name: 'Edición Mensual Xianna',
    subject: 'Tu edición mensual de Xianna',
    htmlContent: `
    <div style="background-color:#f7f4f5; padding:24px 0; font-family:'Helvetica Neue', Arial, sans-serif;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background-color:#fff; border-collapse:collapse;">

        <!-- Barra superior -->
        <tr>
          <td style="padding:12px 24px; background-color:#fdf5f2;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="font-size:12px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:#222;">
                  Xianna · Edición mensual
                </td>
                <td style="text-align:right; font-size:11px; color:#777;">
                  Curaduría de estilo consciente
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Nav -->
        <tr>
          <td style="padding:10px 24px; background-color:#c6d9b8;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; text-align:center; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#253028;">
              <tr>
                <td style="padding:0 8px;">Accesorios</td>
                <td style="padding:0 8px;">Prendas</td>
                <td style="padding:0 8px;">Nuevas marcas</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero (similar al diseño de ejemplo) -->
        <tr>
          <td style="padding:28px 24px 24px; background-color:#f8c8d8;">
            <div style="text-align:center; font-size:26px; letter-spacing:0.20em; text-transform:uppercase; color:#222; font-weight:500; line-height:1.1;">
              Edición mensual Xianna
            </div>
          </td>
        </tr>

        <!-- Intro + imagen grande + 2 imágenes pequeñas -->
        <tr>
          <td style="padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>

                <!-- Columna con imagen adaptada a la altura del texto -->
                <td width="50%" valign="top" 
                    background="https://aliancadorada.com/wp-content/uploads/2025/04/0001_1_business-outfits-for-women-summer-2025-i_igaksbort1a0zcoxufflag_ctct9ypftww4wmr5-yvdbg_cover.jpg"
                    style="
                      background-size: cover;
                      background-position: center;
                      background-repeat: no-repeat;
                    ">
                  <!-- Spacer necesario para Outlook -->
                  <div style="height:100%; min-height:100%; line-height:0; font-size:0;">
                    &nbsp;
                  </div>
                </td>

                <td width="4%" style="font-size:0;">&nbsp;</td>

                <!-- Texto -->
                <td width="46%" valign="top" style="vertical-align:top;">
                  <div style="font-size:14px; color:#4b5563; line-height:1.7; margin-bottom:14px;">
                    Bienvenida a la edición mensual de Xianna: una curaduría exclusiva de marcas,
                    tendencias y piezas esenciales diseñadas para acompañarte a perfeccionar tu estilo
                    de forma consciente y sofisticada.
                  </div>

                  <div style="font-size:18px; font-weight:600; color:#111; margin-bottom:8px;">
                    Este mes encontrarás:
                  </div>

                  <ul style="margin:0 0 12px 18px; padding:0; font-size:13px; color:#4b5563; line-height:1.8; list-style-type:disc !important;">
                    <li style="margin-bottom:6px;">Marcas destacadas recientemente incorporadas a Xianna.</li>
                    <li style="margin-bottom:6px;">Looks recomendados según tu estilo.</li>
                    <li style="margin-bottom:6px;">Selección mensual de prendas clave para actualizar tu clóset con intención.</li>
                  </ul>
                </td>

              </tr>
            </table>
          </td>
        </tr>

        <!-- Selección del mes (diseño unificado) -->
        <tr>
          <td style="padding:28px 24px 28px; background-color:#ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; max-width:592px; margin:0 auto;">

              <!-- Encabezado de sección -->
              <tr>
                <td style="padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:18px; font-weight:600; color:#111; margin-bottom:8px;">
                    Selección del mes
                  </div>
                  <div style="font-size:14px; color:#4b5563; line-height:1.7;">
                    Una edición curada de marcas, piezas y combinaciones pensadas para elevar tu estilo y mantener tu clóset funcional esta temporada.
                  </div>
                </td>
              </tr>

              <!-- Nueva marca destacada -->
              <tr>
                <td style="padding-top:18px; padding-bottom:14px;">
                  <div style="font-size:14px; font-weight:600; color:#111827; margin-bottom:6px;">
                    Nueva marca destacada
                  </div>
                  <div style="font-size:13px; color:#4b5563; line-height:1.7">
                    {{nueva_marca}}
                  </div>
                </td>
              </tr>

              <!-- Looks por estilo -->
              <tr>
                <td style="padding-top:6px;">
                  <div style="font-size:14px; font-weight:600; color:#111827; margin-bottom:6px;">
                    Looks por estilo
                  </div>
                  <div style="font-size:12px; color:#6b7280; line-height:1.6; margin-bottom:10px;">
                    Inspírate con los outfits y contenidos seleccionados según tu tipo de estilo. Haz clic en cada look para ver los detalles completos.
                  </div>

                  <!-- Aquí se inyecta la galería generada (imágenes + enlaces) -->
                  <div style="font-size:13px; color:#4b5563; line-height:1.6;">
                    {{looks_estilo}}
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Piezas esenciales + imagen de accesorios (bloque verde) -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td width="50%" style="vertical-align:top; background-color:#c6d9b8; padding:18px;">
                  <div style="font-size:18px; font-weight:600; color:#111; margin-bottom:8px;">
                    Piezas esenciales del mes
                  </div>
                  <div style="font-size:14px; color:#253028; line-height:1.7">
                    {{piezas_esenciales}}
                  </div>
                </td>
                <td width="50%" style="vertical-align:top;">
                  <img
                    src="https://thumbs.dreamstime.com/b/maquetaci%C3%B3n-de-ropa-elegante-para-mujeres-moda-fondo-rosa-pastel-con-una-copia-un-espacio-imitaci%C3%B3n-mesa-y-concepto-venta-184591762.jpg"
                    alt="Accesorios"
                    width="100%"
                    height="180"
                    style="
                      display:block;
                      width:100%;
                      height:180px;
                      object-fit:cover;
                      border:0;
                    "
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Cierre (texto original) -->
        <tr>
          <td 
            style="
              padding:20px 24px 8px;
              background-color:#000000; /* negro */
            "
          >
            <div style="font-size:14px; color:#e5e7eb; line-height:1.6;">
              Gracias por ser parte de Xianna. Nos encanta acompañarte a construir un estilo cada vez más auténtico y funcional.
            </div>
            <div style="font-size:14px; color:#ffffff; font-weight:600; margin-top:8px; padding-bottom: 15px">
              Equipo Xianna
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 24px; background-color:#f5f5f7; text-align:center; font-size:11px; color:#777;">
            <div>Xianna · Tu plataforma de moda personalizada</div>
            <div style="margin-top:4px;">
              Si no deseas recibir más emails,
              <a href="#" style="color:#ec4899; text-decoration:underline;">haz clic aquí</a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `
  },
  {
    id: '2',
name: 'Resumen Semanal Xianna',
subject: 'Tu resumen semanal de Xianna',
htmlContent: `
  <div style="background-color:#f7f4f5; padding:24px 0; font-family:'Helvetica Neue', Arial, sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background-color:#ffffff; border-collapse:collapse;">

      <!-- Franja superior tipo navbar -->
      <tr>
        <td style="padding:10px 24px; background-color:#fdf5f2;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#111827; font-weight:600;">
                Xianna · Resumen semanal
              </td>
              <td style="text-align:right; font-size:11px; color:#6b7280;">
                ACCESORIOS &nbsp;·&nbsp; PRENDAS &nbsp;·&nbsp; NUEVAS LLEGADAS
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hero rosa grande -->
      <tr>
        <td style="padding:26px 24px 22px; background-color:#f8c8d8; border-bottom:1px solid #e5e7eb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; text-align:center;">
            <tr>
              <td>
                <div style="font-size:12px; letter-spacing:0.20em; text-transform:uppercase; color:#111827; margin-bottom:6px;">
                  Xianna
                </div>
                <div style="font-size:30px; letter-spacing:0.18em; text-transform:uppercase; color:#111827; font-weight:500; line-height:1.1;">
                  Resumen semanal
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Cuerpo principal: foto izquierda + texto derecha -->
      <tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <!-- Columna foto (verde) -->
              <td width="52%" valign="top"
                  background="https://phantom-elmundo.unidadeditorial.es/e0c65b96ae9aa1c7b68e0cc57f8be70c/resize/640/assets/multimedia/imagenes/2022/03/21/16478765321292.jpg"
                  style="
                    background-size:cover;
                    background-position:center;
                    background-repeat:no-repeat;
                  ">
                <!-- spacer para Outlook -->
                <div style="height:260px; line-height:0; font-size:0;">&nbsp;</div>
              </td>

              <!-- Columna texto -->
              <td width="48%" valign="top" style="vertical-align:top; padding:20px 22px; background-color:#fefcfb;">
                <!-- Intro (mismo texto) -->
                <p style="color:#4b5563; font-size:14px; line-height:1.7; margin:0 0 16px 0;">
                  Este es tu resumen semanal de Xianna: una selección de outfits y recomendaciones pensadas para elevar tus looks al máximo y con propósito.
                </p>

                <!-- Esta semana destacamos (mismo contenido en formato tarjeta) -->
                <h2 style="color:#111827; font-size:18px; margin:0 0 10px 0;">
                  Esta semana destacamos:
                </h2>
                <ul style="color:#4b5563; line-height:1.8; margin:0 0 0 18px; padding:0; font-size:13px;">
                  <li>Looks sugeridos según tu estilo.</li>
                  <li>Piezas funcionales para mejorar tu edición diaria.</li>
                </ul>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Sección tipo “Discover This Week” en verde -->
      <tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <!-- Bloque verde con texto y edición -->
              <tr>
                <td style="background-color:#f7f4f5;">

                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; max-width:640px; margin:0 auto;">
                    <tr>

                      <!-- Tarjeta con título + looks -->
                      <td width="65%" valign="top" style="background-color:#ffffff; padding:18px 18px 16px; border:1px solid #e5e7eb;">
                        <div style="font-size:18px; color:#111827; font-weight:600; margin-bottom:10px;">
                          Edición de la semana
                        </div>

                        <div style="font-size:13px; color:#4b5563; line-height:1.7;">
                          <div style="max-width:360px;">
                            {{looks_semanal}}
                          </div>
                        </div>
                      </td>

                      <!-- Imagen editorial derecha -->
                      <td width="31%" valign="top" style="background-color:#d6e2c3;">
                        <img
                          src="https://i.etsystatic.com/15377516/r/il/398459/2229713449/il_570xN.2229713449_qz88.jpg"
                          alt="Edición de la semana"
                          width="100%"
                          height="220"
                          style="
                            display:block;
                            width:100%;
                            height:220px;
                            object-fit:cover;
                            border:0;
                          "
                        />
                      </td>

                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Imagen accesorios abajo derecha -->
              <td width="40%" valign="top">
                <img
                  src="https://hips.hearstapps.com/hmg-prod/images/alba-garavito-torre-wears-a-white-with-green-tree-leaf-news-photo-1624542973.jpg?crop=0.88889xw:1xh;center,top&resize=1200:*"
                  alt="Accesorios"
                  width="100%"
                  height="220"
                  style="
                    display:block;
                    width:100%;
                    height:220px;
                    object-fit:cover;
                    border:0;
                  "
                />
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Cierre negro -->
      <tr>
        <td 
          style="
            padding:20px 24px 10px;
            background-color:#000000;
          "
        >
          <p style="font-size:14px; color:#e5e7eb; line-height:1.6; margin:0 0 6px 0;">
            Gracias por acompañarnos.
          </p>
          <p style="font-size:14px; color:#ffffff; font-weight:600; margin:0; padding-bottom:14px;">
            Equipo Xianna
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 24px; background-color:#f5f5f7; text-align:center; font-size:11px; color:#777;">
          <div>Xianna - Tu plataforma de moda personalizada</div>
          <div style="margin-top:4px;">
            Si no deseas recibir más emails,
            <a href="#" style="color:#ec4899; text-decoration:underline;">haz clic aquí</a>
          </div>
        </td>
      </tr>

    </table>
  </div>
`

  },
  {
    id: '3',
    name: 'Newsletter Semanal WhatsApp',
    subject: 'Tu newsletter semanal de Xianna',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hola ✨</p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
          Gracias por ser parte de la comunidad Xianna. Cada semana recibirás inspiración, tips de estilo y recursos que te ayudarán a vestir con intención y facilidad.
        </p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 10px;">
          En este newsletter encontrarás:
        </p>
        <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin-bottom: 20px;">
          <li>Ideas de styling</li>
          <li>Recomendaciones prácticas</li>
          <li>Recursos y herramientas para tu clóset</li>
        </ul>

        <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 15px; margin-top: 25px;">
          Edición de hoy:
        </p>

        <div style="margin-bottom: 10px;">
          <p style="color: #4b5563; font-size: 15px; margin: 5px 0;">🌸 {{titulo_tema}}</p>
          <p style="color: #4b5563; font-size: 15px; margin: 5px 0;">🌸 {{enlace_recurso}}</p>
          <p style="color: #4b5563; font-size: 15px; margin: 5px 0;">🌸 {{cta_dia}}</p>
        </div>

        <p style="color: #4b5563; font-size: 15px; margin-top: 25px;">
          Gracias por estar aquí.
        </p>
        <p style="color: #4b5563; font-size: 15px; margin-top: 5px;">
          Xianna ✨
        </p>
      </div>
    `
  },
  {
    id: '4',
    name: 'Curaduría Semanal WhatsApp',
    subject: 'Tu curaduría semanal de Xianna',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hola🩷,</p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
          Bienvenida a tu selección semanal de estilo. En Xianna reunimos las mejores marcas mexicanas y recomendaciones diseñadas para acompañarte a construir un clóset más intencional, sofisticado y fiel a tu esencia.
        </p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 10px;">
          En esta edición:
        </p>
        <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin-bottom: 20px;">
          <li>Marcas nuevas que elevan la escena del diseño mexicano.</li>
          <li>Looks recomendados según tu tipo de estilo.</li>
          <li>Piezas esenciales para inspirar combinaciones versátiles.</li>
        </ul>

        <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 15px; margin-top: 25px;">
          Curaduría de hoy
        </p>

        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="color: #4b5563; font-size: 15px; margin: 0; white-space: pre-line;">{{marca_highlight}}</p>
        </div>

        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #4b5563; font-size: 15px; margin: 0; white-space: pre-line;">{{recomendaciones_estilo}}</p>
        </div>

        <p style="color: #4b5563; font-size: 15px; margin-top: 25px;">
          Gracias por ser parte de Xianna.
        </p>
        <p style="color: #4b5563; font-size: 15px; margin-top: 5px;">
          Equipo Xianna
        </p>
      </div>
    `
  }
]

export default function CreateNewsletterPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { selectedUsers, campaigns, loading, error } = useSelector((state: RootState) => state.newsletter)
  const { blogs } = useSelector((state: RootState) => state.blog)
  const { outfits } = useSelector((state: RootState) => state.outfit)

  const [formData, setFormData] = useState<NewsletterFormData>({
    nombre: '',
    asunto: '',
    template_usado: '',
    canal: 'correo', // 'correo' o 'whatsapp'
    filtros_aplicados: {},
    selectedEmails: [],
    looks_estilo: [],
    looks_semanal: []
  })

  const [filters, setFilters] = useState<NewsletterFilters>({})
  const [step, setStep] = useState<'details' | 'users' | 'preview'>('details')
  const [contentTypeMensual, setContentTypeMensual] = useState<'blogs' | 'outfits'>('outfits')
  const [contentTypeSemanal, setContentTypeSemanal] = useState<'blogs' | 'outfits'>('outfits')
  const [contentTypeWhatsAppNewsletter, setContentTypeWhatsAppNewsletter] = useState<'blogs' | 'outfits'>('outfits')
  const [contentTypeWhatsAppCuraduria, setContentTypeWhatsAppCuraduria] = useState<'blogs' | 'outfits'>('outfits')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappLinks, setWhatsappLinks] = useState<any[]>([])

  useEffect(() => {
    // Fetch campaigns to calculate email usage
    dispatch(fetchCampaigns())
    // Fetch blogs and outfits for content selection
    dispatch(fetchBlogs({ page: 1, pageSize: 100 }))
    dispatch(fetchOutfits({ page: 1, pageSize: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (step === 'users') {
      dispatch(fetchUsersForNewsletter())
    }
  }, [dispatch, step])

  // Calculate current email usage
  const totalEmailsSent = campaigns.reduce((total, campaign) => total + campaign.numero_usuarios_enviados, 0)
  const parsedEmailLimit = Number(process.env.NEXT_PUBLIC_NEWSLETTER_EMAIL_LIMIT ?? '1000')
  const emailLimit = Number.isFinite(parsedEmailLimit) && parsedEmailLimit > 0 ? parsedEmailLimit : 1000
  const remainingEmails = Math.max(emailLimit - totalEmailsSent, 0)
  const selectedEmailsCount = selectedUsers.filter(user => user.selected).length
  const wouldExceedLimit = totalEmailsSent + selectedEmailsCount > emailLimit
  const isNearLimit = totalEmailsSent >= emailLimit * 0.8

  // Apply filters to users for selection
  const filteredUsers = selectedUsers.filter(user => {
    if (filters.estado && user.estado !== filters.estado) return false
    if (filters.genero && user.genero !== filters.genero) return false
    if (filters.edad_min && user.edad < filters.edad_min) return false
    if (filters.edad_max && user.edad > filters.edad_max) return false
    if (filters.tipo_estilo && user.tipo_estilo.toString() !== filters.tipo_estilo) return false
    if (filters.ocupacion && user.ocupacion !== filters.ocupacion) return false
    return true
  })

  const selectedEmails = selectedUsers.filter(user => user.selected).map(user => user.correo)
  const selectedFilteredCount = filteredUsers.filter(user => user.selected).length

  const uniqueStates = Array.from(new Set(selectedUsers.map(user => user.estado).filter(Boolean)))
  const uniqueGenders = Array.from(new Set(selectedUsers.map(user => user.genero).filter(Boolean)))
  const uniqueOccupations = Array.from(new Set(selectedUsers.map(user => user.ocupacion).filter(Boolean)))

  const getStyleName = (tipoEstilo: number) => {
    const styleMap: { [key: number]: string } = {
      1: 'Casual', 2: 'Elegante', 3: 'Deportivo', 4: 'Boho',
      5: 'Minimalista', 6: 'Rockero', 7: 'Vintage'
    }
    return styleMap[tipoEstilo] || `Estilo ${tipoEstilo}`
  }

  // Handler para seleccionar/deseleccionar contenido (blogs/outfits) en plantilla mensual
  const handleLooksEstiloToggle = (itemId: number, itemType: 'blog' | 'outfit') => {
    const currentSelection = formData.looks_estilo || []
    const isSelected = currentSelection.some(item => item.id === itemId && item.type === itemType)
    const newSelection = isSelected
      ? currentSelection.filter(item => !(item.id === itemId && item.type === itemType))
      : [...currentSelection, { id: itemId, type: itemType }]
    setFormData(prev => ({ ...prev, looks_estilo: newSelection }))
  }

  // Handler para seleccionar/deseleccionar contenido (blogs/outfits) en plantilla semanal
  const handleLooksSemanalToggle = (itemId: number, itemType: 'blog' | 'outfit') => {
    const currentSelection = formData.looks_semanal || []
    const isSelected = currentSelection.some(item => item.id === itemId && item.type === itemType)
    const newSelection = isSelected
      ? currentSelection.filter(item => !(item.id === itemId && item.type === itemType))
      : [...currentSelection, { id: itemId, type: itemType }]
    setFormData(prev => ({ ...prev, looks_semanal: newSelection }))
  }

  // Handler para seleccionar/deseleccionar contenido (blogs/outfits) en plantilla WhatsApp newsletter
  const handleEnlaceRecursoToggle = (itemId: number, itemType: 'blog' | 'outfit') => {
    const currentSelection = formData.enlace_recurso || []
    const isSelected = currentSelection.some(item => item.id === itemId && item.type === itemType)
    const newSelection = isSelected
      ? currentSelection.filter(item => !(item.id === itemId && item.type === itemType))
      : [...currentSelection, { id: itemId, type: itemType }]
    setFormData(prev => ({ ...prev, enlace_recurso: newSelection }))
  }

  // Handler para seleccionar/deseleccionar contenido (blogs/outfits) en plantilla WhatsApp curaduría
  const handleRecomendacionesEstiloToggle = (itemId: number, itemType: 'blog' | 'outfit') => {
    const currentSelection = formData.recomendaciones_estilo || []
    const isSelected = currentSelection.some(item => item.id === itemId && item.type === itemType)
    const newSelection = isSelected
      ? currentSelection.filter(item => !(item.id === itemId && item.type === itemType))
      : [...currentSelection, { id: itemId, type: itemType }]
    setFormData(prev => ({ ...prev, recomendaciones_estilo: newSelection }))
  }

  // Obtener contenido seleccionado (blogs o outfits)
  const getContentList = (contentType: 'blogs' | 'outfits') => {
    return contentType === 'blogs' ? blogs : outfits
  }

  // Type guard para verificar si es un Blog
  const isBlog = (item: any): item is Blog => {
    return 'titulo' in item
  }

  // Generar HTML con enlaces de los items seleccionados
  const generateContentHTML = (selectedItems: Array<{ id: number; type: 'blog' | 'outfit' }>) => {
    return selectedItems
      .map(({ id, type }) => {
        // Buscar el item en el array correcto según su tipo
        const item = type === 'blog'
          ? blogs.find(b => b.id === id)
          : outfits.find(o => o.id === id)

        if (!item) return ''

        const isBlogItem = isBlog(item)

        const name = isBlogItem ? item.titulo : item.nombre
        const imageUrl = isBlogItem ? (item as Blog).image : (item as Outfit).imagen

        const url =
          type === 'blog'
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://xianna.com'}/blogs/${id}`
            : `${process.env.NEXT_PUBLIC_APP_URL || 'https://xianna.com'}/catalogo/${id}`

        return `
          <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
            ${
              imageUrl
                ? `<img
                    src="${imageUrl}"
                    alt="${name}"
                    style="width:72px; height:72px; object-fit:cover; border-radius:6px; border:1px solid #eee;"
                  />`
                : ''
            }
            <div>
              <a href="${url}" style="color:#ec4899; text-decoration:none; font-weight:500;">
                ${name}
              </a>
            </div>
          </div>
        `
      })
      .join('')
  }

  // Generar texto plano con enlaces para WhatsApp
  const generateContentPlainText = (selectedItems: Array<{ id: number; type: 'blog' | 'outfit' }>) => {
    return selectedItems
      .map(({ id, type }) => {
        // Buscar el item en el array correcto según su tipo
        const item = type === 'blog'
          ? blogs.find(b => b.id === id)
          : outfits.find(o => o.id === id)

        if (!item) return ''

        const isBlogItem = isBlog(item)
        const name = isBlogItem ? item.titulo : item.nombre

        const url =
          type === 'blog'
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://xianna.com'}/blogs/${id}`
            : `${process.env.NEXT_PUBLIC_APP_URL || 'https://xianna.com'}/catalogo/${id}`

        return `🌸 ${name}\n   ${url}`
      })
      .join('\n\n')
  }

  const handleNext = () => {
    if (step === 'details') {
      // Validar nombre y template siempre
      if (!formData.nombre || !formData.template_usado) {
        toast.error('Por favor completa todos los campos')
        return
      }
      // Validar asunto solo para correo electrónico
      if (formData.canal === 'correo' && !formData.asunto) {
        toast.error('Por favor completa el asunto del email')
        return
      }
      // Validar campos personalizables para la plantilla "Edición Mensual Xianna"
      if (formData.template_usado === '1') {
        if (!formData.nueva_marca || !formData.looks_estilo || formData.looks_estilo.length === 0 || !formData.piezas_esenciales) {
          toast.error('Por favor completa todos los campos personalizables de la edición mensual y selecciona al menos un blog u outfit')
          return
        }
      }
      // Validar campo personalizable para la plantilla "Resumen Semanal Xianna"
      if (formData.template_usado === '2') {
        if (!formData.looks_semanal || formData.looks_semanal.length === 0) {
          toast.error('Por favor selecciona al menos un blog u outfit para el resumen semanal')
          return
        }
      }
      // Validar campos personalizables para la plantilla "Newsletter Semanal WhatsApp"
      if (formData.template_usado === '3') {
        if (!formData.titulo_tema || !formData.enlace_recurso || formData.enlace_recurso.length === 0 || !formData.cta_dia) {
          toast.error('Por favor completa todos los campos personalizables y selecciona al menos un blog u outfit para el newsletter de WhatsApp')
          return
        }
      }
      // Validar campos personalizables para la plantilla "Curaduría Semanal WhatsApp"
      if (formData.template_usado === '4') {
        if (!formData.marca_highlight || !formData.recomendaciones_estilo || formData.recomendaciones_estilo.length === 0) {
          toast.error('Por favor completa todos los campos personalizables y selecciona al menos un blog u outfit para la curaduría de WhatsApp')
          return
        }
      }
      setStep('users')
    } else if (step === 'users') {
      if (selectedEmails.length === 0) {
        toast.error('Por favor selecciona al menos un usuario')
        return
      }
      // Only check email limit for email campaigns
      if (formData.canal === 'correo' && wouldExceedLimit) {
        toast.error(`No puedes seleccionar ${selectedEmailsCount} usuarios. Solo tienes ${remainingEmails} emails disponibles.`)
        return
      }
      // Store the applied filters and selected emails when moving to preview
      setFormData(prev => ({
        ...prev,
        filtros_aplicados: filters,
        selectedEmails: selectedEmails
      }))
      setStep('preview')
    }
  }

  const handleBack = () => {
    if (step === 'users') setStep('details')
    else if (step === 'preview') setStep('users')
  }

  const handleSubmit = async () => {
    try {
      // Final check before sending (only for email campaigns)
      if (formData.canal === 'correo' && wouldExceedLimit) {
        toast.error(`No se puede enviar la campaña. Excede el límite de emails por ${selectedEmailsCount - remainingEmails} usuarios.`)
        return
      }

      // Ensure we have the latest filters in formData
      const campaignDataWithFilters = {
        ...formData,
        filtros_aplicados: filters
      }

      const campaign = await dispatch(createCampaign(campaignDataWithFilters)).unwrap()

      // Send the newsletter with user data for personalization
      const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === formData.template_usado)
      const selectedUsersData = selectedUsers.filter(user => user.selected)

      if (selectedTemplate && selectedUsersData.length > 0) {
        // Reemplazar placeholders personalizables para las plantillas
        let htmlContent = selectedTemplate.htmlContent
        if (formData.template_usado === '1') {
          // Plantilla mensual de correo
          const looksHTML = generateContentHTML(formData.looks_estilo || [])
          htmlContent = htmlContent
            .replace(/\{\{nueva_marca\}\}/g, formData.nueva_marca || '')
            .replace(/\{\{looks_estilo\}\}/g, looksHTML)
            .replace(/\{\{piezas_esenciales\}\}/g, formData.piezas_esenciales || '')
        } else if (formData.template_usado === '2') {
          // Plantilla semanal de correo
          const looksHTML = generateContentHTML(formData.looks_semanal || [])
          htmlContent = htmlContent
            .replace(/\{\{looks_semanal\}\}/g, looksHTML)
        } else if (formData.template_usado === '3') {
          // Plantilla newsletter de WhatsApp
          const enlaceRecursoText = formData.enlace_recurso && formData.enlace_recurso.length > 0
            ? generateContentPlainText(formData.enlace_recurso)
            : ''
          htmlContent = htmlContent
            .replace(/\{\{titulo_tema\}\}/g, formData.titulo_tema || '')
            .replace(/\{\{enlace_recurso\}\}/g, enlaceRecursoText)
            .replace(/\{\{cta_dia\}\}/g, formData.cta_dia || '')
        } else if (formData.template_usado === '4') {
          // Plantilla curaduría de WhatsApp
          const recomendacionesText = formData.recomendaciones_estilo && formData.recomendaciones_estilo.length > 0
            ? generateContentPlainText(formData.recomendaciones_estilo)
            : ''
          htmlContent = htmlContent
            .replace(/\{\{marca_highlight\}\}/g, formData.marca_highlight || '')
            .replace(/\{\{recomendaciones_estilo\}\}/g, recomendacionesText)
        }

        // Check if this is a WhatsApp campaign
        if (formData.canal === 'whatsapp') {
          // For WhatsApp, generate wa.me links
          const result = await dispatch(sendWhatsAppCampaign({
            campaignId: campaign.id,
            users: selectedUsersData,
            template: {
              subject: selectedTemplate.subject,
              htmlContent: htmlContent
            }
          })).unwrap()

          console.log('WhatsApp campaign result:', result)

          // Open WhatsApp links in new tabs
          if (result.whatsappLinks && result.whatsappLinks.length > 0) {
            console.log(`Opening ${result.whatsappLinks.length} WhatsApp links...`)

            // Save links to state for modal
            setWhatsappLinks(result.whatsappLinks)

            // Show modal immediately
            setShowWhatsAppModal(true)

            toast.success(`Se generaron ${result.whatsappLinks.length} enlaces de WhatsApp.`, {
              duration: 5000,
              description: 'Haz clic en cada enlace para abrir WhatsApp'
            })

            // Show warnings for users without phone or failed users
            const warningMessages = []
            if (result.usersWithoutPhone && result.usersWithoutPhone.length > 0) {
              warningMessages.push(`${result.usersWithoutPhone.length} usuarios sin teléfono`)
            }
            if (result.failedUsers && result.failedUsers.length > 0) {
              warningMessages.push(`${result.failedUsers.length} usuarios con errores`)
            }
            if (warningMessages.length > 0) {
              toast.warning(warningMessages.join(', '))
            }

            // Store the links in localStorage as backup
            localStorage.setItem('whatsapp_links_backup', JSON.stringify(result.whatsappLinks))
            console.log('Enlaces guardados en localStorage como respaldo')
          } else {
            toast.error('No se pudieron generar enlaces de WhatsApp. Verifica que los usuarios tengan teléfonos registrados.')
          }
        } else {
          // For email, send via SendGrid
          await dispatch(sendNewsletterCampaign({
            campaignId: campaign.id,
            users: selectedUsersData,
            template: {
              subject: selectedTemplate.subject,
              htmlContent: htmlContent
            }
          })).unwrap()
        }
      }

      // Only show success toast for email campaigns
      // For WhatsApp, the success message is shown when links are generated
      if (formData.canal === 'correo') {
        toast.success('Campaña creada y enviada exitosamente')
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard/newsletter')
        }, 1000)
      }
      // For WhatsApp, don't redirect so user can use the modal
      // User will manually close the modal or navigate away when done
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la campaña'
      toast.error(message)
      console.error(error)
    }
  }

  const toggleUserSelect = (userId: number) => {
    dispatch(toggleUserSelection(userId))
  }

  const toggleSelectAll = () => {
    const allFilteredSelected = filteredUsers.every(user => user.selected)
    // Toggle selection only for filtered users
    filteredUsers.forEach(user => {
      if (user.selected === allFilteredSelected) {
        dispatch(toggleUserSelection(user.id))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Campaña</h1>
          <p className="text-gray-600 mt-2">
            Crea y envía una nueva campaña de newsletter
          </p>
        </div>
        <Link href="/dashboard/newsletter">
          <Button variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step === 'details' ? 'text-pink-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step === 'details' ? 'bg-pink-600 text-white' : 'bg-gray-200'
          }`}>1</div>
          <span>Detalles</span>
        </div>
        <div className={`flex items-center gap-2 ${step === 'users' ? 'text-pink-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step === 'users' ? 'bg-pink-600 text-white' : 'bg-gray-200'
          }`}>2</div>
          <span>Usuarios</span>
        </div>
        <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-pink-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step === 'preview' ? 'bg-pink-600 text-white' : 'bg-gray-200'
          }`}>3</div>
          <span>Enviar</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la campaña</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Promoción Primavera 2024"
              />
            </div>

            <div>
              <Label>Canal de envío</Label>
              <Select
                value={formData.canal}
                onValueChange={(value) => {
                  const newCanal = value as 'correo' | 'whatsapp'
                  setFormData(prev => {
                    // Si cambia a WhatsApp y tiene seleccionada plantilla de correo (3 o 4), resetear
                    const shouldResetFromCorreo = newCanal === 'whatsapp' && (prev.template_usado === '1' || prev.template_usado === '2')
                    // Si cambia a correo y tiene seleccionada plantilla de WhatsApp (5 o 6), resetear
                    const shouldResetFromWhatsApp = newCanal === 'correo' && (prev.template_usado === '3' || prev.template_usado === '4')
                    const shouldResetTemplate = shouldResetFromCorreo || shouldResetFromWhatsApp

                    return {
                      ...prev,
                      canal: newCanal,
                      template_usado: shouldResetTemplate ? '' : prev.template_usado,
                      // Resetear campos personalizables si se resetea el template
                      nueva_marca: shouldResetTemplate ? undefined : prev.nueva_marca,
                      looks_estilo: shouldResetTemplate ? [] : prev.looks_estilo,
                      piezas_esenciales: shouldResetTemplate ? undefined : prev.piezas_esenciales,
                      looks_semanal: shouldResetTemplate ? [] : prev.looks_semanal,
                      titulo_tema: shouldResetTemplate ? undefined : prev.titulo_tema,
                      enlace_recurso: shouldResetTemplate ? [] : prev.enlace_recurso,
                      cta_dia: shouldResetTemplate ? undefined : prev.cta_dia,
                      marca_highlight: shouldResetTemplate ? undefined : prev.marca_highlight,
                      recomendaciones_estilo: shouldResetTemplate ? [] : prev.recomendaciones_estilo,
                    }
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el canal de envío" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correo">Correo Electrónico</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de asunto solo para correo electrónico */}
            {formData.canal === 'correo' && (
              <div>
                <Label htmlFor="asunto">Asunto del email</Label>
                <Input
                  id="asunto"
                  value={formData.asunto}
                  onChange={(e) => setFormData(prev => ({ ...prev, asunto: e.target.value }))}
                  placeholder="Ej: ¡Nuevas tendencias de primavera!"
                />
              </div>
            )}

            <div>
              <Label>Template del {formData.canal === 'whatsapp' ? 'mensaje' : 'email'}</Label>
              <Select
                value={formData.template_usado}
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_usado: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un template" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.filter((template) => {
                    // Plantillas 3 y 4 (Mensual y Semanal de correo) solo para correo
                    if (template.id === '1' || template.id === '2') {
                      return formData.canal === 'correo'
                    }
                    // Plantillas 5 y 6 (Newsletter y Curaduría WhatsApp) solo para WhatsApp
                    if (template.id === '3' || template.id === '4') {
                      return formData.canal === 'whatsapp'
                    }
                    // Plantillas 1 y 2 disponibles para ambos canales
                    return true
                  }).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos personalizables para la plantilla "Edición Mensual Xianna" */}
            {formData.template_usado === '1' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Contenido personalizable
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Completa los siguientes campos para personalizar la edición mensual
                  </p>
                </div>

                <div>
                  <Label htmlFor="nueva_marca">Nueva marca + highlight</Label>
                  <Textarea
                    id="nueva_marca"
                    value={formData.nueva_marca || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, nueva_marca: e.target.value }))}
                    placeholder="Describe la nueva marca destacada del mes y sus características principales..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Looks por estilo + enlaces</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={contentTypeMensual === 'outfits' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeMensual('outfits')}
                      >
                        Outfits
                      </Button>
                      <Button
                        type="button"
                        variant={contentTypeMensual === 'blogs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeMensual('blogs')}
                      >
                        Blogs
                      </Button>
                    </div>

                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-3">
                        {formData.looks_estilo && formData.looks_estilo.length > 0
                          ? `${formData.looks_estilo.length} seleccionado(s)`
                          : 'Selecciona uno o más items'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {getContentList(contentTypeMensual).map((item) => {
                          const itemType = contentTypeMensual === 'blogs' ? 'blog' : 'outfit'
                          const isSelected = formData.looks_estilo?.some(
                            selected => selected.id === item.id && selected.type === itemType
                          ) || false

                          const isBlogItem = isBlog(item)
                          const blogItem = isBlogItem ? (item as Blog) : null
                          const outfitItem = !isBlogItem ? (item as Outfit) : null

                          const name = isBlogItem ? blogItem!.titulo : outfitItem!.nombre
                          const thumbnail = isBlogItem ? blogItem?.image : outfitItem?.imagen

                          return (
                            <Badge
                              key={`${itemType}-${item.id}`}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer justify-start text-left p-2 h-auto"
                              onClick={() => handleLooksEstiloToggle(item.id, itemType)}
                            >
                              <div className="flex items-center gap-2">
                                {thumbnail && (
                                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={thumbnail}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <span className="line-clamp-2 text-left text-xs sm:text-sm">
                                  {name}
                                </span>
                              </div>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="piezas_esenciales">Piezas esenciales del mes</Label>
                  <Textarea
                    id="piezas_esenciales"
                    value={formData.piezas_esenciales || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, piezas_esenciales: e.target.value }))}
                    placeholder="Lista las piezas clave del mes para actualizar el clóset..."
                    rows={4}
                  />
                </div>
              </>
            )}

            {/* Campo personalizable para la plantilla "Resumen Semanal Xianna" */}
            {formData.template_usado === '2' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Contenido personalizable
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona blogs u outfits para personalizar el resumen semanal
                  </p>
                </div>

                <div>
                  <Label>Looks por estilo + enlaces</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={contentTypeSemanal === 'outfits' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeSemanal('outfits')}
                      >
                        Outfits
                      </Button>
                      <Button
                        type="button"
                        variant={contentTypeSemanal === 'blogs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeSemanal('blogs')}
                      >
                        Blogs
                      </Button>
                    </div>

                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-3">
                        {formData.looks_semanal && formData.looks_semanal.length > 0
                          ? `${formData.looks_semanal.length} seleccionado(s)`
                          : 'Selecciona uno o más items'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {getContentList(contentTypeSemanal).map((item) => {
                          const itemType = contentTypeSemanal === 'blogs' ? 'blog' : 'outfit'
                          const isSelected = formData.looks_semanal?.some(
                            selected => selected.id === item.id && selected.type === itemType
                          ) || false

                          const isBlogItem = isBlog(item)
                          const blogItem = isBlogItem ? (item as Blog) : null
                          const outfitItem = !isBlogItem ? (item as Outfit) : null

                          const name = isBlogItem ? blogItem!.titulo : outfitItem!.nombre
                          const thumbnail = isBlogItem ? blogItem?.image : outfitItem?.imagen

                          return (
                            <Badge
                              key={`${itemType}-${item.id}`}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer justify-start text-left p-2 h-auto"
                              onClick={() => handleLooksSemanalToggle(item.id, itemType)}
                            >
                              <div className="flex items-center gap-2">
                                {thumbnail && (
                                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={thumbnail}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <span className="line-clamp-2 text-left text-xs sm:text-sm">
                                  {name}
                                </span>
                              </div>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Campos personalizables para la plantilla "Newsletter Semanal WhatsApp" */}
            {formData.template_usado === '3' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Contenido personalizable
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Completa los siguientes campos para personalizar el newsletter de WhatsApp
                  </p>
                </div>

                <div>
                  <Label htmlFor="titulo_tema">Título o tema</Label>
                  <Input
                    id="titulo_tema"
                    value={formData.titulo_tema || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo_tema: e.target.value }))}
                    placeholder="Ej: Looks minimalistas para primavera"
                  />
                </div>

                <div>
                  <Label>Enlace o recurso</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={contentTypeWhatsAppNewsletter === 'outfits' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeWhatsAppNewsletter('outfits')}
                      >
                        Outfits
                      </Button>
                      <Button
                        type="button"
                        variant={contentTypeWhatsAppNewsletter === 'blogs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeWhatsAppNewsletter('blogs')}
                      >
                        Blogs
                      </Button>
                    </div>

                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-3">
                        {formData.enlace_recurso && formData.enlace_recurso.length > 0
                          ? `${formData.enlace_recurso.length} seleccionado(s)`
                          : 'Selecciona uno o más items'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {getContentList(contentTypeWhatsAppNewsletter).map((item) => {
                          const itemType = contentTypeWhatsAppNewsletter === 'blogs' ? 'blog' : 'outfit'
                          const isSelected = formData.enlace_recurso?.some(
                            selected => selected.id === item.id && selected.type === itemType
                          ) || false

                          const isBlogItem = isBlog(item)
                          const blogItem = isBlogItem ? (item as Blog) : null
                          const outfitItem = !isBlogItem ? (item as Outfit) : null

                          const name = isBlogItem ? blogItem!.titulo : outfitItem!.nombre
                          const thumbnail = isBlogItem ? blogItem?.image : outfitItem?.imagen

                          return (
                            <Badge
                              key={`${itemType}-${item.id}`}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer justify-start text-left p-2 h-auto"
                              onClick={() => handleEnlaceRecursoToggle(item.id, itemType)}
                            >
                              <div className="flex items-center gap-2">
                                {thumbnail && (
                                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={thumbnail}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <span className="line-clamp-2 text-left text-xs sm:text-sm">
                                  {name}
                                </span>
                              </div>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cta_dia">CTA del día</Label>
                  <Input
                    id="cta_dia"
                    value={formData.cta_dia || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cta_dia: e.target.value }))}
                    placeholder="Ej: Descubre más en nuestra app"
                  />
                </div>
              </>
            )}

            {/* Campos personalizables para la plantilla "Curaduría Semanal WhatsApp" */}
            {formData.template_usado === '4' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Contenido personalizable
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Completa los siguientes campos para personalizar la curaduría de WhatsApp
                  </p>
                </div>

                <div>
                  <Label htmlFor="marca_highlight">Nueva marca + breve highlight</Label>
                  <Textarea
                    id="marca_highlight"
                    value={formData.marca_highlight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, marca_highlight: e.target.value }))}
                    placeholder="Describe la nueva marca y sus características destacadas..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Recomendaciones por estilo + enlaces</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={contentTypeWhatsAppCuraduria === 'outfits' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeWhatsAppCuraduria('outfits')}
                      >
                        Outfits
                      </Button>
                      <Button
                        type="button"
                        variant={contentTypeWhatsAppCuraduria === 'blogs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setContentTypeWhatsAppCuraduria('blogs')}
                      >
                        Blogs
                      </Button>
                    </div>

                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-3">
                        {formData.recomendaciones_estilo && formData.recomendaciones_estilo.length > 0
                          ? `${formData.recomendaciones_estilo.length} seleccionado(s)`
                          : 'Selecciona uno o más items'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {getContentList(contentTypeWhatsAppCuraduria).map((item) => {
                          const itemType = contentTypeWhatsAppCuraduria === 'blogs' ? 'blog' : 'outfit'
                          const isSelected = formData.recomendaciones_estilo?.some(
                            selected => selected.id === item.id && selected.type === itemType
                          ) || false

                          const isBlogItem = isBlog(item)
                          const blogItem = isBlogItem ? (item as Blog) : null
                          const outfitItem = !isBlogItem ? (item as Outfit) : null

                          const name = isBlogItem ? blogItem!.titulo : outfitItem!.nombre
                          const thumbnail = isBlogItem ? blogItem?.image : outfitItem?.imagen

                          return (
                            <Badge
                              key={`${itemType}-${item.id}`}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer justify-start text-left p-2 h-auto"
                              onClick={() => handleRecomendacionesEstiloToggle(item.id, itemType)}
                            >
                              <div className="flex items-center gap-2">
                                {thumbnail && (
                                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={thumbnail}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <span className="line-clamp-2 text-left text-xs sm:text-sm">
                                  {name}
                                </span>
                              </div>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'users' && (
        <div className="space-y-6">
          {/* Email Limit Warning - Only show for email campaigns */}
          {formData.canal === 'correo' && isNearLimit && (
            <div className={`rounded-lg p-4 border ${wouldExceedLimit ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${wouldExceedLimit ? 'text-red-600' : 'text-yellow-600'}`} />
                <div className="flex-1">
                  <h3 className={`font-medium ${wouldExceedLimit ? 'text-red-800' : 'text-yellow-800'}`}>
                    {wouldExceedLimit ? 'Límite de emails excedido' : 'Acercándose al límite de emails'}
                  </h3>
                  <p className={`text-sm mt-1 ${wouldExceedLimit ? 'text-red-600' : 'text-yellow-600'}`}>
                    {wouldExceedLimit
                      ? `Has seleccionado ${selectedEmailsCount} usuarios, pero solo tienes ${remainingEmails} emails disponibles de tu límite de ${emailLimit.toLocaleString()}.`
                      : `Has usado ${totalEmailsSent} de ${emailLimit.toLocaleString()} emails disponibles (${remainingEmails} restantes).`
                    }
                  </p>
                  {wouldExceedLimit && (
                    <p className="text-sm mt-1 text-red-600 font-medium">
                      Por favor, reduce la selección a máximo {remainingEmails} usuarios.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Info - Only show for WhatsApp campaigns */}
          {formData.canal === 'whatsapp' && (
            <div className="rounded-lg p-4 border bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-green-800">
                    Campaña de WhatsApp
                  </h3>
                  <p className="text-sm mt-1 text-green-600">
                    Se generarán enlaces de WhatsApp para {selectedEmailsCount} usuarios seleccionados. Los enlaces se abrirán automáticamente en nuevas pestañas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros para Selección de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Utiliza estos filtros para encontrar usuarios específicos para tu campaña.
              </p>
              
              {/* Active filters summary */}
              {(filters.estado || filters.genero || filters.edad_min || filters.edad_max || filters.tipo_estilo || filters.ocupacion) && (
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium text-pink-700">Filtros activos:</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters({})}
                      className="text-pink-600 border-pink-300 hover:bg-pink-100"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filters.estado && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Estado: {filters.estado}</span>}
                    {filters.genero && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Género: {filters.genero}</span>}
                    {filters.edad_min && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Edad min: {filters.edad_min}</span>}
                    {filters.edad_max && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Edad max: {filters.edad_max}</span>}
                    {filters.tipo_estilo && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Estilo: {filters.tipo_estilo}</span>}
                    {filters.ocupacion && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Ocupación: {filters.ocupacion}</span>}
                  </div>
                  <p className="text-sm text-pink-600 mt-2">
                    Mostrando {filteredUsers.length} de {selectedUsers.length} usuarios
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Estado</Label>
                  <Select value={filters.estado || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, estado: value || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStates.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Género</Label>
                  <Select value={filters.genero || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, genero: value || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los géneros" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueGenders.map((gender) => (
                        <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Ocupación</Label>
                  <Select value={filters.ocupacion || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, ocupacion: value || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las ocupaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueOccupations.map((occupation) => (
                        <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Edad mínima</Label>
                  <Input
                    type="number"
                    value={filters.edad_min || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, edad_min: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Ej: 18"
                  />
                </div>
                
                <div>
                  <Label>Edad máxima</Label>
                  <Input
                    type="number"
                    value={filters.edad_max || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, edad_max: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Ej: 65"
                  />
                </div>

                <div>
                  <Label>Tipo de Estilo</Label>
                  <Select value={filters.tipo_estilo || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo_estilo: value || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estilos" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((styleId) => (
                        <SelectItem key={styleId} value={styleId.toString()}>
                          {getStyleName(styleId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Seleccionar Usuarios</CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {selectedFilteredCount} de {filteredUsers.length} seleccionados
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedFilteredCount === filteredUsers.length && filteredUsers.length > 0 ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Deseleccionar todos
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Seleccionar todos
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelect(user.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        user.selected ? 'bg-pink-50 border-pink-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 rounded ${
                          user.selected 
                            ? 'bg-pink-600 border-pink-600' 
                            : 'border-gray-300'
                        } flex items-center justify-center`}>
                          {user.selected && (
                            <CheckSquare className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.nombre}</h4>
                          <p className="text-sm text-gray-600">{user.correo}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {user.estado}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {user.genero}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {user.edad} años
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getStyleName(user.tipo_estilo)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de la Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                <p className="text-lg">{formData.nombre}</p>
              </div>
              {formData.canal === 'correo' && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Asunto</Label>
                  <p className="text-lg">{formData.asunto}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-500">Template</Label>
                <p className="text-lg">
                  {EMAIL_TEMPLATES.find(t => t.id === formData.template_usado)?.name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Canal de envío</Label>
                <p className="text-lg">
                  {formData.canal === 'correo' ? 'Correo Electrónico' : 'WhatsApp'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Usuarios seleccionados</Label>
                <p className="text-lg">{selectedEmails.length}</p>
                {formData.canal === 'correo' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {remainingEmails - selectedEmailsCount} emails restantes después del envío
                  </p>
                )}
                {formData.canal === 'whatsapp' && (
                  <p className="text-xs text-green-600 mt-1">
                    Se generarán {selectedEmails.length} enlaces de WhatsApp
                  </p>
                )}
              </div>
            </div>
            
            {/* Applied Filters Summary */}
            {formData.filtros_aplicados && Object.keys(formData.filtros_aplicados).length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Filtros aplicados</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.filtros_aplicados.estado && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      Estado: {formData.filtros_aplicados.estado}
                    </span>
                  )}
                  {formData.filtros_aplicados.genero && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      Género: {formData.filtros_aplicados.genero}
                    </span>
                  )}
                  {formData.filtros_aplicados.edad_min && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      Edad min: {formData.filtros_aplicados.edad_min}
                    </span>
                  )}
                  {formData.filtros_aplicados.edad_max && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      Edad max: {formData.filtros_aplicados.edad_max}
                    </span>
                  )}
                  {formData.filtros_aplicados.tipo_estilo && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      Estilo: {getStyleName(parseInt(formData.filtros_aplicados.tipo_estilo))}
                    </span>
                  )}
                  {formData.filtros_aplicados.ocupacion && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      Ocupación: {formData.filtros_aplicados.ocupacion}
                    </span>
                  )}
                  {Object.keys(formData.filtros_aplicados).length === 0 && (
                    <span className="text-gray-500 text-sm">Sin filtros aplicados</span>
                  )}
                </div>
              </div>
            )}

            {/* Vista previa de la plantilla */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium text-gray-500 mb-3 block">
                Vista previa de la plantilla {formData.canal === 'whatsapp' && '(texto plano para WhatsApp)'}
              </Label>
              {formData.canal === 'whatsapp' ? (
                // Vista previa en texto plano para WhatsApp
                <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                  {(() => {
                    const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === formData.template_usado)
                    if (!selectedTemplate) return 'Selecciona una plantilla para ver la vista previa'

                    let htmlContent = selectedTemplate.htmlContent

                    // Reemplazar placeholders según la plantilla
                    if (formData.template_usado === '1') {
                      const looksHTML = formData.looks_estilo && formData.looks_estilo.length > 0
                        ? generateContentHTML(formData.looks_estilo)
                        : '[Selecciona blogs u outfits]'
                      htmlContent = htmlContent
                        .replace(/\{\{nueva_marca\}\}/g, formData.nueva_marca || '[Nueva marca + highlight]')
                        .replace(/\{\{looks_estilo\}\}/g, looksHTML)
                        .replace(/\{\{piezas_esenciales\}\}/g, formData.piezas_esenciales || '[Piezas esenciales del mes]')
                    } else if (formData.template_usado === '2') {
                      const looksHTML = formData.looks_semanal && formData.looks_semanal.length > 0
                        ? generateContentHTML(formData.looks_semanal)
                        : '[Selecciona blogs u outfits]'
                      htmlContent = htmlContent
                        .replace(/\{\{looks_semanal\}\}/g, looksHTML)
                    } else if (formData.template_usado === '3') {
                      const enlaceRecursoText = formData.enlace_recurso && formData.enlace_recurso.length > 0
                        ? generateContentPlainText(formData.enlace_recurso)
                        : '[Selecciona blogs u outfits]'
                      htmlContent = htmlContent
                        .replace(/\{\{titulo_tema\}\}/g, formData.titulo_tema || '[Título o tema]')
                        .replace(/\{\{enlace_recurso\}\}/g, enlaceRecursoText)
                        .replace(/\{\{cta_dia\}\}/g, formData.cta_dia || '[CTA del día]')
                    } else if (formData.template_usado === '4') {
                      const recomendacionesText = formData.recomendaciones_estilo && formData.recomendaciones_estilo.length > 0
                        ? generateContentPlainText(formData.recomendaciones_estilo)
                        : '[Selecciona blogs u outfits]'
                      htmlContent = htmlContent
                        .replace(/\{\{marca_highlight\}\}/g, formData.marca_highlight || '[Nueva marca + breve highlight]')
                        .replace(/\{\{recomendaciones_estilo\}\}/g, recomendacionesText)
                    }

                    // Reemplazar placeholders generales con valores de ejemplo
                    htmlContent = htmlContent
                      .replace(/\{\{nombre\}\}/g, 'Usuario')
                      .replace(/\{\{tipo_estilo\}\}/g, 'Casual')
                      .replace(/\{\{estado\}\}/g, 'Ciudad de México')
                      .replace(/\{\{tipo_cuerpo\}\}/g, 'Rectángulo')

                    // Convertir HTML a texto plano para WhatsApp
                    const plainText = htmlToPlainText(htmlContent)
                    const fullMessage = `*${selectedTemplate.subject}*\n\n${plainText}`

                    return fullMessage
                  })()}
                </div>
              ) : (
                // Vista previa en HTML para email
                <div
                  className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === formData.template_usado)
                      if (!selectedTemplate) return '<p>Selecciona una plantilla para ver la vista previa</p>'

                      let htmlContent = selectedTemplate.htmlContent

                      // Reemplazar placeholders según la plantilla
                      if (formData.template_usado === '1') {
                        const looksHTML = formData.looks_estilo && formData.looks_estilo.length > 0
                          ? generateContentHTML(formData.looks_estilo)
                          : '[Selecciona blogs u outfits]'
                        htmlContent = htmlContent
                          .replace(/\{\{nueva_marca\}\}/g, formData.nueva_marca || '[Nueva marca + highlight]')
                          .replace(/\{\{looks_estilo\}\}/g, looksHTML)
                          .replace(/\{\{piezas_esenciales\}\}/g, formData.piezas_esenciales || '[Piezas esenciales del mes]')
                      } else if (formData.template_usado === '2') {
                        const looksHTML = formData.looks_semanal && formData.looks_semanal.length > 0
                          ? generateContentHTML(formData.looks_semanal)
                          : '[Selecciona blogs u outfits]'
                        htmlContent = htmlContent
                          .replace(/\{\{looks_semanal\}\}/g, looksHTML)
                      } else if (formData.template_usado === '3') {
                        const enlaceRecursoText = formData.enlace_recurso && formData.enlace_recurso.length > 0
                          ? generateContentPlainText(formData.enlace_recurso)
                          : '[Selecciona blogs u outfits]'
                        htmlContent = htmlContent
                          .replace(/\{\{titulo_tema\}\}/g, formData.titulo_tema || '[Título o tema]')
                          .replace(/\{\{enlace_recurso\}\}/g, enlaceRecursoText)
                          .replace(/\{\{cta_dia\}\}/g, formData.cta_dia || '[CTA del día]')
                      } else if (formData.template_usado === '4') {
                        const recomendacionesText = formData.recomendaciones_estilo && formData.recomendaciones_estilo.length > 0
                          ? generateContentPlainText(formData.recomendaciones_estilo)
                          : '[Selecciona blogs u outfits]'
                        htmlContent = htmlContent
                          .replace(/\{\{marca_highlight\}\}/g, formData.marca_highlight || '[Nueva marca + breve highlight]')
                          .replace(/\{\{recomendaciones_estilo\}\}/g, recomendacionesText)
                      }

                      // Reemplazar placeholders generales con valores de ejemplo
                      htmlContent = htmlContent
                        .replace(/\{\{nombre\}\}/g, 'Usuario')
                        .replace(/\{\{tipo_estilo\}\}/g, 'Casual')
                        .replace(/\{\{estado\}\}/g, 'Ciudad de México')
                        .replace(/\{\{tipo_cuerpo\}\}/g, 'Rectángulo')

                      return htmlContent
                    })()
                  }}
                />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Usuarios seleccionados</Label>
              <div className="mt-2 text-sm text-gray-600 max-h-32 overflow-y-auto border rounded p-2">
                {selectedEmails.join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {step !== 'details' && (
            <Button variant="outline" onClick={handleBack}>
              Anterior
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {step !== 'preview' ? (
            <Button onClick={handleNext}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Campaña'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* WhatsApp Links Modal */}
      <WhatsAppLinksModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false)
          router.push('/dashboard/newsletter')
        }}
        links={whatsappLinks}
      />
    </div>
  )
}
