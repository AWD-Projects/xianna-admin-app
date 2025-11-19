'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  fetchCampaigns,
  fetchUsersForNewsletter, 
  createCampaign, 
  toggleUserSelection, 
  selectAllUsers,
  clearSelectedUsers,
  sendNewsletterCampaign
} from '@/store/slices/newsletterSlice'
import type { AppDispatch, RootState } from '@/store'
import type { NewsletterFormData, NewsletterFilters, SelectedUser } from '@/types'
import { Send, Users, Filter, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const EMAIL_TEMPLATES = [
  {
    id: '1',
    name: 'Promoción de Estilo',
    subject: '¡Descubre tu nuevo estilo favorito!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">¡Hola {{nombre}}!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Tenemos nuevas tendencias especialmente para ti</p>
        </header>
        <main style="padding: 40px 20px;">
          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Nuevas Tendencias de Moda</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Descubre las últimas tendencias en moda que se adaptan perfectamente a tu estilo {{tipo_estilo}}. 
            Nuestros expertos han seleccionado las mejores piezas para ti desde {{estado}}.
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">¿Sabías que?</h3>
            <p style="color: #4b5563; margin-bottom: 0;">
              Más del 80% de nuestros usuarios han encontrado su outfit perfecto siguiendo nuestras recomendaciones personalizadas.
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ver Nuevas Tendencias
            </a>
          </div>
        </main>
        <footer style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Xianna - Tu plataforma de moda personalizada</p>
          <p>Si no deseas recibir más emails, <a href="#" style="color: #ec4899;">haz clic aquí</a></p>
        </footer>
      </div>
    `
  },
  {
    id: '2',
    name: 'Consejos de Outfit',
    subject: 'Consejos personalizados para tu guardarropa',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Hola {{nombre}}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Consejos de moda especialmente para ti</p>
        </header>
        <main style="padding: 40px 20px;">
          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Tips de Styling Personal</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Como alguien con estilo {{tipo_estilo}} y tipo de cuerpo {{tipo_cuerpo}}, hemos preparado 
            consejos especiales para que luzcas increíble en cualquier ocasión.
          </p>
          <div style="border-left: 4px solid #3b82f6; padding-left: 20px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Consejo del día</h3>
            <p style="color: #4b5563; margin-bottom: 0;">
              Las prendas que mejor se adaptan a tu tipo de cuerpo son aquellas que realzan tus mejores atributos. 
              ¡Descubre cuáles son en nuestra nueva guía!
            </p>
          </div>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Combina colores que complementen tu tono de piel</li>
            <li>Elige texturas que favorezcan tu figura</li>
            <li>Experimenta con accesorios para personalizar tu look</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ver Guía Completa
            </a>
          </div>
        </main>
        <footer style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Xianna - Tu consultor de moda personal</p>
          <p>Si no deseas recibir más emails, <a href="#" style="color: #3b82f6;">haz clic aquí</a></p>
        </footer>
      </div>
    `
  }
]

export default function CreateNewsletterPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { selectedUsers, campaigns, loading, error } = useSelector((state: RootState) => state.newsletter)
  
  const [formData, setFormData] = useState<NewsletterFormData>({
    nombre: '',
    asunto: '',
    template_usado: '',
    filtros_aplicados: {},
    selectedEmails: []
  })
  
  const [filters, setFilters] = useState<NewsletterFilters>({})
  const [step, setStep] = useState<'details' | 'users' | 'preview'>('details')

  useEffect(() => {
    // Fetch campaigns to calculate email usage
    dispatch(fetchCampaigns())
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

  const handleNext = () => {
    if (step === 'details') {
      if (!formData.nombre || !formData.asunto || !formData.template_usado) {
        toast.error('Por favor completa todos los campos')
        return
      }
      setStep('users')
    } else if (step === 'users') {
      if (selectedEmails.length === 0) {
        toast.error('Por favor selecciona al menos un usuario')
        return
      }
      if (wouldExceedLimit) {
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
      // Final check before sending
      if (wouldExceedLimit) {
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
        await dispatch(sendNewsletterCampaign({
          campaignId: campaign.id,
          users: selectedUsersData,
          template: {
            subject: selectedTemplate.subject,
            htmlContent: selectedTemplate.htmlContent
          }
        })).unwrap()
      }
      
      toast.success('Campaña creada y enviada exitosamente')
      router.push('/dashboard/newsletter')
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
              <Label htmlFor="asunto">Asunto del email</Label>
              <Input
                id="asunto"
                value={formData.asunto}
                onChange={(e) => setFormData(prev => ({ ...prev, asunto: e.target.value }))}
                placeholder="Ej: ¡Nuevas tendencias de primavera!"
              />
            </div>
            
            <div>
              <Label>Template del email</Label>
              <Select 
                value={formData.template_usado} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_usado: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un template" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'users' && (
        <div className="space-y-6">
          {/* Email Limit Warning */}
          {isNearLimit && (
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
              <div>
                <Label className="text-sm font-medium text-gray-500">Asunto</Label>
                <p className="text-lg">{formData.asunto}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Template</Label>
                <p className="text-lg">
                  {EMAIL_TEMPLATES.find(t => t.id === formData.template_usado)?.name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Usuarios seleccionados</Label>
                <p className="text-lg">{selectedEmails.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {remainingEmails - selectedEmailsCount} emails restantes después del envío
                </p>
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
            
            <div>
              <Label className="text-sm font-medium text-gray-500">Vista previa de emails</Label>
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
    </div>
  )
}
